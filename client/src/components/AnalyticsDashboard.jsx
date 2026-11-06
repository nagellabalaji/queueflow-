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
  Layers, 
  Hourglass,
  Download,
  Calendar
} from 'lucide-react';

const PALETTE = ['#243447', '#4F807A', '#64866A', '#C98262', '#C0392B'];

export default function AnalyticsDashboard({ queues }) {
  const [data, setData] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await api.downloadExportCSV();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

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
    <div className="space-y-5 animate-fade-in">
      {/* Top Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-white border border-[#E5E3DC] rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#243447] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4F807A]" />
            <span>Operations Analytics & Reports</span>
          </h2>
          <p className="text-xs text-[#30343B]/60 mt-0.5">
            Real-time insights on customer wait times, desk throughput, and queue efficiency
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-[#F7F6F2] p-1 rounded-xl border border-[#E5E3DC] text-xs">
            {['today', 'week', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize text-center transition-all ${
                  period === p
                    ? 'bg-[#243447] text-white shadow-xs'
                    : 'text-[#30343B]/70 hover:text-[#243447]'
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
            className="bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#243447] focus:outline-none focus:border-[#4F807A]"
          >
            <option value="">All Queues</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.code_prefix})
              </option>
            ))}
          </select>

          {/* Export CSV Report Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-3.5 py-1.5 bg-[#4F807A] hover:bg-[#3d6560] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Download complete token history in CSV format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (4 in row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Handled */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#30343B]/60 uppercase tracking-wider">Total Volume</span>
            <div className="w-8 h-8 rounded-xl bg-[#243447]/10 text-[#243447] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#243447]">{summary.totalTokens}</span>
            <span className="text-xs text-[#30343B]/50 font-medium">tokens</span>
          </div>
          <div className="mt-1 text-[11px] text-[#30343B]/70 flex items-center gap-1.5">
            <span className="text-[#64866A] font-bold">{summary.completedCount} Served</span>
            <span>•</span>
            <span className="text-[#4F807A] font-bold">{summary.waitingCount} Waiting</span>
          </div>
        </div>

        {/* Avg Wait Time */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#30343B]/60 uppercase tracking-wider">Avg Wait Time</span>
            <div className="w-8 h-8 rounded-xl bg-[#C98262]/15 text-[#C98262] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#C98262]">
              {summary.avgWaitMinutes}
            </span>
            <span className="text-xs text-[#C98262] font-semibold">mins</span>
          </div>
          <div className="mt-1 text-[11px] text-[#30343B]/60">
            From arrival to counter service
          </div>
        </div>

        {/* Avg Service Duration */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#30343B]/60 uppercase tracking-wider">Desk Duration</span>
            <div className="w-8 h-8 rounded-xl bg-[#64866A]/15 text-[#64866A] flex items-center justify-center">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#64866A]">
              {summary.avgServiceMinutes}
            </span>
            <span className="text-xs text-[#64866A] font-semibold">mins</span>
          </div>
          <div className="mt-1 text-[11px] text-[#30343B]/60">
            Active service transaction time
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#30343B]/60 uppercase tracking-wider">Dropoff Rate</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {summary.cancellationRate}%
            </span>
            <span className="text-xs text-[#30343B]/50 font-medium">rate</span>
          </div>
          <div className="mt-1 text-[11px] text-[#30343B]/60">
            {summary.cancelledCount} dropped / no-show
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Hourly Queue Length & Throughput Trend */}
        <div className="lg:col-span-2 bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-[#243447] text-base">Hourly Arrivals & Service Throughput</h3>
            <p className="text-xs text-[#30343B]/60">Comparison of customer arrivals vs completed consultations</p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {data?.hourlyTrends && data.hourlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyTrends}>
                  <defs>
                    <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#243447" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#243447" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64866A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#64866A" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis dataKey="hour" stroke="#8E9299" fontSize={11} />
                  <YAxis stroke="#8E9299" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DC', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: '#243447', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="arrivals" name="Arrivals" stroke="#243447" strokeWidth={2} fillOpacity={1} fill="url(#colorArrivals)" />
                  <Area type="monotone" dataKey="served" name="Serviced" stroke="#64866A" strokeWidth={2} fillOpacity={1} fill="url(#colorServed)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#30343B]/50">
                No hourly activity records found.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Status Breakdown Donut Chart */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-[#243447] text-base">Token Status Lifecycle</h3>
            <p className="text-xs text-[#30343B]/60">Ratio of waiting, serving, completed & cancelled</p>
          </div>

          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center">
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
                    {(data?.statusBreakdown || []).map((entry, index) => {
                      const color = entry.name === 'Completed' ? '#64866A' : entry.name === 'Waiting' ? '#243447' : entry.name === 'Serving' ? '#4F807A' : '#C0392B';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DC', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#30343B]/50">No token records yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Wait Time by Queue & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Wait Times by Queue */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-[#243447] text-base">Average Wait Times by Department</h3>
            <p className="text-xs text-[#30343B]/60">Benchmark queue delays across counters (minutes)</p>
          </div>

          <div className="h-60 w-full">
            {data?.queueComparison && data.queueComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.queueComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis dataKey="code_prefix" stroke="#8E9299" fontSize={11} />
                  <YAxis stroke="#8E9299" fontSize={11} unit="m" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DC', borderRadius: '12px', fontSize: '11px' }}
                    labelStyle={{ color: '#243447', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="avg_wait_min" name="Avg Wait (min)" fill="#C98262" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_service_min" name="Avg Service (min)" fill="#4F807A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#30343B]/50">
                No comparative department data available.
              </div>
            )}
          </div>
        </div>

        {/* Department Summary Table */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#243447] text-base mb-1">Queue Department Overview</h3>
            <p className="text-xs text-[#30343B]/60 mb-4">Live queue breakdown and performance</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E3DC] text-[#30343B]/60">
                    <th className="pb-2 font-bold uppercase tracking-wider">Queue</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">Waiting</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">Completed</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">Avg Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DC] text-[#30343B]">
                  {data?.queueComparison && data.queueComparison.map((q) => (
                    <tr key={q.id} className="hover:bg-[#F7F6F2]">
                      <td className="py-2.5 font-bold flex items-center gap-1.5 text-[#243447]">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F7F6F2] text-[#243447] border border-[#E5E3DC]">
                          {q.code_prefix}
                        </span>
                        <span className="truncate max-w-[140px]">{q.name}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#4F807A]/15 text-[#4F807A] font-bold text-[10px]">
                          {q.waiting_now}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#64866A] font-bold">
                        {q.completed_tokens}
                      </td>
                      <td className="py-2.5 text-[#C98262] font-mono font-bold">
                        {q.avg_wait_min ? `${q.avg_wait_min}m` : '0m'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E3DC] flex items-center justify-between text-xs text-[#30343B]/70">
            <span>Overall Fulfillment:</span>
            <span className="font-bold text-[#64866A]">
              {summary.completedCount > 0 ? `${Math.round((summary.completedCount / summary.totalTokens) * 100)}% Fulfilled` : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
