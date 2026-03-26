import { useState, useEffect } from 'react';
import { Task } from '../types';
import { TaskService } from '../services/taskService';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshTasks = () => {
    setTasks(TaskService.getTasks());
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const addTask = (task: Omit<Task, 'id'>) => {
    TaskService.addTask(task);
    refreshTasks();
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    TaskService.updateTask(id, updates);
    refreshTasks();
  };

  const deleteTask = (id: string) => {
    TaskService.deleteTask(id);
    refreshTasks();
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
};