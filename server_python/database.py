import sqlite3
import os
from datetime import datetime, timedelta
import bcrypt

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "queueflow.sqlite")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
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
        FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
    CREATE INDEX IF NOT EXISTS idx_tokens_position ON tokens(queue_id, position);
    """)
    conn.commit()

    # Seed Admin Manager
    admin = cursor.execute("SELECT * FROM managers WHERE username = 'admin'").fetchone()
    if not admin:
        salt = bcrypt.gensalt()
        pw_hash = bcrypt.hashpw(b"admin123", salt).decode('utf-8')
        cursor.execute("INSERT INTO managers (username, password_hash, name) VALUES ('admin', ?, 'Queue Administrator')", (pw_hash,))
        conn.commit()
        admin_id = cursor.lastrowid
    else:
        admin_id = admin["id"]

    # Seed Sample Queues
    q_count = cursor.execute("SELECT COUNT(*) as cnt FROM queues WHERE manager_id = ?", (admin_id,)).fetchone()["cnt"]
    if q_count == 0:
        cursor.execute("""
            INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
            VALUES (?, 'Customer Support & Helpdesk', 'SUP', 'General customer inquiries and assistance', 'Desk 1')
        """, (admin_id,))
        cursor.execute("""
            INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
            VALUES (?, 'Billing & Payments', 'BIL', 'Cash deposits and invoices', 'Cash Counter 2')
        """, (admin_id,))
        cursor.execute("""
            INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
            VALUES (?, 'VIP & Executive Services', 'VIP', 'Priority services for premium clients', 'Executive Suite 4')
        """, (admin_id,))
        conn.commit()

    # Seed Tokens if empty
    t_count = cursor.execute("SELECT COUNT(*) as cnt FROM tokens").fetchone()["cnt"]
    if t_count == 0:
        sup_q = cursor.execute("SELECT id, counter_name FROM queues WHERE code_prefix = 'SUP'").fetchone()
        if sup_q:
            q_id = sup_q["id"]
            now = datetime.utcnow()
            
            # Completed tokens for analytics
            completed_samples = [
                ("Sarah Jenkins", "+1-555-0101", "NORMAL", 320, 410, 5),
                ("Michael Chang", "+1-555-0102", "PRIORITY", 180, 350, 4),
                ("Emily Rodriguez", "+1-555-0103", "NORMAL", 450, 520, 3)
            ]
            num = 1
            for name, phone, prio, wait, serv, h_ago in completed_samples:
                c_time = (now - timedelta(hours=h_ago)).strftime('%Y-%m-%d %H:%M:%S')
                s_time = (now - timedelta(hours=h_ago, seconds=-wait)).strftime('%Y-%m-%d %H:%M:%S')
                e_time = (now - timedelta(hours=h_ago, seconds=-(wait+serv))).strftime('%Y-%m-%d %H:%M:%S')
                cursor.execute("""
                    INSERT INTO tokens (queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position, created_at, service_started_at, service_ended_at, wait_duration_seconds, service_duration_seconds, counter_assigned)
                    VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', NULL, ?, ?, ?, ?, ?, 'Desk 1')
                """, (q_id, num, f"SUP-{num:03d}", name, phone, prio, c_time, s_time, e_time, wait, serv))
                num += 1

            # Serving token
            cursor.execute("""
                INSERT INTO tokens (queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position, created_at, service_started_at, wait_duration_seconds, counter_assigned)
                VALUES (?, ?, ?, 'Eleanor Vance', '+1-555-0145', 'PRIORITY', 'IN_SERVICE', NULL, ?, ?, 600, 'Desk 1')
            """, (q_id, num, f"SUP-{num:03d}", (now - timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S'), (now - timedelta(minutes=5)).strftime('%Y-%m-%d %H:%M:%S')))
            num += 1

            # Waiting tokens
            waiting_samples = [
                ("Alexander Wright", "+1-555-0210", "VIP"),
                ("Olivia Martin", "+1-555-0211", "NORMAL"),
                ("Lucas Scott", "+1-555-0212", "NORMAL"),
                ("Sophia Bennett", "+1-555-0213", "PRIORITY")
            ]
            for idx, (name, phone, prio) in enumerate(waiting_samples):
                cursor.execute("""
                    INSERT INTO tokens (queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'WAITING', ?, ?)
                """, (q_id, num, f"SUP-{num:03d}", name, phone, prio, idx + 1, (now - timedelta(minutes=10 - idx * 2)).strftime('%Y-%m-%d %H:%M:%S')))
                num += 1

            conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Python SQLite database initialized successfully!")
