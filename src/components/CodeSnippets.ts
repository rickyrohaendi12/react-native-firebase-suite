/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CODE_SNIPPETS = {
  auth: `// AuthScreen.tsx
// Firebase Authentication in React Native (using React Native Firebase / Web SDK)
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password) return setError('Email and Password are required');
    setLoading(true);
    setError('');
    const auth = getAuth();
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Save displayName optionally
        onAuthSuccess(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(cred.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {isRegister && (
        <TextInput
          placeholder="Name"
          placeholderTextColor="#666"
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
        />
      )}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegister ? 'Sign Up' : 'Sign In'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.toggleText}>
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 14, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 12 },
  toggleText: { color: '#9CA3AF', textAlign: 'center', marginTop: 15 }
});`,

  crud: `// TaskScreen.tsx
// Firestore Real-Time Subscriptions & CRUD Operations in React Native
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function TaskScreen({ user }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const db = getFirestore();

  // Listen to Firestore real-time updates (onSnapshot)
  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setTasks(list);
    });
    return unsubscribe;
  }, [user.uid]);

  const addTask = async () => {
    if (!input.trim()) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        title: input,
        completed: false,
        createdAt: new Date().toISOString()
      });
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (taskId, currentCompleted) => {
    try {
      const docRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await updateDoc(docRef, { completed: !currentCompleted });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Tasks</Text>
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Add new task..." placeholderTextColor="#666"/>
        <TouchableOpacity style={styles.addBtn} onPress={addTask}><Text style={styles.btnText}>+</Text></TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleTask(item.id, item.completed)}>
              <Text style={[styles.taskTitle, item.completed && styles.completed]}>{item.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}><Text style={styles.delText}>✕</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F10', padding: 20 },
  header: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 15 },
  inputContainer: { flexDirection: 'row', marginBottom: 15 },
  input: { flex: 1, backgroundColor: '#1E1E1F', color: '#FFF', padding: 12, borderRadius: 8, marginRight: 8 },
  addBtn: { backgroundColor: '#10B981', justifyContent: 'center', px: 16, borderRadius: 8, paddingHorizontal: 16 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  taskItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#18181B', padding: 14, borderRadius: 8, marginBottom: 8 },
  taskTitle: { color: '#FFF', fontSize: 15 },
  completed: { textDecorationLine: 'line-through', color: '#71717A' },
  delText: { color: '#EF4444', fontWeight: 'bold' }
});`,

  push: `// PushNotificationConfig.ts
// Setting up Real-Time Push Notifications with Firebase (Expo Notifications & Cloud Messaging)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configure top-level handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notifications!');
    return;
  }
  
  // Get token (Expo specific or FMC Native)
  token = (await Notifications.getDevicePushTokenAsync()).data;
  console.log('Firebase Cloud Device Token:', token);

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Upload the device token in Firestore under the users document
  // This lets the server use Firebase Cloud Messaging (FCM) to trigger requests
  const db = getFirestore();
  await setDoc(doc(db, 'users', userId), { pushToken: token }, { merge: true });

  return token;
}`
};
