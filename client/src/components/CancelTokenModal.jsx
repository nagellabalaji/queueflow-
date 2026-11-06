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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#243447]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#E5E3DC] rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#30343B]/40 hover:text-[#243447] p-1 rounded-lg hover:bg-[#F7F6F2] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#243447]">Cancel Token</h3>
            <p className="text-xs text-[#30343B]/60">
              Remove token <span className="font-mono font-black text-rose-600">{token.token_code}</span> ({token.customer_name})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
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
                      ? 'bg-rose-50/70 border-rose-300 text-rose-800 font-semibold'
                      : 'bg-[#F7F6F2] border-[#E5E3DC] text-[#30343B]/70 hover:border-[#4F807A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-rose-600"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
                Specify Reason
              </label>
              <input
                type="text"
                required
                placeholder="Enter custom cancellation reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2 text-sm text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
              />
            </div>
          )}

          <div className="p-3 bg-[#C98262]/10 border border-[#C98262]/30 rounded-xl text-xs text-[#C98262] font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#C98262] mt-0.5" />
            <span>Cancelling this token will immediately reorder remaining positions in the queue.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E3DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#30343B]/60 hover:text-[#243447] rounded-xl hover:bg-[#F7F6F2] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
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
