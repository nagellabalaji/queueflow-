import { mockStorage } from './mockStorage';

const API_BASE = '/api';

// Detect if running on static hosting with no Node.js backend
const isStaticHosting = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('pages.dev') ||
  window.location.hostname.includes('netlify.app') ||
  window.location.hostname.includes('vercel.app') ||
  window.location.protocol === 'file:'
);

function getAuthHeader() {
  const token = localStorage.getItem('queueflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  if (isStaticHosting) {
    throw new Error('STATIC_HOSTING');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('STATIC_HOSTING');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const apiErr = new Error(errorMsg);
      apiErr.isApiError = true;
      apiErr.status = response.status;
      throw apiErr;
    }

    return data;
  } catch (err) {
    if (err.isApiError) {
      throw err;
    }
    if (
      err.message === 'STATIC_HOSTING' ||
      err.name === 'TypeError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError')
    ) {
      throw new Error('STATIC_HOSTING');
    }
    throw err;
  }
}

// Wrapper with seamless mockStorage fallback
function withFallback(apiCall, fallbackCall) {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (err) {
      // Never swallow explicit API authentication or validation errors
      if (err.isApiError) {
        throw err;
      }
      if (
        isStaticHosting ||
        err.message === 'STATIC_HOSTING' ||
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError')
      ) {
        return await fallbackCall(...args);
      }
      throw err;
    }
  };
}

export const api = {
  // Auth
  login: withFallback(
    (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    (username, password) => mockStorage.login(username, password)
  ),
  register: withFallback(
    (username, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name }) }),
    (username, password, name) => mockStorage.register(username, password, name)
  ),
  demoLogin: withFallback(
    () => request('/auth/demo', { method: 'POST' }),
    () => mockStorage.login('admin', 'admin123')
  ),
  loginWithGoogle: withFallback(
    (payload) => request('/auth/google', { method: 'POST', body: JSON.stringify(payload || {}) }),
    (payload) => mockStorage.loginWithGoogle(payload)
  ),
  getCurrentUser: withFallback(
    () => request('/auth/me'),
    () => mockStorage.getCurrentUser()
  ),

  // Queues
  getQueues: withFallback(
    () => request('/queues'),
    () => mockStorage.getQueues()
  ),
  getQueue: withFallback(
    (id) => request(`/queues/${id}`),
    async (id) => {
      const res = await mockStorage.getQueues();
      return { queue: res.queues.find(q => q.id === Number(id)) };
    }
  ),
  createQueue: withFallback(
    (data) => request('/queues', { method: 'POST', body: JSON.stringify(data) }),
    (data) => mockStorage.createQueue(data)
  ),
  updateQueue: withFallback(
    (id, data) => request(`/queues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    (id, data) => ({ message: 'Queue updated' })
  ),
  deleteQueue: withFallback(
    (id) => request(`/queues/${id}`, { method: 'DELETE' }),
    (id) => ({ message: 'Queue deleted' })
  ),
  getPublicQueue: withFallback(
    (id) => request(`/queues/public/${id}`),
    (id) => mockStorage.getPublicQueue(id)
  ),

  // Tokens
  getTokensByQueue: withFallback(
    (queueId) => request(`/tokens/queue/${queueId}`),
    (queueId) => mockStorage.getTokensByQueue(queueId)
  ),
  addToken: withFallback(
    (data) => request('/tokens', { method: 'POST', body: JSON.stringify(data) }),
    (data) => mockStorage.addToken(data)
  ),
  moveTokenUp: withFallback(
    (id) => request(`/tokens/${id}/move-up`, { method: 'POST' }),
    (id) => mockStorage.moveTokenUp(id)
  ),
  moveTokenDown: withFallback(
    (id) => request(`/tokens/${id}/move-down`, { method: 'POST' }),
    (id) => mockStorage.moveTokenDown(id)
  ),
  serveNextToken: withFallback(
    (queueId, counterName) => request(`/tokens/queue/${queueId}/serve-next`, { method: 'POST', body: JSON.stringify({ counter_name: counterName }) }),
    (queueId, counterName) => mockStorage.serveNextToken(queueId, counterName)
  ),
  serveToken: withFallback(
    (id, counterName) => request(`/tokens/${id}/serve`, { method: 'POST', body: JSON.stringify({ counter_name: counterName }) }),
    (id, counterName) => mockStorage.serveToken(id, counterName)
  ),
  completeToken: withFallback(
    (id) => request(`/tokens/${id}/complete`, { method: 'POST' }),
    (id) => mockStorage.completeToken(id)
  ),
  cancelToken: withFallback(
    (id, reason) => request(`/tokens/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    (id, reason) => mockStorage.cancelToken(id, reason)
  ),
  recallToken: withFallback(
    (id) => request(`/tokens/${id}/recall`, { method: 'POST' }),
    (id) => mockStorage.recallToken(id)
  ),
  skipToken: withFallback(
    (id) => request(`/tokens/${id}/skip`, { method: 'POST' }),
    (id) => mockStorage.skipToken(id)
  ),
  publicGenerateToken: withFallback(
    (data) => request('/tokens/public-generate', { method: 'POST', body: JSON.stringify(data) }),
    (data) => mockStorage.publicGenerateToken(data)
  ),
  publicTrackToken: withFallback(
    (code) => request(`/tokens/public-track/${encodeURIComponent(code)}`),
    (code) => mockStorage.publicTrackToken(code)
  ),

  // Analytics
  getAnalytics: withFallback(
    (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/analytics${query ? `?${query}` : ''}`);
    },
    () => mockStorage.getAnalytics()
  ),
  downloadExportCSV: withFallback(
    async () => {
      const token = localStorage.getItem('queueflow_token');
      const res = await fetch('/api/analytics/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('API_FAIL');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `queueflow_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      return { success: true };
    },
    () => mockStorage.downloadExportCSV()
  )
};
