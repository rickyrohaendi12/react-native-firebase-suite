/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, collection, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, getDocFromServer } from 'firebase/firestore';
import { Task, PushNotification, UserProfile } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Test if Firebase is configured with real key values
const hasRealConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5;

let app;
let authObj: any = null;
let dbObj: any = null;
let isRealFirebase = false;

if (hasRealConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbObj = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    authObj = getAuth(app);
    isRealFirebase = true;
    console.log("Firebase initialized successfully with config:", firebaseConfig.projectId);
  } catch (error) {
    console.warn("Failed to initialize live Firebase, falling back to simulated memory datastore:", error);
    isRealFirebase = false;
  }
} else {
  console.log("Using dynamic In-Memory Simulator. Run 'set_up_firebase' to connect live GCP project.");
}

export const isFirebaseConnected = isRealFirebase;

// ============================================
// SIMULATION (IN-MEMORY) STATE DATABASE
// ============================================
const localState = {
  users: new Map<string, UserProfile>(),
  tasks: new Map<string, Task[]>(), // key: userId
  notifications: new Map<string, PushNotification[]>(), // key: userId
  currentUser: null as UserProfile | null,
  authListeners: new Set<(user: UserProfile | null) => void>(),
  taskListeners: new Map<string, Set<(tasks: Task[]) => void>>(),
  notificationListeners: new Map<string, Set<(notifications: PushNotification[]) => void>>(),
};

// Seed initial values for simulation mode
const SEED_UID = 'sim_user_99';
const seedUser: UserProfile = {
  uid: SEED_UID,
  email: 'rickyrohaendi1@gmail.com',
  displayName: 'Ricky Rohaendi',
  createdAt: new Date().toISOString(),
  pushToken: 'push_tok_simulated_apple_982x11'
};
localState.users.set(SEED_UID, seedUser);
localState.tasks.set(SEED_UID, [
  {
    id: 't1',
    userId: SEED_UID,
    title: 'Setup React Native framework environment',
    completed: true,
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 't2',
    userId: SEED_UID,
    title: 'Configure Firebase Firestore & Auth integration',
    completed: false,
    priority: 'medium',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 't3',
    userId: SEED_UID,
    title: 'Configure APNS/FCM Push Notification payloads',
    completed: false,
    priority: 'low',
    createdAt: new Date().toISOString()
  },
]);
localState.notifications.set(SEED_UID, [
  {
    id: 'n1',
    userId: SEED_UID,
    title: '🌟 Welcome to React Native Expo!',
    body: 'Firebase Authentication is successfully active. Tap to view workspace.',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    status: 'delivered'
  }
]);

// Initialize current user to seed user initially in simulation mode
localState.currentUser = seedUser;

// Trigger state helper
function triggerAuthListeners() {
  localState.authListeners.forEach(cb => cb(localState.currentUser));
}
function triggerTaskListeners(userId: string) {
  const listeners = localState.taskListeners.get(userId);
  if (listeners) {
    const list = localState.tasks.get(userId) || [];
    listeners.forEach(cb => cb([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
  }
}
function triggerNotificationListeners(userId: string) {
  const listeners = localState.notificationListeners.get(userId);
  if (listeners) {
    const list = localState.notifications.get(userId) || [];
    listeners.forEach(cb => cb([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
  }
}

// ============================================
// FIRESTORE ERROR HANDLING (AS PER MANDATED SKILL)
// ============================================
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: isRealFirebase && authObj?.currentUser ? authObj.currentUser.uid : localState.currentUser?.uid,
      email: isRealFirebase && authObj?.currentUser ? authObj.currentUser.email : localState.currentUser?.email,
      emailVerified: isRealFirebase && authObj?.currentUser ? authObj.currentUser.emailVerified : true,
      isAnonymous: isRealFirebase && authObj?.currentUser ? authObj.currentUser.isAnonymous : false,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Firebase connection on boot if real
if (isRealFirebase && dbObj) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(dbObj, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration or project status.");
      }
    }
  };
  testConnection();
}

// ============================================
// AUTHENTICATION INTERFACE (DYNAMIC SWITCH)
// ============================================
export const authService = {
  onAuthChange: (callback: (user: UserProfile | null) => void) => {
    if (isRealFirebase && authObj) {
      return onAuthStateChanged(authObj, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
            pushToken: `apns_fcm_${fbUser.uid}_tok332`
          };
          callback(profile);
        } else {
          callback(null);
        }
      });
    } else {
      localState.authListeners.add(callback);
      // Immediately call with current simulated user
      callback(localState.currentUser);
      return () => {
        localState.authListeners.delete(callback);
      };
    }
  },

  signUp: async (email: string, pass: string, displayName: string): Promise<UserProfile> => {
    if (isRealFirebase && authObj) {
      try {
        const cred = await createUserWithEmailAndPassword(authObj, email, pass);
        // Write the custom profile doc into Firestore users collection
        const profile: UserProfile = {
          uid: cred.user.uid,
          email,
          displayName,
          createdAt: new Date().toISOString(),
          pushToken: `apns_fcm_${cred.user.uid}_tok332`
        };
        // Save profile in firestore
        await setDoc(doc(dbObj, 'users', cred.user.uid), profile);
        return profile;
      } catch (err: any) {
        console.error("Firebase Sign-Up Error: ", err.message);
        throw err;
      }
    } else {
      // Simulate account signup
      const uid = 'sim_' + Math.random().toString(36).substr(2, 9);
      const profile: UserProfile = {
        uid,
        email,
        displayName,
        createdAt: new Date().toISOString(),
        pushToken: `apns_fcm_${uid}_sim_x938`
      };
      localState.users.set(uid, profile);
      localState.tasks.set(uid, [
        {
          id: 'initial_demo',
          userId: uid,
          title: 'Welcome to your simulated React Native environment! 🎉',
          completed: false,
          priority: 'medium',
          createdAt: new Date().toISOString()
        }
      ]);
      localState.currentUser = profile;
      triggerAuthListeners();
      return profile;
    }
  },

  signIn: async (email: string, pass: string): Promise<UserProfile> => {
    if (isRealFirebase && authObj) {
      try {
        const cred = await signInWithEmailAndPassword(authObj, email, pass);
        const profile: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
          pushToken: `apns_fcm_${cred.user.uid}_tok332`
        };
        return profile;
      } catch (err: any) {
        console.error("Firebase Sign-In Error: ", err.message);
        throw err;
      }
    } else {
      // Find simulated user
      let matched: UserProfile | null = null;
      for (const [_, u] of localState.users.entries()) {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          matched = u;
          break;
        }
      }
      if (!matched) {
        // Auto-create simulated account if not exists for easy UX
        matched = {
          uid: 'sim_' + Math.random().toString(36).substr(2, 9),
          email,
          displayName: email.split('@')[0],
          createdAt: new Date().toISOString(),
          pushToken: 'push_tok_sim_auto'
        };
        localState.users.set(matched.uid, matched);
      }
      localState.currentUser = matched;
      triggerAuthListeners();
      // Ensure dummy tasks are present if none
      if (!localState.tasks.has(matched.uid)) {
        localState.tasks.set(matched.uid, [
          {
            id: 'demo_t1',
            userId: matched.uid,
            title: 'Welcome back! Design premium Mobile UI concepts',
            completed: false,
            priority: 'high',
            createdAt: new Date().toISOString()
          }
        ]);
      }
      return matched;
    }
  },

  signOut: async () => {
    if (isRealFirebase && authObj) {
      await fbSignOut(authObj);
    } else {
      localState.currentUser = null;
      triggerAuthListeners();
    }
  },

  getCurrentUser: (): UserProfile | null => {
    if (isRealFirebase && authObj?.currentUser) {
      const u = authObj.currentUser;
      return {
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || u.email?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
        pushToken: `apns_fcm_${u.uid}_tok332`
      };
    }
    return localState.currentUser;
  }
};

// ============================================
// CRUD (FIRESTORE) INTERFACE (DYNAMIC SWITCH)
// ============================================
export const databaseService = {
  subscribeTasks: (userId: string, callback: (tasks: Task[]) => void) => {
    if (isRealFirebase && dbObj) {
      const userTasksPath = `users/${userId}/tasks`;
      const q = query(
        collection(dbObj, 'users', userId, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Task);
        });
        callback(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, userTasksPath);
      });
    } else {
      if (!localState.taskListeners.has(userId)) {
        localState.taskListeners.set(userId, new Set());
      }
      localState.taskListeners.get(userId)!.add(callback);
      // Push initial value
      const list = localState.tasks.get(userId) || [];
      callback([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      return () => {
        localState.taskListeners.get(userId)?.delete(callback);
      };
    }
  },

  addTask: async (userId: string, title: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<string> => {
    const taskPath = `users/${userId}/tasks`;
    if (isRealFirebase && dbObj) {
      try {
        const collRef = collection(dbObj, 'users', userId, 'tasks');
        const docData = {
          userId,
          title,
          completed: false,
          priority,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collRef, docData);
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, taskPath);
        throw error;
      }
    } else {
      const id = 'task_' + Math.random().toString(36).substr(2, 9);
      const newTask: Task = {
        id,
        userId,
        title,
        completed: false,
        priority,
        createdAt: new Date().toISOString()
      };
      const list = localState.tasks.get(userId) || [];
      localState.tasks.set(userId, [newTask, ...list]);
      triggerTaskListeners(userId);
      return id;
    }
  },

  toggleTask: async (userId: string, taskId: string, currentCompleted: boolean): Promise<void> => {
    const taskPath = `users/${userId}/tasks/${taskId}`;
    if (isRealFirebase && dbObj) {
      try {
        const docRef = doc(dbObj, 'users', userId, 'tasks', taskId);
        await updateDoc(docRef, { completed: !currentCompleted });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, taskPath);
        throw error;
      }
    } else {
      const list = localState.tasks.get(userId) || [];
      const updated = list.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t);
      localState.tasks.set(userId, updated);
      triggerTaskListeners(userId);
    }
  },

  updateTaskTitle: async (userId: string, taskId: string, newTitle: string): Promise<void> => {
    const taskPath = `users/${userId}/tasks/${taskId}`;
    if (isRealFirebase && dbObj) {
      try {
        const docRef = doc(dbObj, 'users', userId, 'tasks', taskId);
        await updateDoc(docRef, { title: newTitle });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, taskPath);
        throw error;
      }
    } else {
      const list = localState.tasks.get(userId) || [];
      const updated = list.map(t => t.id === taskId ? { ...t, title: newTitle } : t);
      localState.tasks.set(userId, updated);
      triggerTaskListeners(userId);
    }
  },

  deleteTask: async (userId: string, taskId: string): Promise<void> => {
    const taskPath = `users/${userId}/tasks/${taskId}`;
    if (isRealFirebase && dbObj) {
      try {
        const docRef = doc(dbObj, 'users', userId, 'tasks', taskId);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, taskPath);
        throw error;
      }
    } else {
      const list = localState.tasks.get(userId) || [];
      const filtered = list.filter(t => t.id !== taskId);
      localState.tasks.set(userId, filtered);
      triggerTaskListeners(userId);
    }
  },

  // ============================================
  // REAL-TIME NOTIFICATIONS GATEWAY
  // ============================================
  subscribeNotifications: (userId: string, callback: (notifications: PushNotification[]) => void) => {
    if (isRealFirebase && dbObj) {
      const notifPath = `users/${userId}/notifications`;
      const q = query(
        collection(dbObj, 'users', userId, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: PushNotification[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PushNotification);
        });
        callback(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, notifPath);
      });
    } else {
      if (!localState.notificationListeners.has(userId)) {
        localState.notificationListeners.set(userId, new Set());
      }
      localState.notificationListeners.get(userId)!.add(callback);
      const list = localState.notifications.get(userId) || [];
      callback([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      return () => {
        localState.notificationListeners.get(userId)?.delete(callback);
      };
    }
  },

  triggerPushNotification: async (userId: string, title: string, body: string): Promise<void> => {
    const notifPath = `users/${userId}/notifications`;
    if (isRealFirebase && dbObj) {
      try {
        const collRef = collection(dbObj, 'users', userId, 'notifications');
        const notifData = {
          userId,
          title,
          body,
          createdAt: new Date().toISOString(),
          status: 'delivered'
        };
        await addDoc(collRef, notifData);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, notifPath);
      }
    } else {
      const newNotif: PushNotification = {
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId,
        title,
        body,
        createdAt: new Date().toISOString(),
        status: 'delivered'
      };
      const list = localState.notifications.get(userId) || [];
      localState.notifications.set(userId, [newNotif, ...list]);
      triggerNotificationListeners(userId);
    }
  }
};
