import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { subscribeToQueue } from './services/socket';
import { voice } from './services/voice';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import QueueSidebar from './components/QueueSidebar';
import ActiveServingCard from './components/ActiveServingCard';
import WaitingQueueList from './components/WaitingQueueList';
import RecentHistoryTable from './components/RecentHistoryTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PublicDisplayModal from './components/PublicDisplayModal';
import CreateQueueModal from './components/CreateQueueModal';
import AddTokenModal from './components/AddTokenModal';
import CancelTokenModal from './components/CancelTokenModal';
import { AlertCircle, CheckCircle, Info, Sparkles, Building2, Tv, Plus } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('queues'); // 'queues' | 'analytics' | 'kiosk'
  const [queues, setQueues] = useState([]);
  const [activeQueueId, setActiveQueueId] = useState(null);
  const [queueTokens, setQueueTokens] = useState({ waiting: [], serving: [], recentHistory: [] });
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [cancelModalToken, setCancelModalToken] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch all queues
  const fetchQueues = useCallback(async (selectQueueId = null) => {
    try {
      const res = await api.getQueues();
      setQueues(res.queues || []);

      if (res.queues && res.queues.length > 0) {
        if (selectQueueId) {
          setActiveQueueId(selectQueueId);
        } else if (!activeQueueId || !res.queues.some(q => q.id === activeQueueId)) {
          setActiveQueueId(res.queues[0].id);
        }
      } else {
        setActiveQueueId(null);
      }
    } catch (err) {
      console.error('Failed to load queues:', err);
    }
  }, [activeQueueId]);

  // Fetch tokens for selected queue
  const fetchTokens = useCallback(async (queueId) => {
    if (!queueId) return;
    setLoadingTokens(true);
    try {
      const res = await api.getTokensByQueue(queueId);
      setQueueTokens({
        waiting: res.waiting || [],
        serving: res.serving || [],
        recentHistory: res.recentHistory || []
      });
    } catch (err) {
      console.error('Failed to load tokens for queue:', err);
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchQueues();
    }
  }, [isAuthenticated]);

  // Refresh tokens when active queue changes
  useEffect(() => {
    if (activeQueueId) {
      fetchTokens(activeQueueId);
    }
  }, [activeQueueId, fetchTokens]);

  // Socket.IO real-time subscription for active queue
  useEffect(() => {
    if (!activeQueueId) return;

    const unsubscribe = subscribeToQueue(activeQueueId, (event) => {
      // Re-fetch current queue tokens
      fetchTokens(activeQueueId);
      // Re-fetch queues summary counts
      fetchQueues(activeQueueId);

      if (event.action === 'TOKEN_SERVED' && event.payload) {
        const token = event.payload;
        voice.announceToken(token.token_code, token.counter_assigned || 'Counter 1');
        showToast(`Now Serving: ${token.token_code} (${token.customer_name})`, 'info');
      } else if (event.action === 'TOKEN_ADDED') {
        showToast(`New Token: ${event.payload?.token_code} added`, 'success');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeQueueId, fetchTokens, fetchQueues]);

  // Handler: Assign top token for service (Requirement 6)
  const handleServeNext = async (queueId) => {
    setActionLoading(true);
    try {
      const activeQ = queues.find(q => q.id === queueId);
      const res = await api.serveNextToken(queueId, activeQ?.counter_name);
      showToast(res.message, 'success');
      voice.announceToken(res.token.token_code, res.token.counter_assigned || 'Counter 1');
      await fetchTokens(queueId);
      await fetchQueues(queueId);
    } catch (err) {
      showToast(err.message || 'Failed to serve next token', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Serve a specific token
  const handleServeSpecific = async (tokenId) => {
    setActionLoading(true);
    try {
      const activeQ = queues.find(q => q.id === activeQueueId);
      const res = await api.serveToken(tokenId, activeQ?.counter_name);
      showToast(res.message, 'success');
      voice.announceToken(res.token.token_code, res.token.counter_assigned || 'Counter 1');
      await fetchTokens(activeQueueId);
      await fetchQueues(activeQueueId);
    } catch (err) {
      showToast(err.message || 'Failed to serve token', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Move Token Up (Requirement 5)
  const handleMoveUp = async (tokenId) => {
    setActionLoading(true);
    try {
      await api.moveTokenUp(tokenId);
      await fetchTokens(activeQueueId);
    } catch (err) {
      showToast(err.message || 'Failed to move token up', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Move Token Down (Requirement 5)
  const handleMoveDown = async (tokenId) => {
    setActionLoading(true);
    try {
      await api.moveTokenDown(tokenId);
      await fetchTokens(activeQueueId);
    } catch (err) {
      showToast(err.message || 'Failed to move token down', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Complete token service
  const handleCompleteToken = async (tokenId) => {
    try {
      const res = await api.completeToken(tokenId);
      showToast(res.message, 'success');
      await fetchTokens(activeQueueId);
      await fetchQueues(activeQueueId);
    } catch (err) {
      showToast(err.message || 'Failed to complete token service', 'error');
    }
  };

  // Handler: Cancel token callback
  const handleTokenCancelled = async (tokenId) => {
    showToast('Token cancelled successfully', 'info');
    await fetchTokens(activeQueueId);
    await fetchQueues(activeQueueId);
  };

  // Handler: Queue created callback
  const handleQueueCreated = async (newQueue) => {
    showToast(`Queue "${newQueue.name}" created!`, 'success');
    await fetchQueues(newQueue.id);
  };

  // Handler: Token added callback
  const handleTokenAdded = async (newToken) => {
    showToast(`Token ${newToken.token_code} issued for ${newToken.customer_name}`, 'success');
    await fetchTokens(activeQueueId);
    await fetchQueues(activeQueueId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading QueueFlow...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  const currentQueue = queues.find(q => q.id === activeQueueId) || queues[0];
  const currentServingToken = queueTokens.serving.length > 0 ? queueTokens.serving[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md bg-slate-900/95 text-xs sm:text-sm font-medium border-slate-700">
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span className="text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard queues={queues} />
        ) : activeTab === 'kiosk' ? (
          currentQueue ? (
            <PublicDisplayModal queue={currentQueue} onClose={() => setActiveTab('queues')} />
          ) : (
            <div className="p-8 sm:p-12 text-center text-slate-400">Please create a queue first.</div>
          )
        ) : (
          /* Operations & Queues View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
            {/* Left Column: Queues Navigation (3 cols) */}
            <div className="lg:col-span-4 xl:col-span-3">
              <QueueSidebar
                queues={queues}
                activeQueueId={activeQueueId}
                onSelectQueue={(id) => setActiveQueueId(id)}
                onOpenCreateModal={() => setIsCreateQueueOpen(true)}
              />
            </div>

            {/* Right Column: Queue Operations (9 cols) */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-3.5 sm:space-y-6">
              {currentQueue ? (
                <>
                  {/* Queue Title Bar & Quick Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-mono font-black text-base sm:text-lg flex items-center justify-center shrink-0">
                        {currentQueue.code_prefix}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">{currentQueue.name}</h1>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 sm:gap-2 truncate">
                          <span className="flex items-center gap-1 text-slate-300 shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            {currentQueue.counter_name || 'Counter 1'}
                          </span>
                          {currentQueue.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[160px] sm:max-w-xs">{currentQueue.description}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setActiveTab('kiosk')}
                        className="py-1.5 sm:py-2 px-2.5 sm:px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Open Fullscreen TV Monitor Display"
                      >
                        <Tv className="w-3.5 h-3.5 text-indigo-400" />
                        <span>TV Kiosk</span>
                      </button>

                      <button
                        onClick={() => setIsAddTokenOpen(true)}
                        className="py-1.5 sm:py-2 px-3 sm:px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Person</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Serving Card (Requirement 6) */}
                  <ActiveServingCard
                    servingToken={currentServingToken}
                    queue={currentQueue}
                    onComplete={handleCompleteToken}
                  />

                  {/* Waiting Queue List (Requirements 3, 4, 5, 6, 7) */}
                  <WaitingQueueList
                    queue={currentQueue}
                    waitingTokens={queueTokens.waiting}
                    servingTokens={queueTokens.serving}
                    onServeNext={handleServeNext}
                    onServeSpecific={handleServeSpecific}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onOpenAddModal={() => setIsAddTokenOpen(true)}
                    onOpenCancelModal={(token) => setCancelModalToken(token)}
                    loadingAction={actionLoading}
                  />

                  {/* Recent History */}
                  <RecentHistoryTable historyTokens={queueTokens.recentHistory} />
                </>
              ) : (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-2">No Queues Available</h3>
                  <p className="text-xs text-slate-400 mb-4">Create your first queue to start generating tokens and serving customers.</p>
                  <button
                    onClick={() => setIsCreateQueueOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Queue</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateQueueModal
        isOpen={isCreateQueueOpen}
        onClose={() => setIsCreateQueueOpen(false)}
        onQueueCreated={handleQueueCreated}
      />

      <AddTokenModal
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
        queue={currentQueue}
        onTokenAdded={handleTokenAdded}
      />

      <CancelTokenModal
        isOpen={!!cancelModalToken}
        onClose={() => setCancelModalToken(null)}
        token={cancelModalToken}
        onTokenCancelled={handleTokenCancelled}
      />
    </div>
  );
}
