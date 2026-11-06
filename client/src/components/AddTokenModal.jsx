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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#243447]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#E5E3DC] rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#30343B]/40 hover:text-[#243447] p-1 rounded-lg hover:bg-[#F7F6F2] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#4F807A]/15 text-[#4F807A] flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#243447]">Generate Queue Token</h3>
            <p className="text-xs text-[#30343B]/60">
              Adding person to <span className="text-[#4F807A] font-bold">{queue.name}</span>
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
            <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
              Customer / Person Name <span className="text-[#C98262]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Johnathan Smith"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
              Phone Number or Contact (Optional)
            </label>
            <input
              type="text"
              placeholder="+1-555-0192"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2.5 text-sm text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
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
                      ? 'bg-[#243447] text-white border-[#243447] shadow-xs'
                      : 'bg-[#F7F6F2] text-[#30343B]/70 border-[#E5E3DC] hover:border-[#4F807A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl text-xs text-[#30343B]/70 flex items-center justify-between">
            <span>Next Token Preview:</span>
            <span className="font-mono font-black text-[#243447] text-sm">
              {queue.code_prefix}-XXX
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E3DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#30343B]/60 hover:text-[#243447] rounded-xl hover:bg-[#F7F6F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#243447] hover:bg-[#1b2735] text-white font-bold text-sm rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
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
