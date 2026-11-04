const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('queueflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name }) }),
  demoLogin: () => request('/auth/demo', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me'),

  // Queues
  getQueues: () => request('/queues'),
  getQueue: (id) => request(`/queues/${id}`),
  createQueue: (data) => request('/queues', { method: 'POST', body: JSON.stringify(data) }),
  updateQueue: (id, data) => request(`/queues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQueue: (id) => request(`/queues/${id}`, { method: 'DELETE' }),
  getPublicQueue: (id) => request(`/queues/public/${id}`),

  // Tokens
  getTokensByQueue: (queueId) => request(`/tokens/queue/${queueId}`),
  addToken: (data) => request('/tokens', { method: 'POST', body: JSON.stringify(data) }),
  moveTokenUp: (id) => request(`/tokens/${id}/move-up`, { method: 'POST' }),
  moveTokenDown: (id) => request(`/tokens/${id}/move-down`, { method: 'POST' }),
  serveNextToken: (queueId, counterName) => request(`/tokens/queue/${queueId}/serve-next`, { method: 'POST', body: JSON.stringify({ counter_name: counterName }) }),
  serveToken: (id, counterName) => request(`/tokens/${id}/serve`, { method: 'POST', body: JSON.stringify({ counter_name: counterName }) }),
  completeToken: (id) => request(`/tokens/${id}/complete`, { method: 'POST' }),
  cancelToken: (id, reason) => request(`/tokens/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Analytics
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics${query ? `?${query}` : ''}`);
  }
};
