import React from 'react';
import { PlusCircle, Layers, Users, Clock, Building2, Plus } from 'lucide-react';

export default function QueueSidebar({ queues, activeQueueId, onSelectQueue, onOpenCreateModal }) {
  return (
    <div className="space-y-3">
      {/* Mobile Horizontal Carousel (< lg) */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Select Queue</span>
          </span>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] shadow-xs'
                    : 'bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                }`}
              >
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-black ${
                  isActive ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#2563EB]'
                }`}>
                  {q.code_prefix}
                </span>
                <span className="truncate max-w-[120px]">{q.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-[#2563EB]/15 text-[#2563EB]'
                    : q.waiting_count > 0
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                    : 'bg-[#F1F5F9] text-[#64748B]'
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
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Active Queues</span>
          </h2>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 group relative cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF]/60 border-[#2563EB] shadow-subtle ring-1 ring-[#2563EB]'
                    : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#2563EB] rounded-r-full" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-[#F1F5F9] text-[#2563EB] border-[#E2E8F0]'
                      }`}>
                        {q.code_prefix}
                      </span>
                      <h4 className="font-bold text-sm text-[#1E293B] truncate">
                        {q.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-[#2563EB] shrink-0" />
                      <span>{q.counter_name || 'Counter 1'}</span>
                    </p>
                  </div>

                  {/* Waiting Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      q.waiting_count > 0
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {q.waiting_count} waiting
                    </span>
                    {q.current_serving_token && (
                      <span className="text-[10px] text-[#10B981] font-mono mt-1 font-bold">
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
