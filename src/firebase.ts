import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { InteractionEntry, NotificationSettings, NotificationLogEntry, FolderItem, WritingGoal } from './types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Use specified firestoreDatabaseId if configured in config, otherwise default database
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict undefined-stripping utility to ensure Zero-Crash payload hygiene
 * Firestore SDK rejects objects containing undefined properties.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizePayload(value);
      }
    }
    return clean as T;
  }
  return obj;
}

/**
 * Google Sign-In authentication handler
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out handler
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to a user's isolated interactions collection in real time
 * Path: /users/{userId}/interactions
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (entries: InteractionEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: InteractionEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<InteractionEntry, 'id'>),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      onError(error);
    }
  );
}

/**
 * Save a new interaction entry to the user's isolated collection
 */
export async function saveInteraction(
  userId: string,
  entry: Omit<InteractionEntry, 'id' | 'userId'>
): Promise<string> {
  if (!userId) throw new Error('User must be authenticated to save interactions.');
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  
  const payload = sanitizePayload({
    ...entry,
    userId,
    createdAt: entry.createdAt || Date.now(),
    updatedAt: Date.now(),
  });

  const docRef = await addDoc(interactionsRef, payload);
  return docRef.id;
}

/**
 * Update an existing interaction entry
 */
export async function updateInteraction(
  userId: string,
  interactionId: string,
  updates: Partial<InteractionEntry>
): Promise<void> {
  if (!userId || !interactionId) throw new Error('Invalid userId or interactionId.');
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  
  const payload = sanitizePayload({
    ...updates,
    updatedAt: Date.now(),
  });

  await updateDoc(docRef, payload);
}

/**
 * Delete an interaction entry
 */
export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) throw new Error('Invalid userId or interactionId.');
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}

/**
 * Listen to user notification settings in real-time
 * Path: /users/{userId}/notificationSettings/default
 */
export function subscribeToNotificationSettings(
  userId: string,
  onUpdate: (settings: NotificationSettings | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'notificationSettings', 'default');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as NotificationSettings);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Notification settings subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update user notification settings
 */
export async function saveNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  if (!userId) throw new Error('User must be authenticated to modify notification settings.');
  const docRef = doc(db, 'users', userId, 'notificationSettings', 'default');
  
  const payload = sanitizePayload({
    userId,
    enabled: settings.enabled ?? false,
    emailDestination: settings.emailDestination || '',
    enabledEventTypes: settings.enabledEventTypes || ['goal_detected', 'task_detected'],
    providerType: settings.providerType || 'email',
    webhookUrl: settings.webhookUrl || '',
    includeSummary: settings.includeSummary ?? true,
    updatedAt: Date.now(),
  });

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Listen to notification logs in real-time
 * Path: /users/{userId}/notificationLogs
 */
export function subscribeToNotificationLogs(
  userId: string,
  onUpdate: (logs: NotificationLogEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const logsRef = collection(db, 'users', userId, 'notificationLogs');
  const q = query(logsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: NotificationLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<NotificationLogEntry, 'id'>),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Notification logs subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Record a notification delivery log entry
 */
export async function saveNotificationLog(
  userId: string,
  logEntry: Omit<NotificationLogEntry, 'id' | 'userId'>
): Promise<string> {
  if (!userId) throw new Error('User must be authenticated.');
  const logsRef = collection(db, 'users', userId, 'notificationLogs');

  const payload = sanitizePayload({
    ...logEntry,
    userId,
    timestamp: logEntry.timestamp || Date.now(),
  });

  const docRef = await addDoc(logsRef, payload);
  return docRef.id;
}

/**
 * Listen to user folders and collections in real-time
 * Path: /users/{userId}/folders
 */
export function subscribeToUserFolders(
  userId: string,
  onUpdate: (folders: FolderItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const foldersRef = collection(db, 'users', userId, 'folders');
  const q = query(foldersRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FolderItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FolderItem, 'id'>),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Folders subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a new user collection / folder
 */
export async function saveFolder(
  userId: string,
  folder: Omit<FolderItem, 'id' | 'userId'>
): Promise<string> {
  if (!userId) throw new Error('User must be authenticated to create a folder.');
  const foldersRef = collection(db, 'users', userId, 'folders');

  const payload = sanitizePayload({
    ...folder,
    userId,
    createdAt: folder.createdAt || Date.now(),
    updatedAt: Date.now(),
  });

  const docRef = await addDoc(foldersRef, payload);
  return docRef.id;
}

/**
 * Update an existing collection / folder
 */
export async function updateFolder(
  userId: string,
  folderId: string,
  updates: Partial<FolderItem>
): Promise<void> {
  if (!userId || !folderId) throw new Error('Valid userId and folderId are required.');
  const docRef = doc(db, 'users', userId, 'folders', folderId);

  const payload = sanitizePayload({
    ...updates,
    updatedAt: Date.now(),
  });

  await updateDoc(docRef, payload);
}

/**
 * Delete a collection / folder
 * Note: Deleting a collection must not delete the journal entries inside it.
 */
export async function deleteFolder(
  userId: string,
  folderId: string
): Promise<void> {
  if (!userId || !folderId) throw new Error('Valid userId and folderId are required.');
  const docRef = doc(db, 'users', userId, 'folders', folderId);
  await deleteDoc(docRef);
}

/**
 * Listen to user writing goals in real-time
 * Path: /users/{userId}/goals
 */
export function subscribeToUserGoals(
  userId: string,
  onUpdate: (goals: WritingGoal[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const goalsRef = collection(db, 'users', userId, 'goals');
  const q = query(goalsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: WritingGoal[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<WritingGoal, 'id'>),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Goals subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a new user writing goal
 */
export async function saveGoal(
  userId: string,
  goal: Omit<WritingGoal, 'id' | 'userId'>
): Promise<string> {
  if (!userId) throw new Error('User must be authenticated to create a goal.');
  const goalsRef = collection(db, 'users', userId, 'goals');

  const payload = sanitizePayload({
    ...goal,
    userId,
    createdAt: goal.createdAt || Date.now(),
    updatedAt: Date.now(),
  });

  const docRef = await addDoc(goalsRef, payload);
  return docRef.id;
}

/**
 * Update an existing user writing goal
 */
export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<WritingGoal>
): Promise<void> {
  if (!userId || !goalId) throw new Error('Valid userId and goalId are required.');
  const docRef = doc(db, 'users', userId, 'goals', goalId);

  const payload = sanitizePayload({
    ...updates,
    updatedAt: Date.now(),
  });

  await updateDoc(docRef, payload);
}

/**
 * Delete a user writing goal
 */
export async function deleteGoal(
  userId: string,
  goalId: string
): Promise<void> {
  if (!userId || !goalId) throw new Error('Valid userId and goalId are required.');
  const docRef = doc(db, 'users', userId, 'goals', goalId);
  await deleteDoc(docRef);
}



