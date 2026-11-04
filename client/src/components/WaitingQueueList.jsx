import React, { useState, useEffect } from 'react';
import { voice } from '../services/voice';
import { 
  ArrowUp, 
  ArrowDown, 
  UserCheck, 
  Trash2, 
  Clock, 
  Sparkles, 
  Search, 
  UserPlus, 
  AlertCircle,
  PlayCircle,
  ChevronRight,
  ShieldAlert
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Waiting Queue</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
              {waitingTokens.length} in line
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage token positions, call persons for service, or add arrivals
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Requirement 6: The manager can assign the token at the top of the queue for service [With a simple button click] */}
          <button
            onClick={() => onServeNext(queue.id)}
            disabled={waitingTokens.length === 0 || loadingAction}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group border border-indigo-400/20"
            title={topToken ? `Call top token: ${topToken.token_code} (${topToken.customer_name})` : 'No tokens in queue'}
          >
            <PlayCircle className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
            <span>Assign Top Token for Service</span>
            {topToken && (
              <span className="hidden md:inline px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-200 text-[11px] font-mono border border-indigo-400/30">
                {topToken.token_code}
              </span>
            )}
          </button>

          {/* Requirement 3: Add new persons / tokens */}
          <button
            onClick={onOpenAddModal}
            className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {waitingTokens.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, token code, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      )}

      {/* List of Waiting Tokens */}
      {waitingTokens.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-800/80 rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <UserCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">Queue is Clear!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            There are currently no customers waiting in <span className="text-slate-400 font-medium">{queue.name}</span>.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
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
          {filteredTokens.map((token, index) => {
            const isTop = token.position === 1;
            const isLast = token.position === waitingTokens.length;

            return (
              <div
                key={token.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-200 gap-3 ${
                  isTop
                    ? 'bg-gradient-to-r from-indigo-950/40 via-slate-950/60 to-indigo-950/20 border-indigo-500/40 shadow-sm shadow-indigo-950/40'
                    : 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Left: Position Badge & Customer Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Position Badge */}
                  <div
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl font-bold text-xs shrink-0 ${
                      isTop
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/40'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span>#{token.position}</span>
                    {isTop && <span className="text-[8px] font-mono leading-none text-indigo-200">NEXT</span>}
                  </div>

                  {/* Token Code */}
                  <div className="shrink-0 font-mono text-sm sm:text-base font-bold text-white px-2 py-1 bg-slate-900 border border-slate-700/60 rounded-lg">
                    {token.token_code}
                  </div>

                  {/* Customer details */}
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200 truncate">
                        {token.customer_name}
                      </span>
                      {token.priority && token.priority !== 'NORMAL' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          token.priority === 'VIP'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {token.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {token.customer_phone && <span>{token.customer_phone}</span>}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Waiting: {formatWaitTime(token.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  {/* Move Up Button (Requirement 5) */}
                  <button
                    onClick={() => onMoveUp(token.id)}
                    disabled={isTop || loadingAction}
                    title="Move Up in Queue"
                    className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 disabled:opacity-30 disabled:hover:bg-slate-800/70 disabled:hover:text-slate-300 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down Button (Requirement 5) */}
                  <button
                    onClick={() => onMoveDown(token.id)}
                    disabled={isLast || loadingAction}
                    title="Move Down in Queue"
                    className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 disabled:opacity-30 disabled:hover:bg-slate-800/70 disabled:hover:text-slate-300 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Direct Call / Serve button */}
                  <button
                    onClick={() => onServeSpecific(token.id)}
                    disabled={loadingAction}
                    title="Call token now"
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Serve</span>
                  </button>

                  {/* Cancel Token Button (Requirement 7) */}
                  <button
                    onClick={() => onOpenCancelModal(token)}
                    disabled={loadingAction}
                    title="Cancel Token"
                    className="p-2 rounded-lg bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-800/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
