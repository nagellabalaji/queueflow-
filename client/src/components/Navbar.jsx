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
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E3DC] shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#243447] flex items-center justify-center shadow-sm">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-[#243447]">QueueFlow</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#4F807A]/15 text-[#4F807A] border border-[#4F807A]/25">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-[#30343B]/60 -mt-0.5 hidden md:block">Intelligent Queue Operations</p>
          </div>
        </div>

        {/* View Switcher Tabs (Responsive icons on mobile, labels on tablet/desktop) */}
        <div className="flex items-center bg-[#F7F6F2] p-1 rounded-xl border border-[#E5E3DC] text-xs">
          <button
            onClick={() => setActiveTab('queues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'queues'
                ? 'bg-[#243447] text-white shadow-sm'
                : 'text-[#30343B]/70 hover:text-[#243447] hover:bg-white/60'
            }`}
            title="Queues & Operations"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Queues</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#243447] text-white shadow-sm'
                : 'text-[#30343B]/70 hover:text-[#243447] hover:bg-white/60'
            }`}
            title="Analytics Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'customer'
                ? 'bg-[#243447] text-white shadow-sm'
                : 'text-[#30343B]/70 hover:text-[#243447] hover:bg-white/60'
            }`}
            title="Customer Self-Service Kiosk & Tracker"
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Customer Kiosk</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'kiosk'
                ? 'bg-[#243447] text-white shadow-sm'
                : 'text-[#30343B]/70 hover:text-[#243447] hover:bg-white/60'
            }`}
            title="Live TV Counter Monitor"
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">TV Display</span>
          </button>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#64866A]/10 border border-[#64866A]/20 text-[#64866A] text-xs font-semibold">
            <Radio className="w-3 h-3 animate-pulse text-[#64866A]" />
            <span>Live Sync</span>
          </div>

          {/* Voice Announcement Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceEnabled ? 'Voice Announcements On (Click to Mute)' : 'Voice Announcements Muted (Click to Enable)'}
            className={`p-2 rounded-xl border text-xs sm:text-sm transition-colors ${
              voiceEnabled
                ? 'bg-[#4F807A]/15 border-[#4F807A]/30 text-[#4F807A] hover:bg-[#4F807A]/25'
                : 'bg-[#F7F6F2] border-[#E5E3DC] text-[#30343B]/40 hover:text-[#30343B]'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manager User Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E3DC]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#243447] leading-tight truncate max-w-[100px]">{manager?.name || 'Manager'}</span>
              <span className="text-[10px] text-[#30343B]/60 leading-tight">@{manager?.username || 'admin'}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#F7F6F2] border border-[#E5E3DC] flex items-center justify-center text-[#243447] font-bold text-xs">
              {manager?.name ? manager.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#30343B]/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
