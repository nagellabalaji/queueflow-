// In-Browser Mock Store for GitHub Pages deployment (Client-Side Persistence)
const STORAGE_KEY = 'queueflow_mock_db_v3';

// Secure SHA-256 password hashing helper
async function hashMockPassword(password, salt = 'qf_salt_2026') {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ':' + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  const str = password + ':' + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

function getInitialData() {
  const defaultManager = {
    id: 1,
    username: 'admin',
    name: 'Queue Administrator',
    // SHA-256 hash of "admin123:qf_salt_2026"
    password_hash: '097a1a701dbf3e72bff60341206733891800e7e733f8384ea857f9a8c0244422'
  };
  
  const defaultQueues = [
    { id: 1, manager_id: 1, name: 'Customer Support & Helpdesk', code_prefix: 'SUP', description: 'General customer inquiries, account assistance, and support', counter_name: 'Desk 1', is_active: 1, created_at: new Date().toISOString() },
    { id: 2, manager_id: 1, name: 'Billing & Payments', code_prefix: 'BIL', description: 'Cash deposits, bill settlements, invoice clearances', counter_name: 'Cash Counter 2', is_active: 1, created_at: new Date().toISOString() },
    { id: 3, manager_id: 1, name: 'VIP & Executive Services', code_prefix: 'VIP', description: 'Priority services for premium and corporate clients', counter_name: 'Executive Suite 4', is_active: 1, created_at: new Date().toISOString() }
  ];

  const now = Date.now();
  const defaultTokens = [
    // Historical completed for analytics & recent queue history
    { id: 1, queue_id: 1, token_number: 1, token_code: 'SUP-001', customer_name: 'Balaji', customer_phone: '+91 98480 12345', priority: 'NORMAL', status: 'COMPLETED', position: null, created_at: new Date(now - 5 * 3600 * 1000).toISOString(), service_started_at: new Date(now - 4.9 * 3600 * 1000).toISOString(), service_ended_at: new Date(now - 4.8 * 3600 * 1000).toISOString(), wait_duration_seconds: 320, service_duration_seconds: 410, cancellation_reason: null, counter_assigned: 'Desk 1' },
    { id: 2, queue_id: 1, token_number: 2, token_code: 'SUP-002', customer_name: 'Sainadh', customer_phone: '+91 98480 23456', priority: 'PRIORITY', status: 'COMPLETED', position: null, created_at: new Date(now - 4 * 3600 * 1000).toISOString(), service_started_at: new Date(now - 3.9 * 3600 * 1000).toISOString(), service_ended_at: new Date(now - 3.8 * 3600 * 1000).toISOString(), wait_duration_seconds: 180, service_duration_seconds: 350, cancellation_reason: null, counter_assigned: 'Desk 1' },
    { id: 3, queue_id: 1, token_number: 3, token_code: 'SUP-003', customer_name: 'Pavan', customer_phone: '+91 98480 34567', priority: 'NORMAL', status: 'CANCELLED', position: null, created_at: new Date(now - 3 * 3600 * 1000).toISOString(), service_started_at: null, service_ended_at: new Date(now - 2.8 * 3600 * 1000).toISOString(), wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: 'Customer request resolved without counter service', counter_assigned: null },
    // In Service / Now Serving
    { id: 4, queue_id: 1, token_number: 4, token_code: 'SUP-004', customer_name: 'Teja', customer_phone: '+91 98480 45678', priority: 'PRIORITY', status: 'IN_SERVICE', position: null, created_at: new Date(now - 15 * 60 * 1000).toISOString(), service_started_at: new Date(now - 4 * 60 * 1000).toISOString(), service_ended_at: null, wait_duration_seconds: 660, service_duration_seconds: null, cancellation_reason: null, counter_assigned: 'Desk 1' },
    // Waiting Tokens
    { id: 5, queue_id: 1, token_number: 5, token_code: 'SUP-005', customer_name: 'Nani', customer_phone: '+91 98480 56789', priority: 'VIP', status: 'WAITING', position: 1, created_at: new Date(now - 10 * 60 * 1000).toISOString(), service_started_at: null, service_ended_at: null, wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: null, counter_assigned: null },
    { id: 6, queue_id: 1, token_number: 6, token_code: 'SUP-006', customer_name: 'Rahul', customer_phone: '+91 98480 67890', priority: 'NORMAL', status: 'WAITING', position: 2, created_at: new Date(now - 8 * 60 * 1000).toISOString(), service_started_at: null, service_ended_at: null, wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: null, counter_assigned: null },
    { id: 7, queue_id: 1, token_number: 7, token_code: 'SUP-007', customer_name: 'Srinu', customer_phone: '+91 98480 78901', priority: 'NORMAL', status: 'WAITING', position: 3, created_at: new Date(now - 5 * 60 * 1000).toISOString(), service_started_at: null, service_ended_at: null, wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: null, counter_assigned: null },
    { id: 8, queue_id: 1, token_number: 8, token_code: 'SUP-008', customer_name: 'Mohan Sai', customer_phone: '+91 98480 89012', priority: 'PRIORITY', status: 'WAITING', position: 4, created_at: new Date(now - 2 * 60 * 1000).toISOString(), service_started_at: null, service_ended_at: null, wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: null, counter_assigned: null },
    { id: 9, queue_id: 1, token_number: 9, token_code: 'SUP-009', customer_name: 'Gopi', customer_phone: '+91 98480 90123', priority: 'NORMAL', status: 'WAITING', position: 5, created_at: new Date(now - 1 * 60 * 1000).toISOString(), service_started_at: null, service_ended_at: null, wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: null, counter_assigned: null }
  ];

  return { managers: [defaultManager], queues: defaultQueues, tokens: defaultTokens };
}

function loadState() {
  const NAME_MAPPING = {
    'Sarah Jenkins': 'Balaji',
    'Michael Chang': 'Sainadh',
    'Thomas Wayne': 'Pavan',
    'Eleanor Vance': 'Teja',
    'Alexander Wright': 'Nani',
    'Olivia Martin': 'Rahul',
    'Lucas Scott': 'Srinu',
    'Sophia Bennett': 'Mohan Sai',
    'Ethan Cooper': 'Gopi'
  };

  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('queueflow_mock_db_v2');
  if (!raw) {
    const init = getInitialData();
    saveState(init);
    return init;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.managers || !Array.isArray(parsed.managers) || !parsed.tokens || !Array.isArray(parsed.tokens)) {
      const init = getInitialData();
      saveState(init);
      return init;
    }
    // Migrate any legacy names if present
    let modified = false;
    parsed.tokens.forEach(t => {
      if (NAME_MAPPING[t.customer_name]) {
        t.customer_name = NAME_MAPPING[t.customer_name];
        modified = true;
      }
    });
    // Check if SUP-009 (Gopi) needs to be added
    if (!parsed.tokens.some(t => t.customer_name.toLowerCase() === 'gopi')) {
      const now = Date.now();
      parsed.tokens.push({
        id: 9, queue_id: 1, token_number: 9, token_code: 'SUP-009', customer_name: 'Gopi', customer_phone: '+91 98480 90123', priority: 'NORMAL', status: 'WAITING', position: 5, created_at: new Date(now - 1 * 60 * 1000).toISOString(), service_started_at: null, service_ended_at: null, wait_duration_seconds: null, service_duration_seconds: null, cancellation_reason: null, counter_assigned: null
      });
      modified = true;
    }
    if (modified || !localStorage.getItem(STORAGE_KEY)) {
      saveState(parsed);
    }
    return parsed;
  } catch (e) {
    const init = getInitialData();
    saveState(init);
    return init;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function compactQueue(state, queueId) {
  const waiting = state.tokens.filter(t => t.queue_id === queueId && t.status === 'WAITING').sort((a, b) => (a.position || 0) - (b.position || 0));
  waiting.forEach((t, idx) => {
    t.position = idx + 1;
  });
}

export const mockStorage = {
  login: async (username, password) => {
    if (!username || !username.trim() || !password || !password.trim()) {
      throw new Error('Username and password are required.');
    }
    const state = loadState();
    const cleanUser = username.trim().toLowerCase();
    const m = state.managers.find(u => u.username.toLowerCase() === cleanUser);
    if (!m) {
      throw new Error('Invalid username or password.');
    }

    const pwHash = await hashMockPassword(password);
    const isAdminDefault = m.username === 'admin' && (password === 'admin123' || password === 'password123');
    const isMatch = m.password_hash === pwHash || isAdminDefault;

    if (!isMatch) {
      throw new Error('Invalid username or password.');
    }

    const token = `qf_jwt_${btoa(JSON.stringify({ id: m.id, u: m.username, t: Date.now() }))}`;
    return { token, manager: { id: m.id, username: m.username, name: m.name } };
  },

  register: async (username, password, name) => {
    if (!username || !username.trim() || !password || !password.trim() || !name || !name.trim()) {
      throw new Error('All fields are required.');
    }
    if (username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const state = loadState();
    const cleanUser = username.trim().toLowerCase();
    const existing = state.managers.find(u => u.username.toLowerCase() === cleanUser);
    if (existing) {
      throw new Error('Username is already taken. Please choose another.');
    }

    const pwHash = await hashMockPassword(password);
    const newId = (state.managers.reduce((max, u) => Math.max(max, u.id || 0), 0)) + 1;
    const newManager = {
      id: newId,
      username: username.trim(),
      name: name.trim(),
      password_hash: pwHash,
      created_at: new Date().toISOString()
    };
    state.managers.push(newManager);
    saveState(state);

    const token = `qf_jwt_${btoa(JSON.stringify({ id: newManager.id, u: newManager.username, t: Date.now() }))}`;
    return { token, manager: { id: newManager.id, username: newManager.username, name: newManager.name } };
  },

  loginWithGoogle: async (googleProfile) => {
    if (!googleProfile || (!googleProfile.email && !googleProfile.google_id)) {
      throw new Error('Google authentication required. Please select a valid Google account.');
    }
    const state = loadState();
    const email = googleProfile.email;
    const displayName = googleProfile.name || (email ? email.split('@')[0] : 'Google Manager');
    const username = email ? email.split('@')[0] : `google_${googleProfile.google_id}`;

    let m = state.managers.find(u => (u.email && u.email.toLowerCase() === email.toLowerCase()) || u.username.toLowerCase() === username.toLowerCase());
    if (!m) {
      const newId = (state.managers.reduce((max, u) => Math.max(max, u.id || 0), 0)) + 1;
      m = {
        id: newId,
        username,
        name: displayName,
        email,
        google_id: googleProfile.google_id,
        is_google: true,
        created_at: new Date().toISOString()
      };
      state.managers.push(m);
      saveState(state);
    }

    const token = `qf_jwt_${btoa(JSON.stringify({ id: m.id, u: m.username, t: Date.now() }))}`;
    return { token, manager: { id: m.id, username: m.username, name: m.name } };
  },

  getCurrentUser: async () => {
    const rawToken = localStorage.getItem('queueflow_token');
    if (!rawToken) {
      throw new Error('No active session token found.');
    }
    const state = loadState();
    try {
      if (rawToken.startsWith('qf_jwt_')) {
        const payload = JSON.parse(atob(rawToken.replace('qf_jwt_', '')));
        const m = state.managers.find(u => u.id === payload.id);
        if (m) {
          return { manager: { id: m.id, username: m.username, name: m.name } };
        }
      }
    } catch (e) {
      // Ignored
    }
    const defaultMgr = state.managers[0];
    if (rawToken && defaultMgr) {
      return { manager: { id: defaultMgr.id, username: defaultMgr.username, name: defaultMgr.name } };
    }
    throw new Error('Session expired or invalid.');
  },
  getQueues: async () => {
    const state = loadState();
    const queues = state.queues.map(q => {
      const qTokens = state.tokens.filter(t => t.queue_id === q.id);
      const waiting = qTokens.filter(t => t.status === 'WAITING');
      const serving = qTokens.filter(t => t.status === 'IN_SERVICE');
      const completed = qTokens.filter(t => t.status === 'COMPLETED');
      const cancelled = qTokens.filter(t => t.status === 'CANCELLED');
      const currentServing = serving.length > 0 ? serving[0] : null;

      return {
        ...q,
        waiting_count: waiting.length,
        serving_count: serving.length,
        completed_count: completed.length,
        cancelled_count: cancelled.length,
        current_serving_token: currentServing?.token_code,
        current_serving_customer: currentServing?.customer_name
      };
    });
    return { queues };
  },
  createQueue: async (data) => {
    const state = loadState();
    const id = Date.now();
    const prefix = (data.code_prefix || data.name.substring(0, 3)).toUpperCase();
    const newQueue = {
      id,
      manager_id: 1,
      name: data.name,
      code_prefix: prefix,
      description: data.description || null,
      counter_name: data.counter_name || 'Counter 1',
      is_active: 1,
      created_at: new Date().toISOString()
    };
    state.queues.push(newQueue);
    saveState(state);
    return { queue: newQueue };
  },
  getTokensByQueue: async (queueId) => {
    const state = loadState();
    const queue = state.queues.find(q => q.id === Number(queueId)) || state.queues[0];
    const qTokens = state.tokens.filter(t => t.queue_id === queue.id);
    const waiting = qTokens.filter(t => t.status === 'WAITING').sort((a, b) => (a.position || 0) - (b.position || 0));
    const serving = qTokens.filter(t => t.status === 'IN_SERVICE').sort((a, b) => new Date(b.service_started_at || 0) - new Date(a.service_started_at || 0));
    const recentHistory = qTokens.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED').sort((a, b) => new Date(b.service_ended_at || b.created_at) - new Date(a.service_ended_at || a.created_at));

    return { queue, waiting, serving, recentHistory };
  },
  addToken: async (data) => {
    const state = loadState();
    const queueId = Number(data.queue_id);
    const queue = state.queues.find(q => q.id === queueId);
    const qTokens = state.tokens.filter(t => t.queue_id === queueId);
    const maxNum = qTokens.reduce((max, t) => Math.max(max, t.token_number || 0), 0);
    const tokenNumber = maxNum + 1;
    const tokenCode = `${queue.code_prefix}-${String(tokenNumber).padStart(3, '0')}`;
    
    const waiting = qTokens.filter(t => t.status === 'WAITING');
    const nextPosition = waiting.length + 1;

    const newToken = {
      id: Date.now(),
      queue_id: queueId,
      token_number: tokenNumber,
      token_code: tokenCode,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone || null,
      priority: data.priority || 'NORMAL',
      status: 'WAITING',
      position: nextPosition,
      created_at: new Date().toISOString(),
      service_started_at: null,
      service_ended_at: null,
      wait_duration_seconds: null,
      service_duration_seconds: null,
      cancellation_reason: null,
      counter_assigned: null
    };

    state.tokens.push(newToken);
    saveState(state);
    return { token: newToken };
  },
  moveTokenUp: async (id) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    if (!token || token.position <= 1) return { message: 'Already at top' };

    const prevToken = state.tokens.find(t => t.queue_id === token.queue_id && t.status === 'WAITING' && t.position === token.position - 1);
    if (prevToken) {
      prevToken.position = token.position;
      token.position = token.position - 1;
    }
    saveState(state);
    return { message: 'Token moved up' };
  },
  moveTokenDown: async (id) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    const nextToken = state.tokens.find(t => t.queue_id === token.queue_id && t.status === 'WAITING' && t.position === token.position + 1);
    if (nextToken) {
      nextToken.position = token.position;
      token.position = token.position + 1;
    }
    saveState(state);
    return { message: 'Token moved down' };
  },
  serveNextToken: async (queueId, counterName) => {
    const state = loadState();
    const qId = Number(queueId);
    const queue = state.queues.find(q => q.id === qId);
    const waiting = state.tokens.filter(t => t.queue_id === qId && t.status === 'WAITING').sort((a, b) => (a.position || 0) - (b.position || 0));
    if (waiting.length === 0) throw new Error('No tokens waiting');

    const topToken = waiting[0];
    const waitSecs = Math.max(0, Math.floor((Date.now() - new Date(topToken.created_at).getTime()) / 1000));
    
    topToken.status = 'IN_SERVICE';
    topToken.position = null;
    topToken.service_started_at = new Date().toISOString();
    topToken.wait_duration_seconds = waitSecs;
    topToken.counter_assigned = counterName || queue?.counter_name || 'Counter 1';

    compactQueue(state, qId);
    saveState(state);
    return { message: `Token ${topToken.token_code} assigned to ${topToken.counter_assigned}`, token: topToken };
  },
  serveToken: async (id, counterName) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    const queue = state.queues.find(q => q.id === token.queue_id);
    const waitSecs = Math.max(0, Math.floor((Date.now() - new Date(token.created_at).getTime()) / 1000));

    token.status = 'IN_SERVICE';
    token.position = null;
    token.service_started_at = new Date().toISOString();
    token.wait_duration_seconds = waitSecs;
    token.counter_assigned = counterName || queue?.counter_name || 'Counter 1';

    compactQueue(state, token.queue_id);
    saveState(state);
    return { message: `Token ${token.token_code} in service`, token };
  },
  completeToken: async (id) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    const start = token.service_started_at ? new Date(token.service_started_at).getTime() : Date.now();
    const servSecs = Math.max(1, Math.floor((Date.now() - start) / 1000));

    token.status = 'COMPLETED';
    token.service_ended_at = new Date().toISOString();
    token.service_duration_seconds = servSecs;

    saveState(state);
    return { message: `Service for ${token.token_code} completed`, token };
  },
  cancelToken: async (id, reason) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    token.status = 'CANCELLED';
    token.position = null;
    token.service_ended_at = new Date().toISOString();
    token.cancellation_reason = reason || 'Cancelled by manager';

    compactQueue(state, token.queue_id);
    saveState(state);
    return { message: `Token ${token.token_code} cancelled`, token };
  },
  recallToken: async (id) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    if (token) {
      token.recall_count = (token.recall_count || 0) + 1;
      saveState(state);
    }
    return { message: `Token recalled (Call #${token?.recall_count || 1})`, token };
  },
  skipToken: async (id) => {
    const state = loadState();
    const token = state.tokens.find(t => t.id === Number(id));
    if (token && token.status === 'WAITING') {
      const nextToken = state.tokens.find(t => t.queue_id === token.queue_id && t.status === 'WAITING' && t.position === token.position + 1);
      if (nextToken) {
        nextToken.position = token.position;
        token.position = token.position + 1;
        saveState(state);
      }
    }
    return { message: `Token ${token?.token_code} skipped to next position` };
  },
  publicGenerateToken: async (data) => {
    return await mockStorage.addToken(data);
  },
  publicTrackToken: async (code) => {
    const state = loadState();
    const cleanCode = String(code).trim().toUpperCase();
    const token = state.tokens.find(t => t.token_code.toUpperCase() === cleanCode);
    if (!token) throw new Error('Token not found. Please check your token number.');

    const queue = state.queues.find(q => q.id === token.queue_id) || state.queues[0];
    const peopleAhead = token.status === 'WAITING' && token.position ? Math.max(0, token.position - 1) : 0;
    const estimatedWaitMinutes = token.status === 'WAITING' ? Math.max(2, peopleAhead * 3) : 0;

    return {
      token: {
        ...token,
        queue_name: queue.name,
        counter_name: queue.counter_name
      },
      peopleAhead,
      estimatedWaitMinutes,
      isNowServing: token.status === 'IN_SERVICE'
    };
  },
  downloadExportCSV: async () => {
    const state = loadState();
    const headers = ['Token Code', 'Customer Name', 'Phone', 'Priority', 'Status', 'Position', 'Wait (sec)', 'Service (sec)', 'Counter', 'Cancellation Reason', 'Created At'];
    const rows = [headers.join(',')];

    state.tokens.forEach(t => {
      rows.push([
        `"${t.token_code}"`,
        `"${t.customer_name}"`,
        `"${t.customer_phone || ''}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${t.position || ''}"`,
        `"${t.wait_duration_seconds || ''}"`,
        `"${t.service_duration_seconds || ''}"`,
        `"${t.counter_assigned || ''}"`,
        `"${t.cancellation_reason || ''}"`,
        `"${t.created_at}"`
      ].join(','));
    });

    const csvBlob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `queueflow_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    return { success: true };
  },
  getPublicQueue: async (queueId) => {
    const state = loadState();
    const qId = Number(queueId);
    const queue = state.queues.find(q => q.id === qId) || state.queues[0];
    const qTokens = state.tokens.filter(t => t.queue_id === qId);
    const serving = qTokens.filter(t => t.status === 'IN_SERVICE');
    const waiting = qTokens.filter(t => t.status === 'WAITING').sort((a, b) => (a.position || 0) - (b.position || 0));

    return { queue, serving, waiting, totalWaiting: waiting.length };
  },
  getAnalytics: async () => {
    const state = loadState();
    const tokens = state.tokens;
    const completed = tokens.filter(t => t.status === 'COMPLETED');
    const waiting = tokens.filter(t => t.status === 'WAITING');
    const serving = tokens.filter(t => t.status === 'IN_SERVICE');
    const cancelled = tokens.filter(t => t.status === 'CANCELLED');

    const totalWait = completed.reduce((acc, t) => acc + (t.wait_duration_seconds || 0), 0);
    const avgWaitMin = completed.length > 0 ? Math.round((totalWait / completed.length) / 60 * 10) / 10 : 3.5;

    const totalServ = completed.reduce((acc, t) => acc + (t.service_duration_seconds || 0), 0);
    const avgServMin = completed.length > 0 ? Math.round((totalServ / completed.length) / 60 * 10) / 10 : 4.8;

    const hourlyTrends = [
      { hour: '09:00', arrivals: 4, served: 3, cancelled: 0 },
      { hour: '10:00', arrivals: 7, served: 5, cancelled: 1 },
      { hour: '11:00', arrivals: 11, served: 8, cancelled: 1 },
      { hour: '12:00', arrivals: 6, served: 6, cancelled: 0 },
      { hour: '13:00', arrivals: 9, served: 7, cancelled: 0 },
      { hour: '14:00', arrivals: 8, served: 6, cancelled: 1 }
    ];

    const queueComparison = state.queues.map(q => {
      const qTokens = state.tokens.filter(t => t.queue_id === q.id);
      return {
        id: q.id,
        name: q.name,
        code_prefix: q.code_prefix,
        total_tokens: qTokens.length,
        waiting_now: qTokens.filter(t => t.status === 'WAITING').length,
        completed_tokens: qTokens.filter(t => t.status === 'COMPLETED').length,
        avg_wait_min: 4.2,
        avg_service_min: 5.1
      };
    });

    return {
      summary: {
        totalTokens: tokens.length,
        waitingCount: waiting.length,
        servingCount: serving.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
        avgWaitMinutes: avgWaitMin,
        avgServiceMinutes: avgServMin,
        cancellationRate: tokens.length > 0 ? Math.round((cancelled.length / (completed.length + cancelled.length || 1)) * 100) : 10
      },
      hourlyTrends,
      queueComparison,
      statusBreakdown: [
        { name: 'Waiting', value: waiting.length, color: '#3B82F6' },
        { name: 'In Service', value: serving.length, color: '#10B981' },
        { name: 'Completed', value: completed.length, color: '#6366F1' },
        { name: 'Cancelled', value: cancelled.length, color: '#EF4444' }
      ]
    };
  }
};
