import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Ticket, 
  Search, 
  Clock, 
  Users, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  RefreshCw, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Phone,
  User
} from 'lucide-react';

export default function CustomerKiosk({ queues = [] }) {
  const [activeMode, setActiveMode] = useState('generate'); // 'generate' | 'track'
  
  // Generation Form State
  const [selectedQueueId, setSelectedQueueId] = useState(queues[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Tracker State
  const [trackCode, setTrackCode] = useState('');
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Update selected queue when queues arrive
  useEffect(() => {
    if (!selectedQueueId && queues.length > 0) {
      setSelectedQueueId(queues[0].id);
    }
  }, [queues, selectedQueueId]);

  // Handle Public Token Generation
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setGenError('Please enter your full name');
      return;
    }
    if (!selectedQueueId) {
      setGenError('Please select a service queue');
      return;
    }

    setGenError('');
    setGenerating(true);
    try {
      const res = await api.publicGenerateToken({
        queue_id: Number(selectedQueueId),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        priority
      });
      setGeneratedTicket({
        ...res.token,
        position: res.position || res.token?.position || 1,
        estimated_wait_minutes: res.estimatedWaitMinutes || ((res.position || 1) * 3),
        counter_name: res.queue?.counter_name || selectedQueue?.counter_name || 'Counter 1'
      });
      // Automatically prepopulate tracking code
      setTrackCode(res.token.token_code);
    } catch (err) {
      setGenError(err.message || 'Unable to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Token Lookup / Tracking
  const handleTrack = async (codeToLookup) => {
    const code = (codeToLookup || trackCode).trim().toUpperCase();
    if (!code) {
      setTrackError('Please enter a valid token number (e.g. SUP-001)');
      return;
    }

    setTrackError('');
    setTracking(true);
    try {
      const res = await api.publicTrackToken(code);
      setTrackedTicket({
        ...res,
        status: res.token?.status,
        position: res.token?.position || (res.peopleAhead != null && res.token?.status === 'WAITING' ? res.peopleAhead + 1 : null),
        counter_name: res.token?.counter_assigned || res.queue?.counter_name || res.token?.counter_name || 'Counter 1'
      });
    } catch (err) {
      setTrackedTicket(null);
      setTrackError(err.message || 'Token not found or expired.');
    } finally {
      setTracking(false);
    }
  };

  // Auto-refresh tracked ticket every 10 seconds
  useEffect(() => {
    if (activeMode === 'track' && trackedTicket?.token?.token_code) {
      const interval = setInterval(() => {
        handleTrack(trackedTicket.token.token_code);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeMode, trackedTicket]);

  const selectedQueue = queues.find(q => q.id === Number(selectedQueueId)) || queues[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold text-xs mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Customer Self-Service Kiosk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight">
            QueueFlow Direct Service
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Get your instant digital token, monitor real-time queue position, and arrive right on time.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] self-stretch sm:self-auto">
          <button
            onClick={() => setActiveMode('generate')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'generate'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Get Ticket</span>
          </button>
          <button
            onClick={() => setActiveMode('track')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'track'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Status</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Generate Token */}
      {activeMode === 'generate' && (
        <>
          {!generatedTicket ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Form (7 cols) */}
              <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-[#1E293B] mb-1 flex items-center gap-2">
                  <span>Take a Digital Ticket</span>
                </h2>
                <p className="text-xs text-[#64748B] mb-5">
                  Select your department and provide your name to join the queue.
                </p>

                {genError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{genError}</span>
                  </div>
                )}

                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Queue Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                      Select Department / Queue <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedQueueId}
                      onChange={(e) => setSelectedQueueId(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                    >
                      {queues.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.name} ({q.counter_name || 'Counter 1'}) — {q.waiting_count || 0} in line
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                      />
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                      Mobile Number (For SMS Alert, Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                      <input
                        type="tel"
                        placeholder="+1-555-0149"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                      />
                    </div>
                  </div>

                  {/* Service Priority */}
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                      Assistance Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'NORMAL', label: 'Standard' },
                        { id: 'PRIORITY', label: 'Senior / Special' },
                        { id: 'VIP', label: 'Express Desk' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setPriority(item.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            priority === item.id
                              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generating || !customerName.trim()}
                    className="w-full mt-2 py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {generating ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Issue My Digital Token</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Desk Summary Card (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-gradient-to-br from-[#EFF6FF] via-white to-[#EFF6FF] border border-[#BFDBFE] text-[#1E293B] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#2563EB] bg-white border border-[#BFDBFE] px-2.5 py-0.5 rounded-md">
                      Selected Queue
                    </span>
                    <h3 className="text-xl font-black mt-2 text-[#1E293B]">{selectedQueue?.name || 'General Service'}</h3>
                    <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{selectedQueue?.counter_name || 'Counter 1'}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-[#BFDBFE]/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#64748B]">Currently In Line</span>
                        <div className="text-2xl font-black text-[#2563EB] mt-0.5">
                          {selectedQueue?.waiting_count || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#64748B]">Estimated Wait</span>
                        <div className="text-2xl font-black text-amber-600 mt-0.5">
                          ~{(selectedQueue?.waiting_count || 0) * 3 || 3} <span className="text-xs font-normal text-[#64748B]">mins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 text-xs text-[#64748B] space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Your token is guaranteed and strictly preserved in fair first-come, first-served order.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <span>Real-time voice announcements call each ticket aloud at the counter screen.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Digital Ticket Generated View */
            <div className="bg-white border-2 border-[#2563EB]/40 rounded-3xl p-6 sm:p-10 shadow-lg text-center max-w-lg mx-auto relative overflow-hidden animate-slide-up">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] font-bold text-xs uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ticket Issued Successfully</span>
              </div>

              <div className="my-4">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Your Token Number</span>
                <div className="font-mono text-5xl sm:text-6xl font-black text-[#2563EB] tracking-tight my-2">
                  {generatedTicket.token_code}
                </div>
                <div className="text-lg font-bold text-[#1E293B]">
                  {generatedTicket.customer_name}
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto my-6 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Position in Line</span>
                  <div className="font-mono text-xl font-black text-[#2563EB]">
                    #{generatedTicket.position || 1}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Estimated Wait</span>
                  <div className="text-xl font-black text-amber-600">
                    ~{generatedTicket.estimated_wait_minutes || 3} mins
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#64748B] space-y-1 mb-6">
                <p>
                  Service Desk: <strong className="text-[#1E293B]">{generatedTicket.counter_name || selectedQueue?.counter_name || 'Counter 1'}</strong>
                </p>
                <p>Please keep this screen open or remember your token code.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-[#1E293B] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#2563EB]" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMode('track');
                    handleTrack(generatedTicket.token_code);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Live Position</span>
                </button>
                <button
                  onClick={() => {
                    setGeneratedTicket(null);
                    setCustomerName('');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 text-[#64748B] hover:text-[#1E293B] text-xs font-semibold cursor-pointer"
                >
                  Issue Another
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mode 2: Track Token */}
      {activeMode === 'track' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B] mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#2563EB]" />
              <span>Track Your Queue Position</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Enter your token number below to see your current place in line and serving status.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. SUP-001 or BIL-003"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                className="w-full uppercase font-mono font-bold bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={tracking || !trackCode.trim()}
              className="py-2.5 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {tracking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Track</span>
              )}
            </button>
          </form>

          {trackError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedTicket && (
            <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-[#F8FAFC] space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="font-mono text-2xl font-black text-[#2563EB]">
                    {trackedTicket.token.token_code}
                  </span>
                  <div className="text-xs font-semibold text-[#1E293B]">
                    {trackedTicket.token.customer_name}
                  </div>
                </div>

                <div>
                  {trackedTicket.status === 'SERVING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981] text-white font-bold text-xs uppercase animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Now Serving!
                    </span>
                  ) : trackedTicket.status === 'WAITING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB] text-white font-bold text-xs uppercase">
                      Waiting
                    </span>
                  ) : trackedTicket.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0] font-bold text-xs uppercase">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-xs uppercase">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {trackedTicket.status === 'SERVING' && (
                <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#10B981] text-center">
                  🔔 Please proceed immediately to {trackedTicket.token.counter_assigned || trackedTicket.queue?.counter_name || 'Counter 1'}!
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Position</span>
                  <div className="font-mono text-lg font-black text-[#2563EB]">
                    {trackedTicket.position ? `#${trackedTicket.position}` : '---'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Est. Wait</span>
                  <div className="text-lg font-black text-amber-600">
                    {trackedTicket.estimatedWaitMinutes ? `~${trackedTicket.estimatedWaitMinutes}m` : '0m'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Counter</span>
                  <div className="text-sm font-bold text-[#2563EB] truncate">
                    {trackedTicket.queue?.counter_name || 'Counter 1'}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] text-center flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 text-[#2563EB]" />
                <span>Auto-refreshing every 10 seconds</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
