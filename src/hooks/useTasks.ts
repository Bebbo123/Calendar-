import { useState, useEffect } from 'react';
import { Task } from '../types';
import { TaskService } from '../services/taskService';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshTasks = async () => {
    const loaded = await TaskService.syncTasks();
    setTasks(loaded);
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const addTask = async (task: Omit<Task, 'id'>) => {
    TaskService.addTask(task);
    await refreshTasks();
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    TaskService.updateTask(id, updates);
    await refreshTasks();
  };

  const deleteTask = async (id: string) => {
    TaskService.deleteTask(id);
    await refreshTasks();
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
};