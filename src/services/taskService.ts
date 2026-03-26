import { Task, SubTask } from '../types';

const STORAGE_KEY = 'smart-calendar-tasks';

export class TaskService {
  static getTasks(): Task[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((task: any) => ({
      ...task,
      date: new Date(task.date),
    }));
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
    return newTask;
  }

  static updateTask(id: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveTasks(tasks);
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