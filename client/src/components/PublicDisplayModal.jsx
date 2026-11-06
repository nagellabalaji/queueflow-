import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { subscribeToQueue } from '../services/socket';
import { Tv, Clock, Users, Building2, X } from 'lucide-react';

export default function PublicDisplayModal({ queue, onClose }) {
  const [data, setData] = useState(null);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const fetchPublicData = async () => {
    if (!queue) return;
    try {
      const res = await api.getPublicQueue(queue.id);
      setData(res);
    } catch (err) {
      console.error('Error fetching public queue:', err);
    }
  };

  useEffect(() => {
    fetchPublicData();
    const clockTimer = setInterval(() => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const unsubscribe = subscribeToQueue(queue.id, () => {
      fetchPublicData();
    });

    return () => {
      clearInterval(clockTimer);
      unsubscribe();
    };
  }, [queue.id]);

  const serving = data?.serving || [];
  const waiting = data?.waiting || [];
  const currentToken = serving.length > 0 ? serving[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-[#1E293B] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Top TV Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-3.5 sm:px-10 py-3 sm:py-4 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-xs shrink-0">
            <Tv className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-[#1E293B] truncate">{queue.name}</h1>
            <p className="text-[10px] sm:text-xs text-[#2563EB] font-bold uppercase tracking-wider truncate">
              {queue.counter_name || 'Counter 1'} • Live Display Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-6 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F1F5F9] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-[#E2E8F0]">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB]" />
            <span className="font-mono text-xs sm:text-lg font-bold text-[#1E293B]">{clock}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:px-4 sm:py-2 bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-xs font-bold rounded-xl border border-[#E2E8F0] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Exit Fullscreen"
          >
            <X className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Exit Display</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen Body */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-3.5 sm:p-8 lg:p-10 gap-5 sm:gap-8 overflow-y-auto">
        {/* Left / Top: NOW SERVING (Big Prominent Showcase) */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center bg-white text-[#1E293B] rounded-3xl p-5 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden text-center border-4 border-[#2563EB]/25">
          <div className="relative z-10 w-full max-w-lg space-y-3 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-black text-xs sm:text-sm tracking-wider uppercase animate-pulse">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#2563EB]" />
              NOW SERVING
            </div>

            {currentToken ? (
              <div className="space-y-2.5 sm:space-y-4">
                <div className="font-mono text-5xl sm:text-8xl lg:text-9xl font-black text-[#2563EB] tracking-tight">
                  {currentToken.token_code}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-4xl font-black text-[#1E293B]">
                    {currentToken.customer_name}
                  </h3>
                  <p className="text-sm sm:text-xl text-[#64748B] font-bold flex items-center justify-center gap-1.5 sm:gap-2">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB] shrink-0" />
                    <span>Please proceed to <strong className="text-[#2563EB] underline decoration-[#2563EB]">{currentToken.counter_assigned || queue.counter_name || 'Counter 1'}</strong></span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 space-y-3">
                <div className="font-mono text-5xl font-black text-[#94A3B8]">---</div>
                <p className="text-[#64748B] text-base font-semibold">Counter is currently ready for the next customer</p>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: NEXT IN LINE */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-xl font-bold text-[#1E293B]">Next In Line</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {waiting.length} Waiting
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[340px] lg:max-h-none">
            {waiting.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-[#64748B] text-sm">
                <span>No customers currently in waiting line</span>
              </div>
            ) : (
              waiting.map((token, index) => (
                <div
                  key={token.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    index === 0
                      ? 'bg-[#EFF6FF] border-[#2563EB]/40 shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#EFF6FF]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                      index === 0
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                    }`}>
                      #{token.position}
                    </div>

                    <div>
                      <span className="font-mono font-black text-base text-[#1E293B]">
                        {token.token_code}
                      </span>
                      <p className="text-xs text-[#64748B] font-medium">
                        {token.customer_name}
                      </p>
                    </div>
                  </div>

                  {index === 0 ? (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-[#2563EB] text-white">
                      NEXT
                    </span>
                  ) : (
                    <span className="text-xs text-[#64748B] font-mono">
                      Pos {token.position}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
