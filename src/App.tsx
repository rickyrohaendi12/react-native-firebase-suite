/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { authService, databaseService, isFirebaseConnected } from './firebase';
import { Task, PushNotification, UserProfile, NetworkLog } from './types';
import MobileDevice from './components/MobileDevice';
import DeveloperConsole from './components/DeveloperConsole';
import { 
  Terminal, Smartphone, Settings, ShieldCheck, Database, Info, Code, LayoutDashboard 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'both' | 'simulator' | 'console'>('both');

  // Monitor viewport resize for fluid dual-column control
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        if (activeWorkspaceTab === 'both') {
          setActiveWorkspaceTab('simulator');
        }
      } else {
        setActiveWorkspaceTab('both');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // trigger initial checks
    return () => window.removeEventListener('resize', handleResize);
  }, [activeWorkspaceTab]);

  // Log creator helper
  const addLog = (type: 'auth' | 'firestore' | 'push', direction: 'in' | 'out' | 'local', message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: NetworkLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: timeStr,
      type,
      direction,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // cap logs at 50 for memory
  };

  // Seed initial log on startup
  useEffect(() => {
    addLog('firestore', 'local', isFirebaseConnected 
      ? 'Terhubung live ke Google Firebase Firestore Cloud' 
      : 'Inisialisasi Sandbox Simulator Ensembel (Firebase Offline Emulator Active)'
    );
  }, []);

  // Set up Firebase Auth and dynamic streams dependencies subscription
  useEffect(() => {
    setIsLoading(true);
    const unsubscribeAuth = authService.onAuthChange((profile) => {
      setUser(profile);
      setIsLoading(false);
      
      if (profile) {
        addLog('auth', 'in', `Pengguna terautentikasi: ${profile.displayName} (${profile.email})`);
        addLog('push', 'out', `Device Token terdaftar: ${profile.pushToken}`);
      } else {
        addLog('auth', 'local', 'Sesi pengguna ditiadakan (Auth state cleared)');
        setTasks([]);
        setNotifications([]);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Set up Firestore / Simulated active stream subscription for Tasks and Notifications
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    addLog('firestore', 'out', `Memulai koneksi onSnapshot() di /users/${user.uid}/tasks`);
    const unsubscribeTasks = databaseService.subscribeTasks(user.uid, (freshTasks) => {
      setTasks(freshTasks);
      setIsLoading(false);
      addLog('firestore', 'in', `Menerima ${freshTasks.length} dokumen tugas aktif`);
    });

    addLog('firestore', 'out', `Memulai koneksi onSnapshot() di /users/${user.uid}/notifications`);
    const unsubscribeNotifications = databaseService.subscribeNotifications(user.uid, (freshNotifs) => {
      setNotifications(freshNotifs);
      addLog('push', 'in', `Notifikasi push sinkron: terdeteksi ${freshNotifs.length} push logs`);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeNotifications();
    };
  }, [user]);

  // Handle Operations
  const handleLogin = async (email: string, pass: string) => {
    addLog('auth', 'out', `Mengirim request signin untuk email: ${email}`);
    const profile = await authService.signIn(email, pass);
    return profile;
  };

  const handleRegister = async (email: string, pass: string, name: string) => {
    addLog('auth', 'out', `Mengirim request signup untuk: ${name} <${email}>`);
    const profile = await authService.signUp(email, pass, name);
    return profile;
  };

  const handleLogout = async () => {
    addLog('auth', 'out', 'Mengirim request logout sesi');
    await authService.signOut();
  };

  const handleAddTask = async (title: string, priority: 'low' | 'medium' | 'high') => {
    if (!user) return;
    addLog('firestore', 'out', `Menambahkan tugas baru ("${title}") Prioritas: ${priority}`);
    try {
      const taskId = await databaseService.addTask(user.uid, title, priority);
      addLog('firestore', 'in', `Tugas berhasil di-commit di Firestore. ID: ${taskId}`);
    } catch (err: any) {
      addLog('firestore', 'in', `Gagal menyimpan: ${err.message}`);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!user) return;
    addLog('firestore', 'out', `Mengubah paritas tugas ${taskId} menjadi: ${!currentCompleted}`);
    await databaseService.toggleTask(user.uid, taskId, currentCompleted);
    addLog('firestore', 'in', `Tugas ${taskId} berhasil di-update`);
  };

  const handleUpdateTask = async (taskId: string, title: string) => {
    if (!user) return;
    addLog('firestore', 'out', `Mengubah deskripsi tugas ${taskId} menjadi: "${title}"`);
    await databaseService.updateTaskTitle(user.uid, taskId, title);
    addLog('firestore', 'in', `Deskripsi tugas ${taskId} diperbarui`);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    addLog('firestore', 'out', `Menghapus dokumen tugas: ${taskId}`);
    await databaseService.deleteTask(user.uid, taskId);
    addLog('firestore', 'in', `Data tugas ${taskId} dihapus secara permanen`);
  };

  const handleTriggerPush = async (title: string, body: string) => {
    if (!user) return;
    addLog('push', 'out', `Dispatched Push Notification payload ke FCM Server`);
    await databaseService.triggerPushNotification(user.uid, title, body);
    addLog('push', 'in', `Notifikasi tersalurkan ke push token: ${user.pushToken}`);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans flex flex-col selection:bg-indigo-600/30 selection:text-indigo-300 relative overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1d4ed8]/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Dynamic Suite Header Banner */}
      <header className="border-b border-white/5 bg-white/[0.01] backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 p-[1px] shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#050508] rounded-[10px] flex items-center justify-center">
              <Database size={18} className="text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white font-display uppercase flex items-center gap-1.5 leading-none">
              VORTEX
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">FMS v4</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 select-none">Suite Manajemen Pengguna, Real-Time Firestore Sync, dan Sandbox Notifikasi Terintegrasi</p>
          </div>
        </div>

        {/* Workspace Display Mode Switches (For Responsive Support) */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10 shrink-0 relative z-10">
          <button
            onClick={() => setActiveWorkspaceTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${activeWorkspaceTab === 'simulator' ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            <Smartphone size={13} />
            <span>Smartphone Simulator</span>
          </button>
          
          <button
            onClick={() => setActiveWorkspaceTab('console')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${activeWorkspaceTab === 'console' ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            <Terminal size={13} />
            <span>Developer Sandbox</span>
          </button>

          {/* Shown only on Desktop layouts */}
          <button
            onClick={() => setActiveWorkspaceTab('both')}
            className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer items-center gap-1.5 transition-all ${activeWorkspaceTab === 'both' ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard size={13} />
            <span>Dual Workspace View</span>
          </button>
        </div>
      </header>

      {/* Main Container Viewport Grid */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-12 gap-6 items-stretch overflow-hidden relative z-10">
        
        {/* PANEL: MOBILE DEVICE SIMULATOR */}
        {(activeWorkspaceTab === 'simulator' || activeWorkspaceTab === 'both') && (
          <div className={`${activeWorkspaceTab === 'both' ? 'col-span-12 lg:col-span-4' : 'col-span-12'} flex items-center justify-center`}>
            <div className="w-full">
              {/* Dynamic device helper title */}
              <div className="text-center mb-3 hidden lg:block">
                <span className="text-xs font-bold text-slate-550 uppercase tracking-widest font-mono">React Native Simulator Visual</span>
              </div>
              <MobileDevice 
                user={user}
                tasks={tasks}
                notifications={notifications}
                isLoading={isLoading}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onLogout={handleLogout}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          </div>
        )}

        {/* PANEL: DEVELOPER CONSOLE & CODE VIEWER */}
        {(activeWorkspaceTab === 'console' || activeWorkspaceTab === 'both') && (
          <div className={`${activeWorkspaceTab === 'both' ? 'col-span-12 lg:col-span-8' : 'col-span-12'} flex flex-col h-full`}>
            <DeveloperConsole 
              logs={logs}
              isFirebaseConnected={isFirebaseConnected}
              onTriggerNotification={handleTriggerPush}
              onClearLogs={handleClearLogs}
              userId={user?.uid}
            />
          </div>
        )}

      </main>

      {/* Humble Footer info banner */}
      <footer className="border-t border-white/5 bg-[#050508]/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 relative z-10">
        <div className="flex items-center gap-2 text-[11px] text-slate-550 font-sans">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span>Keamanan dilindungi di level server lewat Aturan Penulisan Atribut Firebase (ABAC rules_version = '2')</span>
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          <span>rickyrohaendi1@gmail.com • Built with Google AI Studio</span>
        </div>
      </footer>

    </div>
  );
}
