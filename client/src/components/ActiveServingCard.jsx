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
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] mx-auto flex items-center justify-center mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#1E293B]">Counter is Currently Idle</h4>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1">
          Click <span className="text-[#2563EB] font-bold">"Assign Top Token for Service"</span> below to invite the next customer.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
        {/* Token Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex flex-col items-center justify-center min-w-[105px] sm:min-w-[130px] px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#EFF6FF] border-2 border-[#2563EB] text-[#1E293B] shadow-xs shrink-0">
            <span className="text-[8px] sm:text-[9px] uppercase font-bold text-[#2563EB] tracking-wider whitespace-nowrap">NOW SERVING</span>
            <span className="font-mono text-lg sm:text-2xl font-black text-[#2563EB] tracking-normal whitespace-nowrap py-0.5">
              {servingToken.token_code}
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#10B981] font-bold flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              ACTIVE
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <h3 className="text-base sm:text-xl font-black text-[#1E293B] truncate">
                {servingToken.customer_name}
              </h3>
              {servingToken.priority && servingToken.priority !== 'NORMAL' && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                  ★ {servingToken.priority}
                </span>
              )}
              {servingToken.recall_count > 0 && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Recalled {servingToken.recall_count}x
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs text-[#64748B]">
              <span className="flex items-center gap-1 text-[#1E293B] font-semibold bg-[#F1F5F9] px-2 sm:px-2.5 py-1 rounded-md border border-[#E2E8F0] text-[11px] sm:text-xs">
                <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                {servingToken.counter_assigned || queue?.counter_name || 'Counter 1'}
              </span>

              {servingToken.customer_phone && (
                <span className="hidden sm:flex items-center gap-1 text-[#64748B] text-[11px] sm:text-xs">
                  <Phone className="w-3 h-3 text-[#94A3B8]" />
                  {servingToken.customer_phone}
                </span>
              )}

              <span className="flex items-center gap-1 text-[#10B981] font-mono font-bold bg-[#ECFDF5] px-2 sm:px-2.5 py-1 rounded-md border border-[#A7F3D0] text-[11px] sm:text-xs">
                <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                {formatDuration(elapsed)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
          <button
            onClick={handleRecallClick}
            disabled={recalling}
            title="Recall customer / re-announce aloud"
            className="min-h-[42px] py-2 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4 text-[#2563EB]" />
            <span>Recall</span>
          </button>

          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 md:flex-none min-h-[42px] py-2 px-4 sm:px-5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{completing ? 'Completing...' : 'Complete Service'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
