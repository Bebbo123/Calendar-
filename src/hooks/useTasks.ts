import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { TaskService } from '../services/taskService';
import { onTasksChange, syncTasksFromSupabase } from '../services/supabaseService';

export const useTasks = (userId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Funzione per ricaricare i task da Supabase/localStorage
  const refreshTasks = useCallback(async () => {
    if (!userId) return;
    
    try {
      const loaded = await TaskService.syncTasks(userId);
      setTasks(loaded);
    } catch (error) {
      console.error('Errore refresh task:', error);
      setTasks(TaskService.getTasks());
    }
  }, [userId]);

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

    // Ascolta i cambiamenti in tempo reale da Supabase
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
    // Refresh immediato dopo aggiunta
    await refreshTasks();
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!userId) return;
    await TaskService.updateTask(userId, id, updates);
    // Refresh immediato dopo aggiornamento
    await refreshTasks();
  };

  const deleteTask = async (id: string) => {
    if (!userId) return;
    // Rimuovi localmente subito per UI responsiva
    setTasks(prev => prev.filter(t => t.id !== id));
    await TaskService.deleteTask(userId, id);
    // Poi sincronizza con il server
    await refreshTasks();
  };

  const addRecurringTasks = async (task: Omit<Task, 'id'>) => {
    if (!userId) return;
    await TaskService.addRecurringTasks(userId, task);
    // Refresh immediato dopo aggiunta ricorrenti
    await refreshTasks();
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    addRecurringTasks,
    loading,
    refreshTasks,
  };
};