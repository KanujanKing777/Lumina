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
import { InteractionEntry } from './types';

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
