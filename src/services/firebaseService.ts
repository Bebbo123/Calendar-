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
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
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
let auth: Auth | null = null;

export const isFirebaseEnabled = () => {
  return !firebaseConfig.apiKey.includes('YOUR_API_KEY');
};

export const initializeFirebase = () => {
  if (!isFirebaseEnabled()) {
    return false;
  }

  if (!app && !getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else if (!db || !auth) {
    db = getFirestore(getApps()[0]);
    auth = getAuth(getApps()[0]);
  }

  return true;
};

export const useFirebase = () => initializeFirebase();

export const getCurrentUser = (): User | null => {
  if (!auth) return null;
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) return () => undefined;
  return onAuthStateChanged(auth, callback);
};

export const registerUser = async (email: string, password: string): Promise<User | null> => {
  if (!auth) return null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Errore registrazione:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  if (!auth) return null;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Errore login:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Errore logout:', error);
    throw error;
  }
};

const getUserTasksPath = (userId: string) => `tasks/${userId}/items`;

const parseTaskFromFirebase = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Task => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    title: data.title,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    category: data.category,
    priority: data.priority,
    notes: data.notes,
    completed: data.completed || false,
    subtasks: data.subtasks || [],
    recurrence: data.recurrence ? {
      from: data.recurrence.from instanceof Timestamp ? data.recurrence.from.toDate() : new Date(data.recurrence.from),
      to: data.recurrence.to instanceof Timestamp ? data.recurrence.to.toDate() : new Date(data.recurrence.to),
      frequency: data.recurrence.frequency,
    } : undefined,
    recurrenceMasterId: data.recurrenceMasterId,
    isRecurringTemplate: data.isRecurringTemplate,
  };
};

export const syncTasksFromFirebase = async (userId: string): Promise<Task[]> => {
  if (!db) return [];
  
  try {
    const tasksPath = getUserTasksPath(userId);
    const snapshot = await getDocs(collection(db, tasksPath));
    const tasks: Task[] = [];
    
    snapshot.forEach((docSnapshot) => {
      tasks.push(parseTaskFromFirebase(docSnapshot));
    });
    
    return tasks;
  } catch (error) {
    console.error('Errore sincronizzazione Firebase:', error);
    return [];
  }
};

export const addOrUpdateTaskFirebase = async (userId: string, task: Task) => {
  if (!db) return;
  
  try {
    const tasksPath = getUserTasksPath(userId);
    await setDoc(doc(db, tasksPath, task.id), {
      ...task,
      date: Timestamp.fromDate(task.date),
      recurrence: task.recurrence
        ? {
            from: Timestamp.fromDate(task.recurrence.from),
            to: Timestamp.fromDate(task.recurrence.to),
            frequency: task.recurrence.frequency,
          }
        : null,
    });
  } catch (error) {
    console.error('Errore salvataggio task:', error);
    throw error;
  }
};

export const deleteTaskFirebase = async (userId: string, taskId: string) => {
  if (!db) return;
  
  try {
    const tasksPath = getUserTasksPath(userId);
    await deleteDoc(doc(db, tasksPath, taskId));
  } catch (error) {
    console.error('Errore eliminazione task:', error);
    throw error;
  }
};

export const onTasksChange = (userId: string, callback: (tasks: Task[]) => void): (() => void) => {
  if (!db) return () => undefined;

  try {
    const tasksPath = getUserTasksPath(userId);
    return onSnapshot(collection(db, tasksPath), async (snapshot) => {
      const tasks = snapshot.docs.map((docSnapshot) => parseTaskFromFirebase(docSnapshot));
      callback(tasks);
    });
  } catch (error) {
    console.error('Errore listener task:', error);
    return () => undefined;
  }
};
