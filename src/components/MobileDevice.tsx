/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, User, Check, Trash2, Plus, LogOut, CheckSquare, Square, 
  Settings, Bell, Smartphone, Wifi, Battery, ChevronRight, Edit3, X, RefreshCw
} from 'lucide-react';
import { Task, PushNotification, UserProfile } from '../types';

interface MobileDeviceProps {
  user: UserProfile | null;
  tasks: Task[];
  notifications: PushNotification[];
  isLoading: boolean;
  onLogin: (email: string, pass: string) => Promise<any>;
  onRegister: (email: string, pass: string, name: string) => Promise<any>;
  onLogout: () => Promise<void>;
  onAddTask: (title: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
  onToggleTask: (taskId: string, currentCompleted: boolean) => Promise<void>;
  onUpdateTask: (taskId: string, title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export default function MobileDevice({
  user,
  tasks,
  notifications,
  isLoading,
  onLogin,
  onRegister,
  onLogout,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask
}: MobileDeviceProps) {
  // Mobile app view states: 'auth', 'home'
  const [activeTab, setActiveTab] = useState<'tasks' | 'notifications' | 'profile'>('tasks');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // CRUD Task form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Push notification banners container
  const [activeBanner, setActiveBanner] = useState<PushNotification | null>(null);

  // Track the latest notification to present as push-toast on screen
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Check if this notification is fresh (received in last 5 seconds)
      const diffMs = Date.now() - new Date(latest.createdAt).getTime();
      if (diffMs < 5000) {
        setActiveBanner(latest);
        const timer = setTimeout(() => {
          setActiveBanner(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Handle Login or Register submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap isi semua field yang wajib');
      return;
    }
    setAuthLoading(true);
    setErrorMsg('');
    try {
      if (authMode === 'login') {
        await onLogin(email, password);
      } else {
        if (!displayName) {
          setErrorMsg('Nama lengkap harus diisi');
          setAuthLoading(false);
          return;
        }
        await onRegister(email, password, displayName);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setAuthLoading(false);
    }
  };

  // Create task trigger
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await onAddTask(taskTitle.trim(), taskPriority);
      setTaskTitle('');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Toggle checklist
  const handleTaskCheck = async (task: Task) => {
    try {
      await onToggleTask(task.id, task.completed);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Submit edit
  const handleSaveEdit = async (taskId: string) => {
    if (!editingTitle.trim()) return;
    try {
      await onUpdateTask(taskId, editingTitle.trim());
      setEditingTaskId(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[780px] bg-[#050508] rounded-[50px] p-3.5 shadow-[0_0_50px_rgba(79,70,229,0.15)] border-4 border-white/10 transition-all duration-300">
      
      {/* Phone Internal Glass Screen Shell */}
      <div className="relative w-full h-full bg-[#050508]/90 rounded-[38px] overflow-hidden flex flex-col font-sans select-none border border-white/5">
        
        {/* Dynamic Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#050508] rounded-b-xl z-50 flex items-center justify-center border-b border-x border-white/5">
          <div className="w-12 h-1 bg-white/10 rounded-full mb-1"></div>
          <div className="w-2.5 h-2.5 bg-white/10 rounded-full mb-1 ml-2"></div>
        </div>
 
        {/* Device Status Bar */}
        <div className="h-10 px-6 pt-2 flex justify-between items-center bg-[#050508] text-xs text-white z-40">
          <span className="font-semibold select-none">09:41</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wifi size={12} className="text-slate-300" />
            <Smartphone size={11} className="text-slate-300" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">100%</span>
              <Battery size={14} className="text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>
 
        {/* Animated Push Notification Container directly under notch */}
        <AnimatePresence>
          {activeBanner && (
            <motion.div 
              initial={{ y: -80, opacity: 0, scale: 0.95 }}
              animate={{ y: 8, opacity: 1, scale: 1 }}
              exit={{ y: -80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="absolute top-11 left-3 right-3 bg-[#050508]/90 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex gap-3 cursor-pointer"
              onClick={() => setActiveTab('notifications')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                <Bell size={18} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Push Notification</span>
                  <span className="text-[9px] text-slate-500 font-mono">Sekarang</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{activeBanner.title}</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">{activeBanner.body}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveBanner(null); }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#050508]/95 z-50 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
            <RefreshCw size={24} className="text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Sinkronisasi Ke Firebase...</span>
          </div>
        )}
 
        {/* MAIN BODY SCENE */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
 
          {/* NO USER SIGNED IN -> AUTH VIEW */}
          {!user ? (
            <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
              <div className="pt-8 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] mb-3">
                  <Lock size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white font-display">VORTEX MOBILE</h1>
                <p className="text-xs text-slate-400 mt-1">Simulasi Firebase Suite Terintegrasi</p>
                
                {/* Mode Selector */}
                <div className="grid grid-cols-2 bg-white/[0.03] p-1 rounded-xl mt-6 border border-white/5">
                  <button 
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-450 hover:text-white'}`}
                  >
                    Masuk (Sign In)
                  </button>
                  <button 
                    onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-455 hover:text-white'}`}
                  >
                    Daftar (Register)
                  </button>
                </div>
              </div>
 
              {/* Form Block */}
              <form onSubmit={handleAuthSubmit} className="flex-1 flex flex-col justify-center space-y-3 px-1 my-4">
                {errorMsg && (
                  <div className="bg-red-950/40 border border-red-900/70 text-red-300 text-xs p-2.5 rounded-lg text-center font-medium animate-pulse">
                    {errorMsg}
                  </div>
                )}
 
                {authMode === 'register' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Nama Lengkap</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3.5 top-3 text-slate-500" size={14} />
                      <input 
                        type="text" 
                        placeholder="Ricky Rohaendi"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white/[0.02] text-white placeholder-slate-650 text-xs rounded-xl pl-10 pr-4 py-3 border border-white/5 focus:outline-none focus:border-indigo-505 transition-all font-sans"
                      />
                    </div>
                  </div>
                )}
 
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Alamat Email</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-3 text-slate-500" size={14} />
                    <input 
                      type="email" 
                      placeholder="rickyrohaendi1@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.02] text-white placeholder-slate-655 text-xs rounded-xl pl-10 pr-4 py-3 border border-white/5 focus:outline-none focus:border-indigo-505 transition-all font-sans"
                    />
                  </div>
                </div>
 
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Kata Sandi</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-3 text-slate-500" size={14} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.02] text-white placeholder-slate-655 text-xs rounded-xl pl-10 pr-4 py-3 border border-white/5 focus:outline-none focus:border-indigo-505 transition-all font-sans"
                    />
                  </div>
                </div>
 
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-gradient-to-br from-indigo-550 to-blue-600 hover:opacity-95 text-white font-bold text-xs py-3 rounded-xl mt-4 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all active:scale-95"
                >
                  {authLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <span>{authMode === 'login' ? 'Masuk' : 'Buat Akun'}</span>
                  )}
                </button>
              </form>
 
              <div className="text-center pb-2">
                <span className="text-[10px] text-slate-500 font-mono">Protected by Firebase Rules Core v2</span>
              </div>
            </div>
          ) : (
            
            // USER IS SIGNED IN -> MAIN APP INTERFACE
            <div className="flex-1 flex flex-col overflow-hidden bg-[#050508]/15 relative">
              
              {/* Top Custom Header */}
              <div className="px-5 py-3 border-b border-white/5 bg-[#050508]/90 backdrop-blur-lg flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Authentication Link</h3>
                  <h2 className="text-sm font-bold text-white truncate max-w-[170px]">{user.displayName || user.email}</h2>
                </div>
                
                <button 
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-slate-400 hover:text-red-400 cursor-pointer transition-all"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
 
              {/* SCREEN CONTENT AREA (SCROLLABLE) */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <AnimatePresence mode="wait">
                  {activeTab === 'tasks' ? (
                    <motion.div 
                      key="tasks"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      {/* CRUD Title */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 font-mono">Firestore Real-Time CRUD</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                          {tasks.length} Item
                        </span>
                      </div>
 
                      {/* Add Task Form */}
                      <form onSubmit={handleAddTaskSubmit} className="mb-4 bg-white/[0.02] border border-white/10 p-3 rounded-2xl space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Tulis tugas baru..." 
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="flex-1 bg-[#050508]/65 text-white placeholder-slate-650 text-[11px] px-3 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-indigo-505 transition-all font-sans"
                          />
                          <button 
                            type="submit"
                            className="bg-gradient-to-br from-indigo-550 to-blue-600 text-white p-2.5 rounded-xl cursor-pointer transition-all shrink-0 active:scale-95 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        {/* Priority Toggles */}
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-slate-500 font-mono">Prioritas:</span>
                          <div className="flex gap-1.5">
                            {(['low', 'medium', 'high'] as const).map((p) => {
                              const colors = {
                                low: 'bg-white/[0.01] text-slate-400 border-white/5 active:bg-white/[0.03]',
                                medium: 'bg-white/[0.01] text-slate-400 border-white/5 active:bg-white/[0.03]',
                                high: 'bg-white/[0.01] text-slate-400 border-white/5 active:bg-white/[0.03]',
                              };
                              const activeColors = {
                                low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                                medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                                high: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                              };
                              const isSelected = taskPriority === p;
                              return (
                                <button
                                  type="button"
                                  key={p}
                                  onClick={() => setTaskPriority(p)}
                                  className={`px-2.5 py-0.5 rounded-full border text-[9px] capitalize font-medium transition-all cursor-pointer ${isSelected ? activeColors[p] : colors[p]}`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </form>
 
                      {/* Tasks List */}
                      {tasks.length === 0 ? (
                        <div className="text-center py-12 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl px-4">
                          <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-2 text-indigo-400">
                            <CheckSquare size={16} />
                          </div>
                          <span className="text-xs text-slate-350 block font-semibold">Tidak ada tugas aktif</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block leading-normal">Tulis tugas di form diatas untuk tersinkronasi ke Firebase</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tasks.map((task) => {
                            const isEditing = editingTaskId === task.id;
                            return (
                              <motion.div 
                                layout
                                key={task.id}
                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  task.completed 
                                    ? 'bg-white/[0.01] border-white/5 text-slate-500' 
                                    : 'bg-white/[0.03] border-white/10 hover:border-indigo-500/30 text-white'
                                }`}
                              >
                                {isEditing ? (
                                  <div className="flex-1 flex gap-2 items-center">
                                    <input 
                                      type="text" 
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      className="flex-1 bg-[#050508] border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleSaveEdit(task.id)}
                                      className="bg-emerald-600 p-1.5 rounded-lg text-white"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button 
                                      onClick={() => setEditingTaskId(null)}
                                      className="bg-white/[0.1] p-1.5 rounded-lg text-slate-300"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                                      <button 
                                        onClick={() => handleTaskCheck(task)}
                                        className="mt-0.5 text-slate-550 hover:text-indigo-450 transition-colors shrink-0 cursor-pointer"
                                      >
                                        {task.completed ? (
                                          <CheckSquare size={16} className="text-indigo-400" />
                                        ) : (
                                          <Square size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                        )}
                                      </button>
                                      
                                      <div className="flex-1 min-w-0">
                                        <p 
                                          onClick={() => handleTaskCheck(task)}
                                          className={`text-xs select-none break-words font-medium cursor-pointer ${task.completed ? 'line-through text-slate-500 font-normal' : ''}`}
                                        >
                                          {task.title}
                                        </p>
                                        
                                        <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono select-none">
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            task.priority === 'high' ? 'bg-rose-500' :
                                            task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                          }`}></span>
                                          <span className="capitalize text-slate-500">{task.priority} Priority</span>
                                        </div>
                                      </div>
                                    </div>
 
                                    <div className="flex items-center gap-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-all">
                                      <button 
                                        onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title); }}
                                        className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white cursor-pointer"
                                      >
                                        <Edit3 size={11} />
                                      </button>
                                      <button 
                                        onClick={() => onDeleteTask(task.id)}
                                        className="p-1 rounded bg-white/[0.05] hover:bg-red-500/10 text-slate-400 hover:text-red-400 cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  ) : activeTab === 'notifications' ? (
                    <motion.div 
                      key="notifications"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      <span className="text-xs font-bold text-slate-400 font-mono block mb-1">Push Notifications Received</span>
                      
                      {notifications.length === 0 ? (
                        <div className="text-center py-12 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl px-4">
                          <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-2 text-indigo-400">
                            <Bell size={16} />
                          </div>
                          <span className="text-xs text-slate-350 block font-semibold">Belum ada notifikasi push</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block leading-normal">Kirim manual dari developer console untuk menguji feedback</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map((n) => (
                            <div key={n.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex gap-3 shadow-sm hover:border-indigo-500/20 transition-all">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                <Bell size={14} />
                              </div>
                              <div className="flex-1 min-w-0 select-text">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono uppercase">deliv</span>
                                </div>
                                <h4 className="text-xs font-bold text-white mt-0.5">{n.title}</h4>
                                <p className="text-[11px] text-slate-450 mt-0.5 leading-snug">{n.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="profile"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <span className="text-xs font-bold text-slate-400 font-mono block mb-1">Informasi Pengguna</span>
                      
                      <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl space-y-3 font-sans select-text">
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(79,70,229,0.3)]">
                            {(user.displayName || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{user.displayName || 'Akun Mobile'}</h4>
                            <span className="text-[10px] text-slate-500 truncate block max-w-[190px]">{user.email}</span>
                          </div>
                        </div>
 
                        <div className="space-y-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block font-mono uppercase text-[9px] tracking-wider">Firebase Auth UID:</span>
                            <span className="text-slate-350 font-mono font-medium block truncate max-w-[240px] select-all">{user.uid}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-mono uppercase text-[9px] tracking-wider">Device Token:</span>
                            <span className="text-slate-350 font-mono font-medium block truncate max-w-[240px] select-all">{user.pushToken}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-mono uppercase text-[9px] tracking-wider">Dibuat Pada:</span>
                            <span className="text-slate-355 font-medium block">{new Date(user.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
 
                      <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-mono mb-1">Tentang Simulasi</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Perangkat ini adalah simulator React Native. Auth menggunakan token Firebase asli (jika tersambung) dan Push Notification merefleksikan event Firestore secara instan di latar belakang.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
 
              {/* IOS BOTTOM NAVIGATION TAB BAR */}
              <div className="h-16 border-t border-white/5 bg-[#050508] flex justify-around items-center shrink-0 px-6">
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-550 hover:text-white'}`}
                >
                  <CheckSquare size={18} />
                  <span className="text-[9px] font-medium font-sans">Tasks</span>
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`relative flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'notifications' ? 'text-indigo-400' : 'text-slate-550 hover:text-white'}`}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950"></span>
                  )}
                  <span className="text-[9px] font-medium font-sans">Notif</span>
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'profile' ? 'text-[#6366f1]' : 'text-slate-550 hover:text-white'}`}
                >
                  <User size={18} />
                  <span className="text-[9px] font-medium font-sans">Profile</span>
                </button>
              </div>
 
              {/* Apple Home Indicator */}
              <div className="h-1.5 w-full bg-[#050508] flex justify-center pb-2 shrink-0">
                <div className="w-32 h-1 bg-white/10 rounded-full"></div>
              </div>
 
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
