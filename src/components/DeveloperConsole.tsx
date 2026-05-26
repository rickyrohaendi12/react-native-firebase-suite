/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Terminal, Activity, FileCode, Check, Copy, Send, Database, AlertCircle, 
  Smartphone, Bell, RefreshCw, Key, ShieldCheck, HelpCircle
} from 'lucide-react';
import { CODE_SNIPPETS } from './CodeSnippets';
import { NetworkLog } from '../types';

interface DeveloperConsoleProps {
  logs: NetworkLog[];
  isFirebaseConnected: boolean;
  onTriggerNotification: (title: string, body: string) => Promise<void>;
  onClearLogs: () => void;
  userId: string | undefined;
}

export default function DeveloperConsole({
  logs,
  isFirebaseConnected,
  onTriggerNotification,
  onClearLogs,
  userId
}: DeveloperConsoleProps) {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'rules' | 'auth' | 'crud' | 'push'>('rules');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(false);

  // Template Quick Notifications
  const templates = [
    { title: '⏰ Jadwal Pengingat', body: 'Tugas prioritas tinggi Anda mendekati tenggat waktu hari ini.' },
    { title: '🚀 Sistem Terupdate', body: 'Integrasi Firebase React Native SDK berjalan optimal.' },
    { title: '🎉 Promo Spesial', body: 'Dapatkan akses Premium Cloud Sync seumur hidup sekarang!' },
  ];

  // Handle manual push dispatch
  const handleSendNotification = async (title: string, body: string) => {
    if (!userId) {
      alert("Harap login atau buat akun terlebih dahulu di simulator smartphone!");
      return;
    }
    if (!title.trim() || !body.trim()) return;
    setIsSendingNotif(true);
    try {
      await onTriggerNotification(title.trim(), body.trim());
      setCustomTitle('');
      setCustomBody('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  const activeSnippetText = 
    activeSnippetTab === 'auth' ? CODE_SNIPPETS.auth :
    activeSnippetTab === 'crud' ? CODE_SNIPPETS.crud :
    activeSnippetTab === 'push' ? CODE_SNIPPETS.push : '';

  const securityRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Deny all by default
    }
    match /users/{userId} {
      allow get: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['uid', 'email'])
        && request.resource.data.uid == request.auth.uid;
      allow update: if request.auth != null && request.auth.uid == userId
        && request.resource.data.uid == resource.data.uid;
        
      match /tasks/{taskId} {
        allow list, get: if request.auth != null && request.auth.uid == userId;
        allow create, update: if request.auth != null && request.auth.uid == userId
          && request.resource.data.userId == request.auth.uid;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  return (
    <div className="flex flex-col h-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.8)] relative">
      <div className="absolute inset-0 bg-[#050508]/45 -z-10"></div>
      
      {/* Dev Header */}
      <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-indigo-400" />
          <h2 className="text-sm font-bold tracking-tight text-white font-display uppercase tracking-wide">Developer Suite Console</h2>
        </div>
        
        {/* Connection Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 font-mono">CONNECTION LINK:</span>
          {isFirebaseConnected ? (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Connected
            </span>
          ) : (
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Simulator Mode
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
        
        {/* Left Side: Notification Sandbox + Logs Log (5 Grid Units) */}
        <div className="lg:col-span-5 border-r border-white/5 flex flex-col overflow-y-auto p-5 space-y-5 h-full">
          
          {/* Simulation Guide */}
          {!isFirebaseConnected && (
            <div className="bg-indigo-500/5 border border-indigo-500/15 p-3.5 rounded-2xl flex gap-3 shadow-[0_0_15px_rgba(99,102,241,0.02)]">
              <AlertCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white font-sans">Firebase Sandbox Active</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                  Sistem berjalan dalam mode simulator instan yang sangat responsif. Anda dapat menghubungkan database server Firestore dan Auth Google Cloud asli secara instan dengan mengklik tombol **Setup Firebase** di bagian dashboard platform AI Studio Anda.
                </p>
              </div>
            </div>
          )}

          {/* Push Notification Panel */}
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Push Notification Dispatcher</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-3 leading-normal font-sans">
              Notifikasi push dikirim secara real-time ke simulator perangkat. Saat anda menulis payload atau memicu pesan, itu langsung masuk ke database Users dan ditarik oleh perangkat menggunakan Firebase onSnapshot.
            </p>

            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-bold text-slate-550 font-mono block uppercase">Quick Dispatch Templates:</span>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((tmpl, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendNotification(tmpl.title, tmpl.body)}
                    disabled={!userId}
                    className="text-left w-full bg-white/[0.02] hover:bg-white/[0.05] p-2.5 rounded-xl border border-white/5 text-xs transition-all flex justify-between items-center group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 group-hover:text-white block transition-colors">{tmpl.title}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[210px]">{tmpl.body}</span>
                    </div>
                    <Send size={12} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notification Form */}
            <div className="space-y-2 bg-[#050508]/40 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">Custom Push Payload:</span>
              <input 
                type="text" 
                placeholder="Judul Notifikasi" 
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-[#050508]/80 text-white placeholder-slate-600 text-xs p-2.5 rounded-lg border border-white/5 focus:outline-none focus:border-indigo-500/30 transition-all font-sans"
              />
              <textarea 
                placeholder="Isi pesan notifikasi..." 
                value={customBody}
                rows={2}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full bg-[#050508]/80 text-white placeholder-slate-600 text-xs p-2.5 rounded-lg border border-white/5 focus:outline-none focus:border-indigo-500/30 transition-all resize-none font-sans"
              />
              <button 
                onClick={() => handleSendNotification(customTitle, customBody)}
                disabled={isSendingNotif || !customTitle.trim() || !userId}
                className="w-full bg-gradient-to-br from-indigo-500 to-blue-600 hover:opacity-90 disabled:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                {isSendingNotif ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <>
                    <Send size={12} />
                    <span>Kirim Notifikasi Push</span>
                  </>
                )}
              </button>
              {!userId && (
                <span className="text-[9px] text-slate-500 font-mono text-center block leading-none mt-1">
                  💡 Buat akun atau masuk terlebih dahulu di simulator mobile untuk menguji
                </span>
              )}
            </div>
          </div>

          {/* Event telemetry logs */}
          <div className="flex-1 flex flex-col bg-[#050508]/30 border border-white/5 p-4 rounded-2xl overflow-hidden min-h-[180px]">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <Activity size={14} className="text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Live Event Telemetry</h3>
              </div>
              <button 
                onClick={onClearLogs}
                className="text-[10px] text-slate-400 hover:text-white font-mono px-2 py-0.5 rounded bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-[11px] select-text">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-center py-6">
                  <span>Menunggu aktivitas event dari simulator...</span>
                </div>
              ) : (
                logs.map((log) => {
                  const typeColors = {
                    auth: 'text-violet-400',
                    firestore: 'text-amber-450',
                    push: 'text-sky-400'
                  };
                  return (
                    <div key={log.id} className="pb-2 border-b border-white/[0.02] last:border-0 flex items-start gap-1 p-1 hover:bg-white/[0.01] rounded">
                      <span className="text-slate-550 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`${typeColors[log.type]} uppercase font-bold shrink-0 select-none`}>{log.type}</span>
                      <span className="text-slate-500 shrink-0 select-none">{log.direction === 'in' ? '→' : log.direction === 'out' ? '←' : '•'}</span>
                      <span className="text-slate-300 leading-normal break-words">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Code snippets & Security rules (7 Grid Units) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden h-full bg-[#050508]/15">
          
          {/* Dynamic Tabs Selector */}
          <div className="bg-white/[0.01] px-4 pt-3 border-b border-white/5 flex flex-wrap gap-1">
            <button 
              onClick={() => setActiveSnippetTab('rules')}
              className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider transition-all border-t-2 cursor-pointer ${activeSnippetTab === 'rules' ? 'border-indigo-500 bg-white/[0.03] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              🌐 Security Rules
            </button>
            <button 
              onClick={() => setActiveSnippetTab('auth')}
              className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider transition-all border-t-2 cursor-pointer ${activeSnippetTab === 'auth' ? 'border-indigo-500 bg-white/[0.03] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              🔑 RN Firebase Auth
            </button>
            <button 
              onClick={() => setActiveSnippetTab('crud')}
              className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider transition-all border-t-2 cursor-pointer ${activeSnippetTab === 'crud' ? 'border-indigo-500 bg-white/[0.03] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              🗄️ RN Firestore CRUD
            </button>
            <button 
              onClick={() => setActiveSnippetTab('push')}
              className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider transition-all border-t-2 cursor-pointer ${activeSnippetTab === 'push' ? 'border-indigo-500 bg-white/[0.03] text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              📣 RN FCM Push Notif
            </button>
          </div>

          {/* Code Viewer Screen */}
          <div className="flex-1 flex flex-col overflow-hidden p-5 bg-[#050508]/30 relative">
            
            {/* Meta Description Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <FileCode size={14} className="text-emerald-400" />
                <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  {activeSnippetTab === 'rules' ? 'Firestore Security Schema rules' : 'React Native Code Integration'}
                </span>
              </div>

              {/* Copy Code Button */}
              <button
                onClick={() => handleCopyCode(activeSnippetTab === 'rules' ? securityRulesSnippet : activeSnippetText)}
                className="bg-white text-black hover:opacity-90 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copiedIndex ? (
                  <>
                    <Check size={13} className="text-emerald-600 animate-pulse" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Highlight Codeblock View */}
            <div className="flex-1 overflow-auto bg-[#050508]/80 rounded-2xl border border-white/5 p-4 font-mono text-[11px] text-zinc-300 select-text leading-relaxed">
              <pre>
                <code>
                  {activeSnippetTab === 'rules' ? securityRulesSnippet : activeSnippetText}
                </code>
              </pre>
            </div>

            {/* Micro Explanations */}
            <div className="mt-3 text-[10px] leading-relaxed text-slate-500 flex gap-2 items-start font-sans">
              <ShieldCheck size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                {activeSnippetTab === 'rules' && 'Aturan firewall basis data berbasis Attribute-Based Access Control (ABAC) yang di-deploy ke Firebase Firestore.'}
                {activeSnippetTab === 'auth' && 'Logika penanganan autentikasi login dan pendaftaran pengguna menggunakan Firebase Auth secara asynchronous.'}
                {activeSnippetTab === 'crud' && 'Logika sinkronisasi data real-time Firestore onSnapshot() yang menghemat resource dan auto-update UI ditiap paritas.'}
                {activeSnippetTab === 'push' && 'Setup konfigurasi Expo Notifications dengan FCM Device ID untuk real-time targeting push notification payload.'}
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
