/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  pushToken: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface NetworkLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'firestore' | 'push';
  direction: 'in' | 'out' | 'local';
  message: string;
}
