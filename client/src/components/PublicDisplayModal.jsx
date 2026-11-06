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
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden animate-fade-in">
      {/* Top TV Header (Responsive) */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-white truncate">{queue.name}</h1>
            <p className="text-[10px] sm:text-xs text-indigo-400 font-medium uppercase tracking-wider truncate">
              {queue.counter_name || 'Counter 1'} • Live Status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-6 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span className="font-mono text-xs sm:text-lg font-bold text-slate-200">{clock}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
            title="Exit Fullscreen"
          >
            <X className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen Body */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-3.5 sm:p-8 lg:p-10 gap-4 sm:gap-8 overflow-y-auto">
        {/* Left / Top: NOW SERVING (Big Prominent Showcase) */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-emerald-950/50 border-2 border-indigo-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-lg space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm tracking-wider uppercase animate-pulse">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400" />
              NOW SERVING
            </div>

            {currentToken ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="font-mono text-5xl sm:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight drop-shadow-[0_10px_20px_rgba(99,102,241,0.5)]">
                  {currentToken.token_code}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-3xl font-bold text-white">
                    {currentToken.customer_name}
                  </h3>
                  <p className="text-sm sm:text-lg text-emerald-400 font-medium flex items-center justify-center gap-1.5 sm:gap-2">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    <span>Proceed to <strong className="text-white underline decoration-emerald-400">{currentToken.counter_assigned || queue.counter_name || 'Counter 1'}</strong></span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 sm:py-12 space-y-2 sm:space-y-3">
                <div className="font-mono text-4xl sm:text-5xl font-bold text-slate-600">---</div>
                <p className="text-slate-400 text-sm sm:text-base">Counter is currently ready for the next customer</p>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: NEXT IN LINE */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Next In Line</h2>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {waiting.length} Waiting
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[300px] lg:max-h-none">
            {waiting.length === 0 ? (
              <div className="h-40 sm:h-64 flex flex-col items-center justify-center text-slate-500 text-xs sm:text-sm">
                <span>No customers currently in waiting line</span>
              </div>
            ) : (
              waiting.map((token, index) => (
                <div
                  key={token.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all ${
                    index === 0
                      ? 'bg-indigo-600/15 border-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl font-bold text-xs flex items-center justify-center ${
                      index === 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{token.position}
                    </div>

                    <div>
                      <span className="font-mono font-bold text-sm sm:text-base text-white">
                        {token.token_code}
                      </span>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                        {token.customer_name}
                      </p>
                    </div>
                  </div>

                  {index === 0 ? (
                    <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      NEXT
                    </span>
                  ) : (
                    <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
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
