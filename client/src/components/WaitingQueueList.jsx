import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  UserCheck, 
  Trash2, 
  Clock, 
  Search, 
  UserPlus, 
  PlayCircle,
  FastForward
} from 'lucide-react';

export default function WaitingQueueList({
  queue,
  waitingTokens,
  servingTokens,
  onServeNext,
  onServeSpecific,
  onMoveUp,
  onMoveDown,
  onSkip,
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
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E3DC]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#243447] tracking-tight">Waiting Queue</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#4F807A]/15 border border-[#4F807A]/25 text-[#4F807A] font-bold text-xs">
              {waitingTokens.length} in line
            </span>
          </div>
          <p className="text-xs text-[#30343B]/60 mt-0.5">
            Manage ticket sequence, call next customer, or handle arrivals
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Requirement 6: Assign top token for service */}
          <button
            onClick={() => onServeNext(queue.id)}
            disabled={waitingTokens.length === 0 || loadingAction}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-[#243447] hover:bg-[#1b2735] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            title={topToken ? `Call top token: ${topToken.token_code} (${topToken.customer_name})` : 'No tokens in queue'}
          >
            <PlayCircle className="w-4 h-4 text-[#4F807A]" />
            <span className="whitespace-nowrap">Assign Top Token</span>
            {topToken && (
              <span className="hidden xs:inline px-1.5 py-0.5 rounded bg-white/20 text-white text-[11px] font-mono">
                {topToken.token_code}
              </span>
            )}
          </button>

          {/* Add person */}
          <button
            onClick={onOpenAddModal}
            className="py-2.5 px-3.5 bg-[#F7F6F2] hover:bg-[#E5E3DC] text-[#243447] font-bold text-xs sm:text-sm rounded-xl border border-[#E5E3DC] transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4 text-[#4F807A]" />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {waitingTokens.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#30343B]/40" />
          <input
            type="text"
            placeholder="Search by name, token code, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
          />
        </div>
      )}

      {/* List of Waiting Tokens */}
      {waitingTokens.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-[#E5E3DC] rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F6F2] border border-[#E5E3DC] text-[#4F807A] mx-auto flex items-center justify-center mb-3">
            <UserCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#243447]">Queue is Clear!</h4>
          <p className="text-xs text-[#30343B]/60 max-w-sm mx-auto mt-1 mb-4">
            There are currently no customers waiting in <strong className="text-[#243447]">{queue.name}</strong>.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#243447] hover:bg-[#1b2735] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add First Person to Queue</span>
          </button>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#30343B]/60">
          No tokens match your search criteria "{searchTerm}".
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTokens.map((token) => {
            const isTop = token.position === 1;
            const isLast = token.position === waitingTokens.length;

            return (
              <div
                key={token.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-150 gap-3 ${
                  isTop
                    ? 'bg-[#4F807A]/5 border-[#4F807A]/40 shadow-xs'
                    : 'bg-[#F7F6F2]/70 hover:bg-[#F7F6F2] border-[#E5E3DC]'
                }`}
              >
                {/* Left: Position Badge & Customer Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Position Badge */}
                  <div
                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-xl font-black text-xs shrink-0 ${
                      isTop
                        ? 'bg-[#243447] text-white shadow-xs'
                        : 'bg-white text-[#30343B] border border-[#E5E3DC]'
                    }`}
                  >
                    <span className="text-[11px]">#{token.position}</span>
                    {isTop && <span className="text-[7px] font-mono leading-none text-[#4F807A]">NEXT</span>}
                  </div>

                  {/* Token Code */}
                  <div className="shrink-0 font-mono text-xs sm:text-sm font-black text-[#243447] px-2.5 py-1 bg-white border border-[#E5E3DC] rounded-lg">
                    {token.token_code}
                  </div>

                  {/* Customer details */}
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-[#243447] truncate">
                        {token.customer_name}
                      </span>
                      {token.priority && token.priority !== 'NORMAL' && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-[#C98262]/15 text-[#C98262] border border-[#C98262]/30">
                          {token.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#30343B]/60 mt-0.5">
                      {token.customer_phone && <span className="hidden xs:inline">{token.customer_phone}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#30343B]/40 shrink-0" />
                        <span>Wait: {formatWaitTime(token.created_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions row */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E3DC] w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    {/* Move Up */}
                    <button
                      onClick={() => onMoveUp(token.id)}
                      disabled={isTop || loadingAction}
                      title="Move Up in Queue"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#E5E3DC] text-[#243447] border border-[#E5E3DC] disabled:opacity-25 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => onMoveDown(token.id)}
                      disabled={isLast || loadingAction}
                      title="Move Down in Queue"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#E5E3DC] text-[#243447] border border-[#E5E3DC] disabled:opacity-25 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Skip Token (Move to End) */}
                    {onSkip && (
                      <button
                        onClick={() => onSkip(token.id)}
                        disabled={isLast || loadingAction}
                        title="Skip token to bottom of queue"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#C98262]/10 text-[#C98262] border border-[#E5E3DC] disabled:opacity-25 transition-colors"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none justify-end">
                    {/* Direct Call / Serve button */}
                    <button
                      onClick={() => onServeSpecific(token.id)}
                      disabled={loadingAction}
                      title="Serve this person now"
                      className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg bg-[#4F807A] hover:bg-[#3d6560] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Serve</span>
                    </button>

                    {/* Cancel Token Button */}
                    <button
                      onClick={() => onOpenCancelModal(token)}
                      disabled={loadingAction}
                      title="Cancel Token"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-[#E5E3DC] hover:border-rose-200 transition-colors shrink-0"
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
