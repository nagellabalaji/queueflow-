import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { voice } from '../services/voice';
import { 
  CheckCircle2, 
  Clock, 
  Volume2, 
  UserCheck, 
  Building2, 
  Phone,
  RotateCcw
} from 'lucide-react';

export default function ActiveServingCard({ servingToken, queue, onComplete, onRecall }) {
  const [elapsed, setElapsed] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [recalling, setRecalling] = useState(false);

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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      await onComplete(servingToken.id);
    } finally {
      setCompleting(false);
    }
  };

  const handleRecallClick = async () => {
    if (!servingToken || recalling) return;
    setRecalling(true);
    try {
      voice.announceToken(servingToken.token_code, servingToken.counter_assigned || queue?.counter_name || 'Counter 1');
      if (onRecall) {
        await onRecall(servingToken.id);
      }
    } finally {
      setRecalling(false);
    }
  };

  if (!servingToken) {
    return (
      <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 sm:p-6 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#F7F6F2] border border-[#E5E3DC] text-[#30343B]/50 mx-auto flex items-center justify-center mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#243447]">Counter is Currently Idle</h4>
        <p className="text-xs text-[#30343B]/60 max-w-sm mx-auto mt-1">
          Click <span className="text-[#4F807A] font-bold">"Assign Top Token for Service"</span> below to invite the next customer.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Token Info */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center min-w-[115px] sm:min-w-[130px] px-3.5 py-2.5 rounded-xl bg-[#243447] border-2 border-[#4F807A]/50 text-white shadow-sm shrink-0">
            <span className="text-[9px] uppercase font-bold text-[#4F807A] tracking-wider whitespace-nowrap">NOW SERVING</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-normal whitespace-nowrap py-0.5">
              {servingToken.token_code}
            </span>
            <span className="text-[9px] text-[#64866A] font-bold flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64866A] animate-pulse" />
              ACTIVE
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg sm:text-xl font-black text-[#243447] truncate">
                {servingToken.customer_name}
              </h3>
              {servingToken.priority && servingToken.priority !== 'NORMAL' && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#C98262]/15 text-[#C98262] border border-[#C98262]/30">
                  ★ {servingToken.priority}
                </span>
              )}
              {servingToken.recall_count > 0 && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#4F807A]/15 text-[#4F807A] border border-[#4F807A]/30 flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Recalled {servingToken.recall_count}x
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#30343B]/70">
              <span className="flex items-center gap-1 text-[#243447] font-semibold bg-[#F7F6F2] px-2.5 py-1 rounded-md border border-[#E5E3DC]">
                <Building2 className="w-3.5 h-3.5 text-[#4F807A]" />
                {servingToken.counter_assigned || queue?.counter_name || 'Counter 1'}
              </span>

              {servingToken.customer_phone && (
                <span className="hidden xs:flex items-center gap-1 text-[#30343B]/70">
                  <Phone className="w-3 h-3 text-[#30343B]/40" />
                  {servingToken.customer_phone}
                </span>
              )}

              <span className="flex items-center gap-1 text-[#64866A] font-mono font-bold bg-[#64866A]/10 px-2.5 py-1 rounded-md border border-[#64866A]/20">
                <Clock className="w-3.5 h-3.5 text-[#64866A]" />
                {formatDuration(elapsed)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E3DC]">
          <button
            onClick={handleRecallClick}
            disabled={recalling}
            title="Recall customer / re-announce aloud"
            className="py-2.5 px-3.5 rounded-xl bg-[#F7F6F2] hover:bg-[#E5E3DC] text-[#243447] border border-[#E5E3DC] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Volume2 className="w-4 h-4 text-[#4F807A]" />
            <span>Recall</span>
          </button>

          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 md:flex-none py-2.5 px-5 bg-[#64866A] hover:bg-[#527057] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{completing ? 'Completing...' : 'Complete Service'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
