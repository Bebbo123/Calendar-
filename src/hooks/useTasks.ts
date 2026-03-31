import { useState, useEffect } from 'react';
import { Task } from '../types';
import { TaskService } from '../services/taskService';
import { onTasksChange } from '../services/supabaseService';

export const useTasks = (userId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Sync iniziale dal server
    const initTasks = async () => {
      try {
        const loaded = await TaskService.syncTasks(userId);
        setTasks(loaded);
      } catch (error) {
        console.error('Errore caricamento task:', error);
        setTasks(TaskService.getTasks());
      } finally {
        setLoading(false);
      }
    };

    initTasks();

    // Ascolta i cambiamenti in tempo reale da Firebase
    if (TaskService.isRemoteEnabled()) {
      const unsubscribe = onTasksChange(userId, (updatedTasks) => {
        setTasks(updatedTasks);
        // Salva anche localmente come fallback
        TaskService.saveTasks(updatedTasks);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [userId]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!userId) return;
    await TaskService.addTask(userId, task);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;
    await TaskService.updateTask(userId, id, updates);
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;
    await TaskService.deleteTask(userId, id);
  };

  const addRecurringTasks = async (task: Omit<Task, 'id'>) => {
    if (!userId) return;
    await TaskService.addRecurringTasks(userId, task);
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    addRecurringTasks,
    loading,
  };
};