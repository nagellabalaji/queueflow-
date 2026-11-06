import React from 'react';
import { PlusCircle, Layers, Users, Clock, Building2, Plus } from 'lucide-react';

export default function QueueSidebar({ queues, activeQueueId, onSelectQueue, onOpenCreateModal }) {
  return (
    <div className="space-y-3">
      {/* Mobile Horizontal Carousel (< lg) */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Queue</span>
          </span>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Queue</span>
          </button>
        </div>

        {/* Scrollable pills bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {queues.map((q) => {
            const isActive = q.id === activeQueueId;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQueue(q.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border shrink-0 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isActive ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-800 text-indigo-300'
                }`}>
                  {q.code_prefix}
                </span>
                <span className="truncate max-w-[120px]">{q.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : q.waiting_count > 0
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-slate-800 text-slate-500'
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
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Queues</span>
          </h2>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Queue</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {queues.map((q) => {
            const isActive = q.id === activeQueueId;
            return (
              <button
                key={q.id}
                onClick={() => onSelectQueue(q.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {q.code_prefix}
                      </span>
                      <h4 className="font-bold text-sm text-slate-200 group-hover:text-white truncate">
                        {q.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{q.counter_name || 'Counter 1'}</span>
                    </p>
                  </div>

                  {/* Waiting Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      q.waiting_count > 0
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {q.waiting_count} waiting
                    </span>
                    {q.current_serving_token && (
                      <span className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold">
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
