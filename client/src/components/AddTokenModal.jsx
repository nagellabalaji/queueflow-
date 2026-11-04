import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlus, X, AlertCircle, Ticket, Star, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Generate Queue Token</h3>
            <p className="text-xs text-slate-400">
              Adding to <span className="text-indigo-400 font-semibold">{queue.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Customer / Person Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Johnathan Smith"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number or Contact (Optional)
            </label>
            <input
              type="text"
              placeholder="+1-555-0192"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'NORMAL', label: 'Normal', color: 'border-slate-700 text-slate-300 hover:border-slate-500' },
                { id: 'PRIORITY', label: 'Priority', color: 'border-purple-600/50 text-purple-300 hover:border-purple-500' },
                { id: 'VIP', label: 'VIP Desk', color: 'border-amber-500/50 text-amber-300 hover:border-amber-400' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPriority(item.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    priority === item.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : `bg-slate-950/60 ${item.color}`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>Next Token Preview:</span>
            <span className="font-mono font-bold text-indigo-400 text-sm">
              {queue.code_prefix}-XXX
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center gap-2"
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
