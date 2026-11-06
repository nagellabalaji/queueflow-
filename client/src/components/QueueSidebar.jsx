import React from 'react';
import { PlusCircle, Layers, Users, Clock, Building2, Plus } from 'lucide-react';

export default function QueueSidebar({ queues, activeQueueId, onSelectQueue, onOpenCreateModal }) {
  return (
    <div className="space-y-3">
      {/* Mobile Horizontal Carousel (< lg) */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#243447] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#4F807A]" />
            <span>Select Queue</span>
          </span>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-[#4F807A] hover:text-[#3d6560] font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Queue</span>
          </button>
        </div>

        {/* Scrollable pills bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
          {queues.map((q) => {
            const isActive = q.id === activeQueueId;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQueue(q.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#243447] text-white border-[#243447] shadow-sm'
                    : 'bg-white text-[#30343B] border-[#E5E3DC] hover:border-[#4F807A]'
                }`}
              >
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F7F6F2] text-[#243447]'
                }`}>
                  {q.code_prefix}
                </span>
                <span className="truncate max-w-[120px]">{q.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : q.waiting_count > 0
                    ? 'bg-[#4F807A]/15 text-[#4F807A]'
                    : 'bg-[#F7F6F2] text-[#30343B]/50'
                }`}>
                  {q.waiting_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Vertical Cards (lg and up) */}
      <div className="hidden lg:block space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#243447] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#4F807A]" />
            <span>Active Queues</span>
          </h2>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-[#4F807A] hover:text-[#3d6560] font-bold flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Queue</span>
          </button>
        </div>

        <div className="space-y-2">
          {queues.map((q) => {
            const isActive = q.id === activeQueueId;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQueue(q.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-white border-[#243447] shadow-sm ring-1 ring-[#243447]'
                    : 'bg-white hover:bg-[#F7F6F2]/80 border-[#E5E3DC] hover:border-[#4F807A]/50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#4F807A] rounded-r-full" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-[#F7F6F2] text-[#243447] border border-[#E5E3DC]">
                        {q.code_prefix}
                      </span>
                      <h4 className="font-bold text-sm text-[#243447] truncate">
                        {q.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#30343B]/60 mt-1 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-[#4F807A] shrink-0" />
                      <span>{q.counter_name || 'Counter 1'}</span>
                    </p>
                  </div>

                  {/* Waiting Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      q.waiting_count > 0
                        ? 'bg-[#4F807A]/15 text-[#4F807A] border border-[#4F807A]/30'
                        : 'bg-[#F7F6F2] text-[#30343B]/50'
                    }`}>
                      {q.waiting_count} waiting
                    </span>
                    {q.current_serving_token && (
                      <span className="text-[10px] text-[#64866A] font-mono mt-1 font-bold">
                        Now: {q.current_serving_token}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
