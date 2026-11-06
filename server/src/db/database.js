const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'queueflow.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS queues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code_prefix TEXT NOT NULL DEFAULT 'Q',
    description TEXT,
    counter_name TEXT DEFAULT 'Counter 1',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id INTEGER NOT NULL,
    token_number INTEGER NOT NULL,
    token_code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    priority TEXT DEFAULT 'NORMAL',
    status TEXT NOT NULL DEFAULT 'WAITING',
    position INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    service_started_at TEXT,
    service_ended_at TEXT,
    wait_duration_seconds INTEGER,
    service_duration_seconds INTEGER,
    cancellation_reason TEXT,
    counter_assigned TEXT,
    recall_count INTEGER DEFAULT 0,
    FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
  CREATE INDEX IF NOT EXISTS idx_tokens_position ON tokens(queue_id, position);
  CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at);
`);

try {
  db.exec('ALTER TABLE tokens ADD COLUMN recall_count INTEGER DEFAULT 0;');
} catch (e) {
  // column already exists
}

module.exports = db;
