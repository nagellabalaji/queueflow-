import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { voice } from '../services/voice';
import { 
  Layers, 
  BarChart3, 
  Tv, 
  Volume2, 
  VolumeX, 
  LogOut, 
  User, 
  Radio
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { manager, logout } = useAuth();
  const [voiceEnabled, setVoiceEnabled] = useState(voice.isEnabled());

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    voice.setEnabled(nextVal);
    setVoiceEnabled(nextVal);
    if (nextVal) {
      voice.announceToken('TEST', 'Counter 1');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">QueueFlow</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden md:block">Intelligent Queue Management System</p>
          </div>
        </div>

        {/* View Switcher Tabs (Responsive icons on mobile, labels on tablet/desktop) */}
        <div className="flex items-center bg-slate-950/80 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('queues')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-medium transition-all duration-150 ${
              activeTab === 'queues'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Queues & Operations"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Queues</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-medium transition-all duration-150 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Analytics Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-medium transition-all duration-150 ${
              activeTab === 'kiosk'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Public TV Kiosk View"
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">TV Kiosk</span>
          </button>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>Live Sync</span>
          </div>

          {/* Voice Announcement Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceEnabled ? 'Voice Announcements On (Click to Mute)' : 'Voice Announcements Muted (Click to Enable)'}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs sm:text-sm transition-colors ${
              voiceEnabled
                ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/80'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Manager User Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[100px]">{manager?.name || 'Manager'}</span>
              <span className="text-[10px] text-slate-400 leading-tight">@{manager?.username || 'admin'}</span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              {manager?.name ? manager.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
