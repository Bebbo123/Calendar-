import { Task, SubTask } from '../types';
import { generateRecurrenceDates } from '../utils/recurrenceUtils';
import {
  isSupabaseEnabled,
  syncTasksFromSupabase,
  addOrUpdateTaskSupabase,
  deleteTaskSupabase,
} from './supabaseService';

const STORAGE_KEY = 'smart-calendar-tasks';
const useRemote = isSupabaseEnabled();

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

  static async syncTasks(userId: string): Promise<Task[]> {
    if (!useRemote || !userId) {
      return this.getTasks();
    }
    
    try {
      const remote = await syncTasksFromSupabase(userId);
      if (remote.length > 0) {
        this.saveTasks(remote);
      }
      return remote;
    } catch (error) {
      console.error('Errore sync:', error);
      return this.getTasks();
    }
  }

  static saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  static async addTask(userId: string, task: Omit<Task, 'id'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
    };

    if (useRemote && userId) {
      try {
        await addOrUpdateTaskSupabase(userId, newTask);
      } catch (error) {
        console.error('Errore salvataggio task:', error);
      }
    }

    // Salva anche in localStorage come fallback
    const tasks = this.getTasks();
    tasks.push(newTask);
    this.saveTasks(tasks);

    return newTask;
  }

  static async addRecurringTasks(userId: string, task: Omit<Task, 'id'>): Promise<Task[]> {
    if (!task.recurrence) {
      return [await this.addTask(userId, task)];
    }

    const dates = generateRecurrenceDates(task.recurrence);
    const tasks = this.getTasks();

    // Create a recurring template item
    const templateTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      isRecurringTemplate: true,
    };

    tasks.push(templateTask);
    const created: Task[] = [templateTask];

    if (useRemote && userId) {
      try {
        await addOrUpdateTaskSupabase(userId, templateTask);
      } catch (error) {
        console.error('Errore salvataggio template:', error);
      }
    }

    dates.forEach(async (date: Date) => {
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

      if (useRemote && userId) {
        try {
          await addOrUpdateTaskSupabase(userId, recurringTask);
        } catch (error) {
          console.error('Errore salvataggio ricorrente:', error);
        }
      }
    });

    this.saveTasks(tasks);
    return created;
  }

  static async updateTask(userId: string, id: string, updates: Partial<Task>): Promise<void> {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveTasks(tasks);
      
      if (useRemote && userId) {
        try {
          await addOrUpdateTaskSupabase(userId, tasks[index]);
        } catch (error) {
          console.error('Errore aggiornamento task:', error);
        }
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

  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const tasks = this.getTasks();
    const filtered = tasks.filter(task => task.id !== taskId);
    this.saveTasks(filtered);
    
    if (useRemote && userId) {
      try {
        await deleteTaskSupabase(userId, taskId);
      } catch (error) {
        console.error('Errore eliminazione task:', error);
      }
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