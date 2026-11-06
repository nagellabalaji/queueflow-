import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlus, X, AlertCircle, Ticket } from 'lucide-react';

export default function AddTokenModal({ isOpen, onClose, queue, onTokenAdded }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !queue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.addToken({
        queue_id: queue.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        priority
      });

      onTokenAdded(res.token);
      setCustomerName('');
      setCustomerPhone('');
      setPriority('NORMAL');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#64748B] hover:text-[#1E293B] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center shadow-xs">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#1E293B]">Generate Queue Token</h3>
            <p className="text-xs text-[#64748B]">
              Adding person to <span className="text-[#2563EB] font-bold">{queue.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
              Customer / Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Johnathan Smith"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
              Phone Number or Contact (Optional)
            </label>
            <input
              type="text"
              placeholder="+1-555-0192"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
              Service Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'NORMAL', label: 'Normal' },
                { id: 'PRIORITY', label: 'Priority' },
                { id: 'VIP', label: 'VIP Desk' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPriority(item.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    priority === item.id
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-xl text-xs text-[#64748B] flex items-center justify-between">
            <span>Next Token Preview:</span>
            <span className="font-mono font-black text-[#2563EB] text-sm">
              {queue.code_prefix}-XXX
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#64748B] hover:text-[#1E293B] rounded-xl hover:bg-[#F1F5F9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Generate Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
