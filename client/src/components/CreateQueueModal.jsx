import React, { useState } from 'react';
import { api } from '../services/api';
import { PlusCircle, X, AlertCircle } from 'lucide-react';

export default function CreateQueueModal({ isOpen, onClose, onQueueCreated }) {
  const [name, setName] = useState('');
  const [codePrefix, setCodePrefix] = useState('');
  const [counterName, setCounterName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.createQueue({
        name: name.trim(),
        code_prefix: codePrefix.trim().toUpperCase() || undefined,
        counter_name: counterName.trim() || 'Counter 1',
        description: description.trim() || undefined
      });

      onQueueCreated(res.queue);
      setName('');
      setCodePrefix('');
      setCounterName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#243447]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#E5E3DC] rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#30343B]/40 hover:text-[#243447] p-1 rounded-lg hover:bg-[#F7F6F2] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#4F807A]/15 text-[#4F807A] flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#243447]">Create New Service Queue</h3>
            <p className="text-xs text-[#30343B]/60">Configure a department queue and dedicated counter</p>
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
              Queue Name <span className="text-[#C98262]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Customer Support & Billing"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!codePrefix && e.target.value.length >= 3) {
                  setCodePrefix(e.target.value.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''));
                }
              }}
              className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
                Token Code Prefix
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="e.g. SUP, BIL, VIP"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#243447] placeholder-[#30343B]/40 uppercase font-mono tracking-wider focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
              />
              <p className="text-[11px] text-[#30343B]/50 mt-1">Generates tokens like {codePrefix || 'Q'}-001</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">
                Counter / Desk Name
              </label>
              <input
                type="text"
                placeholder="e.g. Counter 1, Desk A"
                value={counterName}
                onChange={(e) => setCounterName(e.target.value)}
                className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#243447] uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="What types of services are handled at this desk?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-3.5 py-2 text-sm text-[#243447] placeholder-[#30343B]/40 focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all resize-none"
            />
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
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Queue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
