const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('--- Seeding QueueFlow Database ---');

// 1. Create or ensure Demo Manager
let manager = db.prepare('SELECT * FROM managers WHERE username = ?').get('admin');
if (!manager) {
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync('admin123', salt);
  const res = db.prepare(`
    INSERT INTO managers (username, password_hash, name)
    VALUES ('admin', ?, 'Queue Administrator')
  `).run(password_hash);
  manager = { id: Number(res.lastInsertRowid), username: 'admin', name: 'Queue Administrator' };
  console.log('Created demo manager: admin (password: admin123)');
} else {
  console.log('Demo manager already exists: admin');
}

// 2. Check if queues exist, if not create sample queues
let queues = db.prepare('SELECT * FROM queues WHERE manager_id = ?').all(manager.id);
if (queues.length === 0) {
  const q1 = db.prepare(`
    INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
    VALUES (?, 'Customer Support & Helpdesk', 'SUP', 'General customer inquiries, account assistance, and support', 'Desk 1')
  `).run(manager.id);

  const q2 = db.prepare(`
    INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
    VALUES (?, 'Billing & Payments', 'BIL', 'Cash deposits, bill settlements, invoice clearances', 'Cash Counter 2')
  `).run(manager.id);

  const q3 = db.prepare(`
    INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
    VALUES (?, 'VIP & Executive Services', 'VIP', 'Priority services for premium and corporate clients', 'Executive Suite 4')
  `).run(manager.id);

  queues = db.prepare('SELECT * FROM queues WHERE manager_id = ?').all(manager.id);
  console.log(`Created ${queues.length} sample queues.`);
}

// 3. Seed tokens if empty
const tokenCount = db.prepare('SELECT COUNT(*) as count FROM tokens').get().count;
if (tokenCount === 0) {
  const supQueue = queues.find(q => q.code_prefix === 'SUP') || queues[0];
  const bilQueue = queues.find(q => q.code_prefix === 'BIL') || queues[1] || queues[0];
  const vipQueue = queues.find(q => q.code_prefix === 'VIP') || queues[2] || queues[0];

  const insertToken = db.prepare(`
    INSERT INTO tokens (
      queue_id, token_number, token_code, customer_name, customer_phone,
      priority, status, position, created_at, service_started_at,
      service_ended_at, wait_duration_seconds, service_duration_seconds,
      cancellation_reason, counter_assigned
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Historical completed tokens for SUP queue (spread across hours for analytics)
  const completedData = [
    { name: 'Sarah Jenkins', phone: '+1-555-0101', priority: 'NORMAL', wait: 320, service: 410, hoursAgo: 5 },
    { name: 'Michael Chang', phone: '+1-555-0102', priority: 'PRIORITY', wait: 180, service: 350, hoursAgo: 4 },
    { name: 'Emily Rodriguez', phone: '+1-555-0103', priority: 'NORMAL', wait: 450, service: 520, hoursAgo: 4 },
    { name: 'David Kim', phone: '+1-555-0104', priority: 'VIP', wait: 120, service: 600, hoursAgo: 3 },
    { name: 'Jessica Taylor', phone: '+1-555-0105', priority: 'NORMAL', wait: 390, service: 300, hoursAgo: 2 },
    { name: 'Robert Johnson', phone: '+1-555-0106', priority: 'NORMAL', wait: 280, service: 440, hoursAgo: 1 }
  ];

  let tokenNum = 1;
  completedData.forEach((item) => {
    const createdDate = new Date(Date.now() - item.hoursAgo * 3600 * 1000);
    const serviceStartDate = new Date(createdDate.getTime() + item.wait * 1000);
    const serviceEndDate = new Date(serviceStartDate.getTime() + item.service * 1000);

    insertToken.run(
      supQueue.id,
      tokenNum,
      `SUP-${String(tokenNum).padStart(3, '0')}`,
      item.name,
      item.phone,
      item.priority,
      'COMPLETED',
      null,
      createdDate.toISOString().replace('T', ' ').substring(0, 19),
      serviceStartDate.toISOString().replace('T', ' ').substring(0, 19),
      serviceEndDate.toISOString().replace('T', ' ').substring(0, 19),
      item.wait,
      item.service,
      null,
      supQueue.counter_name
    );
    tokenNum++;
  });

  // Cancelled token for realistic analytics
  insertToken.run(
    supQueue.id,
    tokenNum,
    `SUP-${String(tokenNum).padStart(3, '0')}`,
    'Thomas Wayne',
    '+1-555-0199',
    'NORMAL',
    'CANCELLED',
    null,
    new Date(Date.now() - 2.5 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    null,
    new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    null,
    null,
    'Customer left premise before call',
    null
  );
  tokenNum++;

  // IN_SERVICE token for SUP queue
  insertToken.run(
    supQueue.id,
    tokenNum,
    `SUP-${String(tokenNum).padStart(3, '0')}`,
    'Eleanor Vance',
    '+1-555-0145',
    'PRIORITY',
    'IN_SERVICE',
    null,
    new Date(Date.now() - 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    new Date(Date.now() - 4 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    null,
    660,
    null,
    null,
    supQueue.counter_name
  );
  tokenNum++;

  // WAITING tokens for SUP queue
  const waitingPersons = [
    { name: 'Alexander Wright', phone: '+1-555-0210', priority: 'VIP' },
    { name: 'Olivia Martin', phone: '+1-555-0211', priority: 'NORMAL' },
    { name: 'Lucas Scott', phone: '+1-555-0212', priority: 'NORMAL' },
    { name: 'Sophia Bennett', phone: '+1-555-0213', priority: 'PRIORITY' },
    { name: 'Ethan Cooper', phone: '+1-555-0214', priority: 'NORMAL' }
  ];

  waitingPersons.forEach((person, idx) => {
    insertToken.run(
      supQueue.id,
      tokenNum,
      `SUP-${String(tokenNum).padStart(3, '0')}`,
      person.name,
      person.phone,
      person.priority,
      'WAITING',
      idx + 1,
      new Date(Date.now() - (waitingPersons.length - idx) * 3 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      null,
      null,
      null,
      null,
      null,
      null
    );
    tokenNum++;
  });

  // Also seed some tokens for BIL queue
  let bilNum = 1;
  insertToken.run(
    bilQueue.id,
    bilNum,
    `BIL-${String(bilNum).padStart(3, '0')}`,
    'Marcus Aurelius',
    '+1-555-0301',
    'NORMAL',
    'IN_SERVICE',
    null,
    new Date(Date.now() - 12 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    new Date(Date.now() - 2 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    null,
    600,
    null,
    null,
    bilQueue.counter_name
  );
  bilNum++;

  ['Clara Oswald', 'Peter Capaldi', 'Rose Tyler'].forEach((name, idx) => {
    insertToken.run(
      bilQueue.id,
      bilNum,
      `BIL-${String(bilNum).padStart(3, '0')}`,
      name,
      '+1-555-0302',
      idx === 0 ? 'VIP' : 'NORMAL',
      'WAITING',
      idx + 1,
      new Date(Date.now() - (3 - idx) * 4 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      null,
      null,
      null,
      null,
      null,
      null
    );
    bilNum++;
  });

  console.log('Seeded sample tokens across queues!');
}

console.log('--- Seeding Completed Successfully! ---');
