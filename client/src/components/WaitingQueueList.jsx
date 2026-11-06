import React, { useState, useEffect } from 'react';
import { voice } from '../services/voice';
import { 
  ArrowUp, 
  ArrowDown, 
  UserCheck, 
  Trash2, 
  Clock, 
  Search, 
  UserPlus, 
  PlayCircle
} from 'lucide-react';

export default function WaitingQueueList({
  queue,
  waitingTokens,
  servingTokens,
  onServeNext,
  onServeSpecific,
  onMoveUp,
  onMoveDown,
  onOpenAddModal,
  onOpenCancelModal,
  loadingAction
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer tick every second for real-time wait duration display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWaitTime = (createdAt) => {
    if (!createdAt) return '0s';
    const createdMs = new Date(createdAt).getTime();
    const diffSecs = Math.max(0, Math.floor((currentTime - createdMs) / 1000));
    
    if (diffSecs < 60) return `${diffSecs}s`;
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const filteredTokens = waitingTokens.filter(t => 
    t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.token_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.customer_phone && t.customer_phone.includes(searchTerm))
  );

  const topToken = waitingTokens.length > 0 ? waitingTokens[0] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Waiting Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
              {waitingTokens.length} in line
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Manage token positions, call next person, or add new arrivals
          </p>
        </div>

        {/* Action Buttons: Responsive for mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Requirement 6: The manager can assign the token at the top of the queue for service [With a simple button click] */}
          <button
            onClick={() => onServeNext(queue.id)}
            disabled={waitingTokens.length === 0 || loadingAction}
            className="flex-1 sm:flex-none py-2.5 px-3.5 sm:px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-40 disabled:cursor-not-allowed group border border-indigo-400/20"
            title={topToken ? `Call top token: ${topToken.token_code} (${topToken.customer_name})` : 'No tokens in queue'}
          >
            <PlayCircle className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform shrink-0" />
            <span className="whitespace-nowrap">Assign Top Token</span>
            {topToken && (
              <span className="hidden xs:inline px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-200 text-[10px] sm:text-[11px] font-mono border border-indigo-400/30">
                {topToken.token_code}
              </span>
            )}
          </button>

          {/* Requirement 3: Add new persons / tokens */}
          <button
            onClick={onOpenAddModal}
            className="py-2.5 px-3 sm:px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {waitingTokens.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-2.5 sm:top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, token code, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-9 sm:pl-10 pr-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      )}

      {/* List of Waiting Tokens */}
      {waitingTokens.length === 0 ? (
        <div className="py-10 sm:py-12 px-4 text-center border-2 border-dashed border-slate-800/80 rounded-xl">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-2.5 sm:mb-3">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">Queue is Clear!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3.5 sm:mb-4">
            There are currently no customers waiting in <span className="text-slate-400 font-medium">{queue.name}</span>.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add First Person to Queue</span>
          </button>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No tokens match your search criteria "{searchTerm}".
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTokens.map((token) => {
            const isTop = token.position === 1;
            const isLast = token.position === waitingTokens.length;

            return (
              <div
                key={token.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all duration-200 gap-2.5 sm:gap-3 ${
                  isTop
                    ? 'bg-gradient-to-r from-indigo-950/40 via-slate-950/60 to-indigo-950/20 border-indigo-500/40 shadow-sm shadow-indigo-950/40'
                    : 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Left: Position Badge & Customer Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Position Badge */}
                  <div
                    className={`flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-bold text-xs shrink-0 ${
                      isTop
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/40'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs">#{token.position}</span>
                    {isTop && <span className="text-[7px] sm:text-[8px] font-mono leading-none text-indigo-200">NEXT</span>}
                  </div>

                  {/* Token Code */}
                  <div className="shrink-0 font-mono text-xs sm:text-base font-bold text-white px-2 py-1 bg-slate-900 border border-slate-700/60 rounded-lg">
                    {token.token_code}
                  </div>

                  {/* Customer details */}
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-200 truncate">
                        {token.customer_name}
                      </span>
                      {token.priority && token.priority !== 'NORMAL' && (
                        <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          token.priority === 'VIP'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {token.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 mt-0.5">
                      {token.customer_phone && <span className="hidden xs:inline">{token.customer_phone}</span>}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Wait: {formatWaitTime(token.created_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions row (Optimized touch targets for mobile) */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    {/* Move Up Button (Requirement 5) */}
                    <button
                      onClick={() => onMoveUp(token.id)}
                      disabled={isTop || loadingAction}
                      title="Move Up in Queue"
                      className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 disabled:opacity-25 disabled:hover:bg-slate-800/80 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down Button (Requirement 5) */}
                    <button
                      onClick={() => onMoveDown(token.id)}
                      disabled={isLast || loadingAction}
                      title="Move Down in Queue"
                      className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 disabled:opacity-25 disabled:hover:bg-slate-800/80 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none justify-end">
                    {/* Direct Call / Serve button */}
                    <button
                      onClick={() => onServeSpecific(token.id)}
                      disabled={loadingAction}
                      title="Call this token now"
                      className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Serve</span>
                    </button>

                    {/* Cancel Token Button (Requirement 7) */}
                    <button
                      onClick={() => onOpenCancelModal(token)}
                      disabled={loadingAction}
                      title="Cancel Token"
                      className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-800/30 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
