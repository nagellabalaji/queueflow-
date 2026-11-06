import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { voice } from '../services/voice';
import { 
  Layers, 
  BarChart3, 
  Tv, 
  Ticket,
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
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-black text-sm sm:text-lg tracking-tight text-[#1E293B]">QueueFlow</span>
              <span className="hidden sm:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] -mt-0.5 hidden md:block">Intelligent Queue Operations</p>
          </div>
        </div>

        {/* View Switcher Tabs (Compact touch buttons on mobile, full labels on desktop) */}
        <div className="flex items-center bg-[#F1F5F9] p-0.5 sm:p-1 rounded-xl border border-[#E2E8F0] text-xs shrink-0">
          <button
            onClick={() => setActiveTab('queues')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg font-bold transition-all ${
              activeTab === 'queues'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
            title="Queues & Operations"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Queues</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
            title="Analytics Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg font-bold transition-all ${
              activeTab === 'customer'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
            title="Customer Self-Service Kiosk & Tracker"
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Customer Kiosk</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg font-bold transition-all ${
              activeTab === 'kiosk'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
            }`}
            title="Live TV Counter Monitor"
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">TV Display</span>
          </button>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] text-xs font-semibold">
            <Radio className="w-3 h-3 animate-pulse text-[#10B981]" />
            <span>Live Sync</span>
          </div>

          {/* Voice Announcement Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceEnabled ? 'Voice Announcements On (Click to Mute)' : 'Voice Announcements Muted (Click to Enable)'}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs sm:text-sm transition-colors cursor-pointer ${
              voiceEnabled
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manager User Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#E2E8F0]">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-[#1E293B] leading-tight truncate max-w-[100px]">{manager?.name || 'Manager'}</span>
              <span className="text-[10px] text-[#64748B] leading-tight">@{manager?.username || 'admin'}</span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] font-bold text-xs shrink-0">
              {manager?.name ? manager.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
