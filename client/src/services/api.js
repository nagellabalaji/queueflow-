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
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (
      err.message === 'STATIC_HOSTING' ||
      err.name === 'TypeError' ||
      err.message?.includes('404') ||
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
      if (
        isStaticHosting ||
        err.message === 'STATIC_HOSTING' ||
        err.name === 'TypeError' ||
        err.message?.includes('404') ||
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
    (username) => mockStorage.login(username)
  ),
  register: withFallback(
    (username, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name }) }),
    (username) => mockStorage.login(username)
  ),
  demoLogin: withFallback(
    () => request('/auth/demo', { method: 'POST' }),
    () => mockStorage.login('admin')
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

  // Analytics
  getAnalytics: withFallback(
    (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/analytics${query ? `?${query}` : ''}`);
    },
    () => mockStorage.getAnalytics()
  )
};
