export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum Category {
  Work = 'work',
  Personal = 'personal',
  Finance = 'finance',
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: Date;
  category: Category;
  priority: Priority;
  notes?: string;
  completed: boolean;
  subtasks?: SubTask[];
}