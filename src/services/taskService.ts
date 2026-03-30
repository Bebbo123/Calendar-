import { Task, SubTask } from '../types';
import { generateRecurrenceDates } from '../utils/recurrenceUtils';
import {
  useFirebase,
  syncTasksFromFirebase,
  addOrUpdateTaskFirebase,
  deleteTaskFirebase,
} from './firebaseService';

const STORAGE_KEY = 'smart-calendar-tasks';
const useRemote = useFirebase();

export class TaskService {
  static isRemoteEnabled(): boolean {
    return useRemote;
  }
  static getTasks(): Task[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((task: any) => ({
      ...task,
      date: new Date(task.date),
      recurrence: task.recurrence
        ? {
            from: new Date(task.recurrence.from),
            to: new Date(task.recurrence.to),
            frequency: task.recurrence.frequency,
          }
        : undefined,
    }));
  }

  static async syncTasks(): Promise<Task[]> {
    if (!useRemote) return this.getTasks();
    const remote = await syncTasksFromFirebase();
    if (remote.length > 0) {
      this.saveTasks(remote);
    }
    return remote;
  }

  static saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  static addTask(task: Omit<Task, 'id'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    if (useRemote) {
      addOrUpdateTaskFirebase(newTask).catch(console.error);
    }
    return newTask;
  }

  static addRecurringTasks(task: Omit<Task, 'id'>): Task[] {
    if (!task.recurrence) {
      return [this.addTask(task)];
    }

    const dates = generateRecurrenceDates(task.recurrence);
    const tasks = this.getTasks();

    // Create a recurring template item (non-displayed, controls instances)
    const templateTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      isRecurringTemplate: true,
    };

    tasks.push(templateTask);
    const created: Task[] = [templateTask];

    dates.forEach((date: Date) => {
      const recurringTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        date,
        recurrence: undefined,
        recurrenceMasterId: templateTask.id,
        isRecurringTemplate: false,
      };
      tasks.push(recurringTask);
      created.push(recurringTask);
    });

    this.saveTasks(tasks);
    return created;
  }

  static updateTask(id: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveTasks(tasks);
      if (useRemote) {
        addOrUpdateTaskFirebase(tasks[index]).catch(console.error);
      }
    }
  }

  static addSubTask(taskId: string, subtask: Omit<SubTask, 'id'>): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      if (!task.subtasks) task.subtasks = [];
      const newSubTask: SubTask = {
        id: crypto.randomUUID(),
        title: subtask.title,
        completed: subtask.completed,
      };
      task.subtasks.push(newSubTask);
      this.saveTasks(tasks);
    }
  }

  static updateSubTask(taskId: string, subtaskId: string, updates: Partial<SubTask>): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      if (task.subtasks) {
        const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
        if (subtaskIndex !== -1) {
          task.subtasks[subtaskIndex] = { ...task.subtasks[subtaskIndex], ...updates };
          this.saveTasks(tasks);
        }
      }
    }
  }

  static deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(task => task.id !== taskId);
    this.saveTasks(filtered);
    if (useRemote) {
      deleteTaskFirebase(taskId).catch(console.error);
    }
  }

  static deleteSubTask(taskId: string, subtaskId: string): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      if (task.subtasks) {
        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        this.saveTasks(tasks);
      }
    }
  }

  static getTaskCompletionPercentage(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.completed ? 100 : 0;
    }
    const completedCount = task.subtasks.filter(st => st.completed).length;
    return Math.round((completedCount / task.subtasks.length) * 100);
  }
}