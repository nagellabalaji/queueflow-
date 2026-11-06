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
      <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F807A]/10 text-[#4F807A] font-semibold text-xs mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Customer Self-Service Kiosk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#243447] tracking-tight">
            QueueFlow Direct Service
          </h1>
          <p className="text-sm text-[#30343B]/70 mt-1">
            Get your instant digital token, monitor real-time queue position, and arrive right on time.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F7F6F2] p-1 rounded-xl border border-[#E5E3DC] self-stretch sm:self-auto">
          <button
            onClick={() => setActiveMode('generate')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'generate'
                ? 'bg-[#243447] text-white shadow-sm'
                : 'text-[#30343B]/70 hover:text-[#243447]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Get Ticket</span>
          </button>
          <button
            onClick={() => setActiveMode('track')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'track'
                ? 'bg-[#243447] text-white shadow-sm'
                : 'text-[#30343B]/70 hover:text-[#243447]'
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
              <div className="md:col-span-7 bg-white border border-[#E5E3DC] rounded-2xl p-6 sm:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-[#243447] mb-1 flex items-center gap-2">
                  <span>Take a Digital Ticket</span>
                </h2>
                <p className="text-xs text-[#30343B]/70 mb-5">
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
                    <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
                      Select Department / Queue <span className="text-[#C98262]">*</span>
                    </label>
                    <select
                      value={selectedQueueId}
                      onChange={(e) => setSelectedQueueId(e.target.value)}
                      className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#243447] focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
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
                    <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-[#C98262]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-[#30343B]/40" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#30343B] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
                      />
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
                      Mobile Number (For SMS Alert, Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#30343B]/40" />
                      <input
                        type="tel"
                        placeholder="+1-555-0149"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#30343B] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
                      />
                    </div>
                  </div>

                  {/* Service Priority */}
                  <div>
                    <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
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
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                            priority === item.id
                              ? 'bg-[#243447] text-white border-[#243447]'
                              : 'bg-[#F7F6F2] text-[#30343B]/70 border-[#E5E3DC] hover:border-[#4F807A]'
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
                    className="w-full mt-2 py-3 px-4 bg-[#243447] hover:bg-[#1b2735] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                <div className="bg-[#243447] text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#4F807A] bg-white/10 px-2 py-0.5 rounded-md">
                      Selected Queue
                    </span>
                    <h3 className="text-xl font-bold mt-2">{selectedQueue?.name || 'General Service'}</h3>
                    <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#4F807A]" />
                      <span>{selectedQueue?.counter_name || 'Counter 1'}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/50">Currently In Line</span>
                        <div className="text-2xl font-black text-white mt-0.5">
                          {selectedQueue?.waiting_count || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/50">Estimated Wait</span>
                        <div className="text-2xl font-black text-[#C98262] mt-0.5">
                          ~{(selectedQueue?.waiting_count || 0) * 3 || 3} <span className="text-xs font-normal text-white/60">mins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 text-xs text-[#30343B]/70 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#64866A] shrink-0 mt-0.5" />
                    <span>Your token is guaranteed and strictly preserved in fair first-come, first-served order.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#4F807A] shrink-0 mt-0.5" />
                    <span>Real-time voice announcements call each ticket aloud at the counter screen.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Digital Ticket Generated View */
            <div className="bg-white border-2 border-[#4F807A]/40 rounded-3xl p-6 sm:p-10 shadow-lg text-center max-w-lg mx-auto relative overflow-hidden animate-slide-up">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#64866A]/10 text-[#64866A] font-bold text-xs uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ticket Issued Successfully</span>
              </div>

              <div className="my-4">
                <span className="text-xs font-bold text-[#30343B]/60 uppercase tracking-widest">Your Token Number</span>
                <div className="font-mono text-5xl sm:text-6xl font-black text-[#243447] tracking-tight my-2">
                  {generatedTicket.token_code}
                </div>
                <div className="text-lg font-bold text-[#243447]">
                  {generatedTicket.customer_name}
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto my-6 p-3.5 bg-[#F7F6F2] border border-[#E5E3DC] rounded-2xl text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#30343B]/50">Position in Line</span>
                  <div className="font-mono text-xl font-black text-[#243447]">
                    #{generatedTicket.position || 1}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#30343B]/50">Estimated Wait</span>
                  <div className="text-xl font-black text-[#C98262]">
                    ~{generatedTicket.estimated_wait_minutes || 3} mins
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#30343B]/70 space-y-1 mb-6">
                <p>
                  Service Desk: <strong className="text-[#243447]">{generatedTicket.counter_name || selectedQueue?.counter_name || 'Counter 1'}</strong>
                </p>
                <p>Please keep this screen open or remember your token code.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#E5E3DC] hover:border-[#243447] text-[#243447] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMode('track');
                    handleTrack(generatedTicket.token_code);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#4F807A] hover:bg-[#3d6560] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Live Position</span>
                </button>
                <button
                  onClick={() => {
                    setGeneratedTicket(null);
                    setCustomerName('');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 text-[#30343B]/60 hover:text-[#243447] text-xs font-semibold"
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
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#243447] mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#4F807A]" />
              <span>Track Your Queue Position</span>
            </h2>
            <p className="text-xs text-[#30343B]/70">
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
                className="w-full uppercase font-mono font-bold bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-4 py-2.5 text-sm text-[#243447] focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={tracking || !trackCode.trim()}
              className="py-2.5 px-5 bg-[#243447] hover:bg-[#1b2735] text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
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
            <div className="border border-[#E5E3DC] rounded-2xl p-5 bg-[#F7F6F2] space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-3">
                <div>
                  <span className="font-mono text-2xl font-black text-[#243447]">
                    {trackedTicket.token.token_code}
                  </span>
                  <div className="text-xs font-semibold text-[#30343B]">
                    {trackedTicket.token.customer_name}
                  </div>
                </div>

                <div>
                  {trackedTicket.status === 'SERVING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#64866A] text-white font-bold text-xs uppercase animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Now Serving!
                    </span>
                  ) : trackedTicket.status === 'WAITING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#243447] text-white font-bold text-xs uppercase">
                      Waiting
                    </span>
                  ) : trackedTicket.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F807A]/20 text-[#4F807A] font-bold text-xs uppercase">
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
                <div className="p-3 bg-[#64866A]/10 border border-[#64866A]/30 rounded-xl text-xs font-bold text-[#64866A] text-center">
                  🔔 Please proceed immediately to {trackedTicket.token.counter_assigned || trackedTicket.queue?.counter_name || 'Counter 1'}!
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-[#E5E3DC]">
                  <span className="text-[10px] uppercase font-bold text-[#30343B]/50">Position</span>
                  <div className="font-mono text-lg font-black text-[#243447]">
                    {trackedTicket.position ? `#${trackedTicket.position}` : '---'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E5E3DC]">
                  <span className="text-[10px] uppercase font-bold text-[#30343B]/50">Est. Wait</span>
                  <div className="text-lg font-black text-[#C98262]">
                    {trackedTicket.estimatedWaitMinutes ? `~${trackedTicket.estimatedWaitMinutes}m` : '0m'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E5E3DC] col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-[#30343B]/50">Counter</span>
                  <div className="text-sm font-bold text-[#4F807A] truncate">
                    {trackedTicket.queue?.counter_name || 'Counter 1'}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#30343B]/60 text-center flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 text-[#4F807A]" />
                <span>Auto-refreshing every 10 seconds</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
