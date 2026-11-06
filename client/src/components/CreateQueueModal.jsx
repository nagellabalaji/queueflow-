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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#64748B] hover:text-[#1E293B] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center shadow-xs">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#1E293B]">Create New Service Queue</h3>
            <p className="text-xs text-[#64748B]">Configure a department queue and dedicated counter</p>
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
              Queue Name <span className="text-rose-500">*</span>
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                Token Code Prefix
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="e.g. SUP, BIL, VIP"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1E293B] placeholder-[#94A3B8] uppercase font-mono tracking-wider focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
              <p className="text-[11px] text-[#64748B] mt-1">Generates tokens like {codePrefix || 'Q'}-001</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                Counter / Desk Name
              </label>
              <input
                type="text"
                placeholder="e.g. Counter 1, Desk A"
                value={counterName}
                onChange={(e) => setCounterName(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="What types of services are handled at this desk?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all resize-none"
            />
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
