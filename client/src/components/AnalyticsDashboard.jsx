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
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Queue Performance & Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics on wait times, queue traffic, and operational throughput
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Period selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['today', 'week', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'Past 7 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Queue Filter */}
          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">All Queues Combined</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.code_prefix})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Handled */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Volume</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{summary.totalTokens}</span>
            <span className="text-xs text-slate-500">tokens</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{summary.completedCount} Served</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">{summary.waitingCount} Waiting</span>
          </div>
        </div>

        {/* Avg Wait Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Wait Time</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {summary.avgWaitMinutes}
            </span>
            <span className="text-xs text-amber-400/80 font-medium">mins</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            From arrival to counter assignment
          </div>
        </div>

        {/* Avg Service Duration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Service Time</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">
              {summary.avgServiceMinutes}
            </span>
            <span className="text-xs text-emerald-400/80 font-medium">mins</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Average transaction duration
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dropoff Rate</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-300">
              {summary.cancellationRate}%
            </span>
            <span className="text-xs text-slate-500">cancelled</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {summary.cancelledCount} tokens dropped / no-show
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Hourly Queue Length & Throughput Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Queue Length Trends & Hourly Arrivals</h3>
              <p className="text-xs text-slate-400">Token arrival volume and serviced counts across time</p>
            </div>
          </div>

          <div className="h-72 w-full">
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
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="arrivals" name="Tokens Created" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorArrivals)" />
                  <Area type="monotone" dataKey="served" name="Tokens Serviced" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorServed)" />
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Token Status Distribution</h3>
            <p className="text-xs text-slate-400">Proportion of tokens by current lifecycle</p>
          </div>

          <div className="h-72 w-full flex flex-col items-center justify-center">
            {summary.totalTokens > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.statusBreakdown || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(data?.statusBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No token data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Wait Time by Queue & Queue Details Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wait Times by Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Average Wait Times by Queue (Minutes)</h3>
            <p className="text-xs text-slate-400">Comparing customer wait times across departments</p>
          </div>

          <div className="h-64 w-full">
            {data?.queueComparison && data.queueComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.queueComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="code_prefix" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} unit="m" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="avg_wait_min" name="Avg Wait (Minutes)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avg_service_min" name="Avg Service (Minutes)" fill="#10B981" radius={[6, 6, 0, 0]} />
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Queue Department Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Detailed breakdown of throughput and backlog</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Queue Name</th>
                    <th className="pb-2 font-semibold">Waiting</th>
                    <th className="pb-2 font-semibold">Served</th>
                    <th className="pb-2 font-semibold">Avg Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {data?.queueComparison && data.queueComparison.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium flex items-center gap-1.5 text-white">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {q.code_prefix}
                        </span>
                        <span className="truncate max-w-[140px]">{q.name}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[11px]">
                          {q.waiting_now}
                        </span>
                      </td>
                      <td className="py-2.5 text-emerald-400 font-medium">
                        {q.completed_tokens}
                      </td>
                      <td className="py-2.5 text-amber-400 font-mono">
                        {q.avg_wait_min ? `${q.avg_wait_min}m` : '0m'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Overall Queue System Efficiency:</span>
            <span className="font-semibold text-emerald-400">
              {summary.completedCount > 0 ? `${Math.round((summary.completedCount / summary.totalTokens) * 100)}% Fulfilled` : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
