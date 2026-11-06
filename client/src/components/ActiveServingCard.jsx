import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { voice } from '../services/voice';
import { 
  CheckCircle2, 
  Clock, 
  Volume2, 
  UserCheck, 
  Building2, 
  Sparkles,
  Phone
} from 'lucide-react';

export default function ActiveServingCard({ servingToken, queue, onComplete, onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!servingToken) {
      setElapsed(0);
      return;
    }

    const calcElapsed = () => {
      const start = servingToken.service_started_at ? new Date(servingToken.service_started_at).getTime() : Date.now();
      const diffSecs = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(diffSecs);
    };

    calcElapsed();
    const timer = setInterval(calcElapsed, 1000);
    return () => clearInterval(timer);
  }, [servingToken]);

  const formatDuration = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleComplete = async () => {
    if (!servingToken || completing) return;
    setCompleting(true);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      await onComplete(servingToken.id);
    } finally {
      setCompleting(false);
    }
  };

  const handleReAnnounce = () => {
    if (servingToken) {
      voice.announceToken(servingToken.token_code, servingToken.counter_assigned || queue?.counter_name || 'Counter 1');
    }
  };

  if (!servingToken) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-500 mx-auto flex items-center justify-center mb-2.5 sm:mb-3">
          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">Counter is Currently Idle</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Click <span className="text-indigo-400 font-semibold">"Assign Top Token for Service"</span> below to start serving the next person in line.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-emerald-950/40 border border-indigo-500/40 rounded-2xl p-4 sm:p-6 shadow-xl shadow-indigo-950/50 animate-slide-up">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
        {/* Token Info */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/50 text-indigo-300 shadow-inner shrink-0">
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-indigo-400 tracking-wider">NOW SERVING</span>
            <span className="font-mono text-xl sm:text-3xl font-black text-white tracking-tight">
              {servingToken.token_code}
            </span>
            <span className="text-[8px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SERVING
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <h3 className="text-base sm:text-xl font-bold text-white truncate">
                {servingToken.customer_name}
              </h3>
              {servingToken.priority && servingToken.priority !== 'NORMAL' && (
                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  servingToken.priority === 'VIP'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  ★ {servingToken.priority}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50 text-[11px] sm:text-xs">
                <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                {servingToken.counter_assigned || queue?.counter_name || 'Counter 1'}
              </span>

              {servingToken.customer_phone && (
                <span className="hidden xs:flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {servingToken.customer_phone}
                </span>
              )}

              <span className="flex items-center gap-1 text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30 text-[11px] sm:text-xs">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                {formatDuration(elapsed)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Full width on mobile for easy thumb tapping */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
          <button
            onClick={handleReAnnounce}
            title="Re-announce token aloud"
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0"
          >
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Recall</span>
          </button>

          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 md:flex-none py-2.5 px-4 sm:px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>{completing ? 'Completing...' : 'Complete Service'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
