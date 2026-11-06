import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Layers, 
  Calendar,
  Sparkles,
  Hourglass
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#EF4444'];

export default function AnalyticsDashboard({ queues }) {
  const [data, setData] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics({
        queue_id: selectedQueue || undefined,
        period
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedQueue, period]);

  const summary = data?.summary || {
    totalTokens: 0,
    waitingCount: 0,
    servingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    avgWaitMinutes: 0,
    avgServiceMinutes: 0,
    cancellationRate: 0
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top Controls & Filters (Mobile Responsive) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Queue Analytics</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Real-time metrics on wait times, queue traffic, and throughput
          </p>
        </div>

        <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center justify-between bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['today', 'week', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg font-medium capitalize text-center transition-all ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'week' ? '7 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Queue Filter */}
          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium w-full sm:w-auto"
          >
            <option value="">All Queues</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.code_prefix})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stat Cards (2x2 on mobile, 4 in row on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Handled */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-white">{summary.totalTokens}</span>
            <span className="text-[10px] sm:text-xs text-slate-500">tokens</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{summary.completedCount} Served</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">{summary.waitingCount} Wait</span>
          </div>
        </div>

        {/* Avg Wait Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Wait</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-black text-amber-300">
              {summary.avgWaitMinutes}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-400/80 font-medium">mins</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
            Arrival to counter
          </div>
        </div>

        {/* Avg Service Duration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Service</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-black text-emerald-300">
              {summary.avgServiceMinutes}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-400/80 font-medium">mins</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
            Desk transaction time
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Dropoff</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-black text-rose-300">
              {summary.cancellationRate}%
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500">rate</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
            {summary.cancelledCount} dropped / no-show
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart 1: Hourly Queue Length & Throughput Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="mb-3 sm:mb-4">
            <h3 className="font-bold text-white text-sm sm:text-base">Queue Length Trends & Hourly Arrivals</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Tokens created vs serviced per hour</p>
          </div>

          <div className="h-56 sm:h-72 w-full">
            {data?.hourlyTrends && data.hourlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyTrends}>
                  <defs>
                    <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area type="monotone" dataKey="arrivals" name="Created" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorArrivals)" />
                  <Area type="monotone" dataKey="served" name="Serviced" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorServed)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No hourly activity records found for the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Status Breakdown Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="mb-3 sm:mb-4">
            <h3 className="font-bold text-white text-sm sm:text-base">Token Status Distribution</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Proportion of tokens by current lifecycle</p>
          </div>

          <div className="h-56 sm:h-72 w-full flex flex-col items-center justify-center">
            {summary.totalTokens > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.statusBreakdown || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(data?.statusBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', bottom: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No token data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Wait Time by Queue & Queue Details Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Wait Times by Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="mb-3 sm:mb-4">
            <h3 className="font-bold text-white text-sm sm:text-base">Average Wait Times by Queue</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Comparing customer wait times across departments</p>
          </div>

          <div className="h-52 sm:h-64 w-full">
            {data?.queueComparison && data.queueComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.queueComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="code_prefix" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} unit="m" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="avg_wait_min" name="Avg Wait (min)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_service_min" name="Avg Service (min)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No comparative queue data available.
              </div>
            )}
          </div>
        </div>

        {/* Priority Speed Stats & Department Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">Queue Department Breakdown</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mb-3 sm:mb-4">Throughput and backlog status</p>

            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[280px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Queue</th>
                    <th className="pb-2 font-semibold">Waiting</th>
                    <th className="pb-2 font-semibold">Served</th>
                    <th className="pb-2 font-semibold">Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {data?.queueComparison && data.queueComparison.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium flex items-center gap-1.5 text-white">
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300">
                          {q.code_prefix}
                        </span>
                        <span className="truncate max-w-[100px] sm:max-w-[140px]">{q.name}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
                          {q.waiting_now}
                        </span>
                      </td>
                      <td className="py-2.5 text-emerald-400 font-medium">
                        {q.completed_tokens}
                      </td>
                      <td className="py-2.5 text-amber-400 font-mono text-[11px]">
                        {q.avg_wait_min ? `${q.avg_wait_min}m` : '0m'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
            <span>System Efficiency:</span>
            <span className="font-semibold text-emerald-400">
              {summary.completedCount > 0 ? `${Math.round((summary.completedCount / summary.totalTokens) * 100)}% Fulfilled` : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
