import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Task } from '../types';

declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

// Configurazione Supabase - Sostituisci con i tuoi valori da https://app.supabase.com
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export const isSupabaseEnabled = (): boolean => {
  return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
};

export const initializeSupabase = (): SupabaseClient | null => {
  if (!isSupabaseEnabled()) {
    console.warn('Supabase non configurato. Usa solo localStorage.');
    return null;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return supabase;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabase && isSupabaseEnabled()) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
};

// ============ AUTENTICAZIONE ============

export const getCurrentUser = async () => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  return user;
};

export const registerUser = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase non configurato');

  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
};

export const loginUser = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase non configurato');

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
};

export const logoutUser = async () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase non configurato');

  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const onAuthChange = (callback: (user: any) => void) => {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription?.unsubscribe();
};

// ============ TASKS OPERATIONS ============

const parseTaskFromDB = (dbTask: any): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    date: new Date(dbTask.date),
    category: dbTask.category,
    priority: dbTask.priority,
    notes: dbTask.notes,
    completed: dbTask.completed || false,
    subtasks: dbTask.subtasks || [],
    recurrence: dbTask.recurrence
      ? {
          from: new Date(dbTask.recurrence.from),
          to: new Date(dbTask.recurrence.to),
          frequency: dbTask.recurrence.frequency,
        }
      : undefined,
    recurrenceMasterId: dbTask.recurrence_master_id,
    isRecurringTemplate: dbTask.is_recurring_template,
  };
};

const taskToDBFormat = (task: Task) => ({
  title: task.title,
  date: task.date.toISOString(),
  category: task.category,
  priority: task.priority,
  notes: task.notes,
  completed: task.completed,
  subtasks: task.subtasks || [],
  recurrence: task.recurrence
    ? {
        from: task.recurrence.from.toISOString(),
        to: task.recurrence.to.toISOString(),
        frequency: task.recurrence.frequency,
      }
    : null,
  recurrence_master_id: task.recurrenceMasterId,
  is_recurring_template: task.isRecurringTemplate,
});

export const syncTasksFromSupabase = async (userId: string): Promise<Task[]> => {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  try {
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Errore sync Supabase:', error);
      return [];
    }

    return (data || []).map(parseTaskFromDB);
  } catch (error) {
    console.error('Errore sincronizzazione:', error);
    return [];
  }
};

export const addOrUpdateTaskSupabase = async (userId: string, task: Task) => {
  const client = getSupabaseClient();
  if (!client || !userId) return;

  try {
    const { error } = await client.from('tasks').upsert(
      {
        id: task.id,
        user_id: userId,
        ...taskToDBFormat(task),
      },
      { onConflict: 'id' }
    );

    if (error) throw error;
  } catch (error) {
    console.error('Errore salvataggio task:', error);
    throw error;
  }
};

export const deleteTaskSupabase = async (userId: string, taskId: string) => {
  const client = getSupabaseClient();
  if (!client || !userId) return;

  try {
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Errore eliminazione task:', error);
    throw error;
  }
};

export const onTasksChange = (userId: string, callback: (tasks: Task[]) => void): (() => void) => {
  const client = getSupabaseClient();
  if (!client || !userId) return () => undefined;

  try {
    // Usa il metodo corretto di Realtime di Supabase
    const subscription = client
      .channel(`tasks:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`
      }, async (_payload: any) => {
        // Ricarica tutti i task quando c'è un cambiamento
        const tasks = await syncTasksFromSupabase(userId);
        callback(tasks);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Errore setup listener:', error);
    return () => undefined;
  }
};
