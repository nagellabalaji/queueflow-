import React, { useState } from 'react';
import { api } from '../services/api';
import { Ban, X, AlertTriangle } from 'lucide-react';

export default function CancelTokenModal({ isOpen, onClose, token, onTokenCancelled }) {
  const [reason, setReason] = useState('Customer left queue / No-show');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !token) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalReason = reason === 'Other' ? (customReason.trim() || 'Cancelled by manager') : reason;

    try {
      await api.cancelToken(token.id, finalReason);
      onTokenCancelled(token.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel token');
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cancel Token</h3>
            <p className="text-xs text-slate-400">
              Remove token <span className="font-mono font-bold text-rose-400">{token.token_code}</span> ({token.customer_name})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Cancellation
            </label>
            <div className="space-y-2">
              {[
                'Customer left queue / No-show',
                'Called multiple times with no response',
                'Duplicate or erroneous token',
                'Customer request resolved without counter service',
                'Other'
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    reason === r
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Specify Reason
              </label>
              <input
                type="text"
                required
                placeholder="Enter custom cancellation reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>Cancelling this token will immediately recompact remaining positions in the queue.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-rose-600/30 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Confirm Cancellation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
