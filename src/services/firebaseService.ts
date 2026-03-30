import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { Task } from '../types';

// Sostituisci con le tue credenziali Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

let app: FirebaseApp | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

export const isFirebaseEnabled = () => {
  return !firebaseConfig.apiKey.includes('YOUR_API_KEY');
};

export const useFirebase = () => {
  if (!isFirebaseEnabled()) {
    // non configurato -> fallback solo localStorage
    return false;
  }

  if (!app && !getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else if (!db) {
    db = getFirestore(getApps()[0]);
  }

  return true;
};

export const syncTasksFromFirebase = async (): Promise<Task[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'tasks'));

  const tasks: Task[] = [];
  snapshot.forEach((docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnapshot.data();
    tasks.push({
      id: docSnapshot.id,
      title: data.title,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      category: data.category,
      priority: data.priority,
      notes: data.notes,
      completed: data.completed || false,
      subtasks: data.subtasks || [],
      recurrence: data.recurrence ? {
        from: data.recurrence.from.toDate ? data.recurrence.from.toDate() : new Date(data.recurrence.from),
        to: data.recurrence.to.toDate ? data.recurrence.to.toDate() : new Date(data.recurrence.to),
        frequency: data.recurrence.frequency,
      } : undefined,
      recurrenceMasterId: data.recurrenceMasterId,
      isRecurringTemplate: data.isRecurringTemplate,
    });
  });

  return tasks;
};

export const addOrUpdateTaskFirebase = async (task: Task) => {
  if (!db) return;
  await setDoc(doc(db, 'tasks', task.id), {
    ...task,
    date: task.date.toISOString(),
    recurrence: task.recurrence
      ? {
          from: task.recurrence.from.toISOString(),
          to: task.recurrence.to.toISOString(),
          frequency: task.recurrence.frequency,
        }
      : null,
  });
};

export const deleteTaskFirebase = async (taskId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, 'tasks', taskId));
};

export const onTasksChange = (callback: (tasks: Task[]) => void) => {
  if (!db) return () => undefined;

  return onSnapshot(collection(db, 'tasks'), async (snapshot) => {
    const tasks = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: data.title,
        date: data.date.toDate ? data.date.toDate() : new Date(data.date),
        category: data.category,
        priority: data.priority,
        notes: data.notes,
        completed: data.completed || false,
        subtasks: data.subtasks || [],
        recurrence: data.recurrence ? {
          from: data.recurrence.from.toDate ? data.recurrence.from.toDate() : new Date(data.recurrence.from),
          to: data.recurrence.to.toDate ? data.recurrence.to.toDate() : new Date(data.recurrence.to),
          frequency: data.recurrence.frequency,
        } : undefined,
        recurrenceMasterId: data.recurrenceMasterId,
        isRecurringTemplate: data.isRecurringTemplate,
      } as Task;
    });
    callback(tasks);
  });
};
