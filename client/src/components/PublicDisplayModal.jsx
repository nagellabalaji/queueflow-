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
    <div className="fixed inset-0 z-50 bg-[#243447] text-white flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Top TV Header */}
      <header className="bg-[#1b2735] border-b border-white/10 px-3.5 sm:px-10 py-3 sm:py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-[#4F807A] flex items-center justify-center shadow-sm shrink-0">
            <Tv className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-white truncate">{queue.name}</h1>
            <p className="text-[10px] sm:text-xs text-[#4F807A] font-bold uppercase tracking-wider truncate">
              {queue.counter_name || 'Counter 1'} • Live Display Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-6 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4F807A]" />
            <span className="font-mono text-xs sm:text-lg font-bold text-white">{clock}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
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
        <div className="lg:col-span-7 flex flex-col justify-center items-center bg-white text-[#243447] rounded-3xl p-5 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden text-center border-4 border-[#64866A]/30">
          <div className="relative z-10 w-full max-w-lg space-y-3 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#64866A]/15 text-[#64866A] font-black text-xs sm:text-sm tracking-wider uppercase animate-pulse">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#64866A]" />
              NOW SERVING
            </div>

            {currentToken ? (
              <div className="space-y-2.5 sm:space-y-4">
                <div className="font-mono text-5xl sm:text-8xl lg:text-9xl font-black text-[#243447] tracking-tight">
                  {currentToken.token_code}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-4xl font-black text-[#243447]">
                    {currentToken.customer_name}
                  </h3>
                  <p className="text-sm sm:text-xl text-[#4F807A] font-bold flex items-center justify-center gap-1.5 sm:gap-2">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#4F807A] shrink-0" />
                    <span>Please proceed to <strong className="text-[#243447] underline decoration-[#4F807A]">{currentToken.counter_assigned || queue.counter_name || 'Counter 1'}</strong></span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 space-y-3">
                <div className="font-mono text-5xl font-black text-[#30343B]/30">---</div>
                <p className="text-[#30343B]/60 text-base font-semibold">Counter is currently ready for the next customer</p>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: NEXT IN LINE */}
        <div className="lg:col-span-5 bg-[#1b2735] border border-white/10 rounded-3xl p-5 sm:p-7 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4F807A]" />
              <h2 className="text-xl font-bold text-white">Next In Line</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#4F807A]/20 text-[#4F807A] border border-[#4F807A]/30">
              {waiting.length} Waiting
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[340px] lg:max-h-none">
            {waiting.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-white/50 text-sm">
                <span>No customers currently in waiting line</span>
              </div>
            ) : (
              waiting.map((token, index) => (
                <div
                  key={token.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    index === 0
                      ? 'bg-white/15 border-[#4F807A]'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                      index === 0
                        ? 'bg-[#4F807A] text-white'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      #{token.position}
                    </div>

                    <div>
                      <span className="font-mono font-black text-base text-white">
                        {token.token_code}
                      </span>
                      <p className="text-xs text-white/70 font-medium">
                        {token.customer_name}
                      </p>
                    </div>
                  </div>

                  {index === 0 ? (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded bg-[#4F807A] text-white">
                      NEXT
                    </span>
                  ) : (
                    <span className="text-xs text-white/50 font-mono">
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
