import React from 'react';
import { History, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function RecentHistoryTable({ historyTokens }) {
  if (!historyTokens || historyTokens.length === 0) {
    return null;
  }

  const formatSeconds = (secs) => {
    if (!secs) return '-';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-indigo-400" />
        <h4 className="text-sm font-bold text-white">Recent Queue Activity & History</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-2.5 font-semibold">Token</th>
              <th className="pb-2.5 font-semibold">Customer</th>
              <th className="pb-2.5 font-semibold">Status</th>
              <th className="pb-2.5 font-semibold">Wait Time</th>
              <th className="pb-2.5 font-semibold">Service Time</th>
              <th className="pb-2.5 font-semibold">Details / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {historyTokens.map((token) => {
              const isCompleted = token.status === 'COMPLETED';
              return (
                <tr key={token.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-mono font-bold text-slate-200">
                    {token.token_code}
                  </td>
                  <td className="py-2.5 font-medium text-white">
                    {token.customer_name}
                  </td>
                  <td className="py-2.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        COMPLETED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" />
                        CANCELLED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-slate-400">
                    {formatSeconds(token.wait_duration_seconds)}
                  </td>
                  <td className="py-2.5 font-mono text-slate-400">
                    {formatSeconds(token.service_duration_seconds)}
                  </td>
                  <td className="py-2.5 text-slate-400 max-w-xs truncate">
                    {token.cancellation_reason || (token.counter_assigned ? `Served at ${token.counter_assigned}` : 'Completed successfully')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
