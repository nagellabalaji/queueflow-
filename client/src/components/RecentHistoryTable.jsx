import React from 'react';
import { History, CheckCircle2, XCircle } from 'lucide-react';

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
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-[#4F807A]" />
        <h4 className="text-sm font-bold text-[#243447]">Recent Queue Activity & History</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E3DC] text-[#30343B]/60">
              <th className="pb-2.5 font-bold uppercase tracking-wider">Token</th>
              <th className="pb-2.5 font-bold uppercase tracking-wider">Customer</th>
              <th className="pb-2.5 font-bold uppercase tracking-wider">Status</th>
              <th className="pb-2.5 font-bold uppercase tracking-wider">Wait</th>
              <th className="pb-2.5 font-bold uppercase tracking-wider">Service</th>
              <th className="pb-2.5 font-bold uppercase tracking-wider">Details / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E3DC] text-[#30343B]">
            {historyTokens.map((token) => {
              const isCompleted = token.status === 'COMPLETED';
              return (
                <tr key={token.id} className="hover:bg-[#F7F6F2] transition-colors">
                  <td className="py-2.5 font-mono font-black text-[#243447]">
                    {token.token_code}
                  </td>
                  <td className="py-2.5 font-bold text-[#243447]">
                    {token.customer_name}
                  </td>
                  <td className="py-2.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#64866A]/10 text-[#64866A] border border-[#64866A]/20 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        COMPLETED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" />
                        CANCELLED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-[#30343B]/70">
                    {formatSeconds(token.wait_duration_seconds)}
                  </td>
                  <td className="py-2.5 font-mono text-[#30343B]/70">
                    {formatSeconds(token.service_duration_seconds)}
                  </td>
                  <td className="py-2.5 text-[#30343B]/70 max-w-xs truncate">
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
