import os
from typing import Optional, List
from datetime import datetime
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database import init_db, get_db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_manager
)

# Initialize Database & Seed
init_db()

app = FastAPI(
    title="QueueFlow — Smart Queue Management API",
    description="Python FastAPI backend powering real-time token dispatch, queue reordering, and operational analytics.",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Pydantic Models -----------------
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str

class QueueCreateRequest(BaseModel):
    name: str
    code_prefix: Optional[str] = None
    description: Optional[str] = None
    counter_name: Optional[str] = "Counter 1"

class TokenCreateRequest(BaseModel):
    queue_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    priority: Optional[str] = "NORMAL"

class ServeNextRequest(BaseModel):
    counter_name: Optional[str] = None

class CancelTokenRequest(BaseModel):
    reason: Optional[str] = "Cancelled by manager"

# Helper to compact waiting queue positions 1..N
def compact_queue_positions(conn, queue_id: int):
    tokens = conn.execute(
        "SELECT id FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC, id ASC",
        (queue_id,)
    ).fetchall()
    for idx, t in enumerate(tokens):
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (idx + 1, t["id"]))
    conn.commit()

# ----------------- Health Check -----------------
@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "Python FastAPI", "timestamp": datetime.utcnow().isoformat()}

# ----------------- Auth Endpoints -----------------
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    if len(req.username.strip()) < 3 or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Invalid username or password length")

    conn = get_db()
    existing = conn.execute("SELECT id FROM managers WHERE LOWER(username) = LOWER(?)", (req.username.strip(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Username is already taken")

    pw_hash = hash_password(req.password)
    cur = conn.cursor()
    cur.execute("INSERT INTO managers (username, password_hash, name) VALUES (?, ?, ?)",
                (req.username.strip(), pw_hash, req.name.strip()))
    conn.commit()
    m_id = cur.lastrowid
    conn.close()

    token = create_access_token({"id": m_id, "username": req.username.strip(), "name": req.name.strip()})
    return {
        "message": "Registration successful",
        "token": token,
        "manager": {"id": m_id, "username": req.username.strip(), "name": req.name.strip()}
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    manager = conn.execute("SELECT * FROM managers WHERE LOWER(username) = LOWER(?)", (req.username.strip(),)).fetchone()
    conn.close()

    if not manager or not verify_password(req.password, manager["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"id": manager["id"], "username": manager["username"], "name": manager["name"]})
    return {
        "message": "Login successful",
        "token": token,
        "manager": {"id": manager["id"], "username": manager["username"], "name": manager["name"]}
    }

@app.post("/api/auth/demo")
def demo_login():
    conn = get_db()
    manager = conn.execute("SELECT * FROM managers WHERE username = 'admin'").fetchone()
    conn.close()
    if not manager:
        raise HTTPException(status_code=500, detail="Demo account missing")

    token = create_access_token({"id": manager["id"], "username": manager["username"], "name": manager["name"]})
    return {
        "message": "Demo login successful",
        "token": token,
        "manager": {"id": manager["id"], "username": manager["username"], "name": manager["name"]}
    }

@app.get("/api/auth/me")
def get_me(current_manager: dict = Depends(get_current_manager)):
    return {"manager": current_manager}

# ----------------- Queue Endpoints -----------------
@app.get("/api/queues")
def list_queues(current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    queues = conn.execute("""
        SELECT 
            q.*,
            COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_count,
            COUNT(CASE WHEN t.status = 'IN_SERVICE' THEN 1 END) as serving_count,
            COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_count,
            COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled_count,
            (SELECT t2.token_code FROM tokens t2 WHERE t2.queue_id = q.id AND t2.status = 'IN_SERVICE' ORDER BY t2.service_started_at DESC LIMIT 1) as current_serving_token,
            (SELECT t3.customer_name FROM tokens t3 WHERE t3.queue_id = q.id AND t3.status = 'IN_SERVICE' ORDER BY t3.service_started_at DESC LIMIT 1) as current_serving_customer
        FROM queues q
        LEFT JOIN tokens t ON q.id = t.queue_id
        WHERE q.manager_id = ? AND q.is_active = 1
        GROUP BY q.id
        ORDER BY q.created_at ASC
    """, (current_manager["id"],)).fetchall()
    conn.close()
    return {"queues": [dict(q) for q in queues]}

@app.post("/api/queues", status_code=status.HTTP_201_CREATED)
def create_queue(req: QueueCreateRequest, current_manager: dict = Depends(get_current_manager)):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Queue name is required")

    prefix = (req.code_prefix or req.name[:3]).strip().upper()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO queues (manager_id, name, code_prefix, description, counter_name)
        VALUES (?, ?, ?, ?, ?)
    """, (current_manager["id"], req.name.strip(), prefix, req.description, req.counter_name or "Counter 1"))
    conn.commit()
    new_id = cur.lastrowid
    new_q = conn.execute("SELECT * FROM queues WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    return {"message": "Queue created successfully", "queue": dict(new_q)}

@app.get("/api/queues/public/{queue_id}")
def get_public_queue(queue_id: int):
    conn = get_db()
    queue = conn.execute("SELECT id, name, code_prefix, counter_name FROM queues WHERE id = ? AND is_active = 1", (queue_id,)).fetchone()
    if not queue:
        conn.close()
        raise HTTPException(status_code=404, detail="Queue not found")

    serving = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'IN_SERVICE' ORDER BY service_started_at DESC", (queue_id,)).fetchall()
    waiting = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC LIMIT 10", (queue_id,)).fetchall()
    total_waiting = conn.execute("SELECT COUNT(*) as cnt FROM tokens WHERE queue_id = ? AND status = 'WAITING'", (queue_id,)).fetchone()["cnt"]
    conn.close()

    return {
        "queue": dict(queue),
        "serving": [dict(s) for s in serving],
        "waiting": [dict(w) for w in waiting],
        "totalWaiting": total_waiting
    }

# ----------------- Token Endpoints -----------------
@app.get("/api/tokens/queue/{queue_id}")
def get_queue_tokens(queue_id: int, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    queue = conn.execute("SELECT * FROM queues WHERE id = ? AND manager_id = ?", (queue_id, current_manager["id"])).fetchone()
    if not queue:
        conn.close()
        raise HTTPException(status_code=404, detail="Queue not found")

    waiting = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC", (queue_id,)).fetchall()
    serving = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'IN_SERVICE' ORDER BY service_started_at DESC", (queue_id,)).fetchall()
    history = conn.execute("""
        SELECT * FROM tokens WHERE queue_id = ? AND status IN ('COMPLETED', 'CANCELLED')
        ORDER BY COALESCE(service_ended_at, created_at) DESC LIMIT 15
    """, (queue_id,)).fetchall()
    conn.close()

    return {
        "queue": dict(queue),
        "waiting": [dict(w) for w in waiting],
        "serving": [dict(s) for s in serving],
        "recentHistory": [dict(h) for h in history]
    }

@app.post("/api/tokens", status_code=status.HTTP_201_CREATED)
def add_token(req: TokenCreateRequest, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    queue = conn.execute("SELECT * FROM queues WHERE id = ? AND manager_id = ?", (req.queue_id, current_manager["id"])).fetchone()
    if not queue:
        conn.close()
        raise HTTPException(status_code=404, detail="Queue not found")

    last = conn.execute("SELECT MAX(token_number) as max_num FROM tokens WHERE queue_id = ?", (req.queue_id,)).fetchone()
    token_num = (last["max_num"] or 0) + 1
    token_code = f"{queue['code_prefix']}-{token_num:03d}"

    max_pos = conn.execute("SELECT MAX(position) as max_pos FROM tokens WHERE queue_id = ? AND status = 'WAITING'", (req.queue_id,)).fetchone()
    next_pos = (max_pos["max_pos"] or 0) + 1

    cur = conn.cursor()
    cur.execute("""
        INSERT INTO tokens (queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position)
        VALUES (?, ?, ?, ?, ?, ?, 'WAITING', ?)
    """, (req.queue_id, token_num, token_code, req.customer_name.strip(), req.customer_phone, req.priority.upper(), next_pos))
    conn.commit()
    new_token_id = cur.lastrowid
    new_t = conn.execute("SELECT * FROM tokens WHERE id = ?", (new_token_id,)).fetchone()
    conn.close()

    return {"message": f"Token {token_code} generated successfully", "token": dict(new_t)}

# Move Token Up (Requirement 5)
@app.post("/api/tokens/{token_id}/move-up")
def move_token_up(token_id: int, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    token = conn.execute("SELECT t.*, q.manager_id FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE t.id = ?", (token_id,)).fetchone()
    if not token or token["manager_id"] != current_manager["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")

    if token["status"] != "WAITING" or token["position"] <= 1:
        conn.close()
        return {"message": "Already at top"}

    prev_token = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' AND position = ?", (token["queue_id"], token["position"] - 1)).fetchone()
    if prev_token:
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (token["position"] - 1, token["id"]))
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (token["position"], prev_token["id"]))
        conn.commit()
    else:
        compact_queue_positions(conn, token["queue_id"])
    conn.close()
    return {"message": "Token moved up successfully"}

# Move Token Down (Requirement 5)
@app.post("/api/tokens/{token_id}/move-down")
def move_token_down(token_id: int, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    token = conn.execute("SELECT t.*, q.manager_id FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE t.id = ?", (token_id,)).fetchone()
    if not token or token["manager_id"] != current_manager["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")

    next_token = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' AND position = ?", (token["queue_id"], token["position"] + 1)).fetchone()
    if next_token:
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (token["position"] + 1, token["id"]))
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (token["position"], next_token["id"]))
        conn.commit()
    conn.close()
    return {"message": "Token moved down successfully"}

# Assign top token for service (Requirement 6)
@app.post("/api/tokens/queue/{queue_id}/serve-next")
def serve_next_token(queue_id: int, req: ServeNextRequest = None, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    queue = conn.execute("SELECT * FROM queues WHERE id = ? AND manager_id = ?", (queue_id, current_manager["id"])).fetchone()
    if not queue:
        conn.close()
        raise HTTPException(status_code=404, detail="Queue not found")

    top_token = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' ORDER BY position ASC, id ASC LIMIT 1", (queue_id,)).fetchone()
    if not top_token:
        conn.close()
        raise HTTPException(status_code=400, detail="No tokens currently waiting in queue")

    created = datetime.fromisoformat(top_token["created_at"].replace(' ', 'T'))
    wait_secs = max(0, int((datetime.utcnow() - created).total_seconds()))
    counter = (req.counter_name if req and req.counter_name else None) or queue["counter_name"] or "Counter 1"

    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute("""
        UPDATE tokens
        SET status = 'IN_SERVICE', position = NULL, service_started_at = ?, wait_duration_seconds = ?, counter_assigned = ?
        WHERE id = ?
    """, (now_str, wait_secs, counter, top_token["id"]))
    compact_queue_positions(conn, queue_id)
    served = conn.execute("SELECT * FROM tokens WHERE id = ?", (top_token["id"],)).fetchone()
    conn.close()

    return {"message": f"Token {served['token_code']} assigned to {counter}", "token": dict(served)}

# Complete service
@app.post("/api/tokens/{token_id}/complete")
def complete_token(token_id: int, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    token = conn.execute("SELECT t.*, q.manager_id FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE t.id = ?", (token_id,)).fetchone()
    if not token or token["manager_id"] != current_manager["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")

    start_str = token["service_started_at"] or token["created_at"]
    start_dt = datetime.fromisoformat(start_str.replace(' ', 'T'))
    serv_secs = max(1, int((datetime.utcnow() - start_dt).total_seconds()))
    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute("""
        UPDATE tokens SET status = 'COMPLETED', service_ended_at = ?, service_duration_seconds = ? WHERE id = ?
    """, (now_str, serv_secs, token_id))
    conn.commit()
    completed = conn.execute("SELECT * FROM tokens WHERE id = ?", (token_id,)).fetchone()
    conn.close()

    return {"message": f"Service completed for {completed['token_code']}", "token": dict(completed)}

# Cancel token (Requirement 7)
@app.post("/api/tokens/{token_id}/cancel")
def cancel_token(token_id: int, req: CancelTokenRequest = None, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    token = conn.execute("SELECT t.*, q.manager_id FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE t.id = ?", (token_id,)).fetchone()
    if not token or token["manager_id"] != current_manager["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")

    reason = (req.reason if req and req.reason else "Cancelled by queue manager")
    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute("""
        UPDATE tokens SET status = 'CANCELLED', position = NULL, service_ended_at = ?, cancellation_reason = ? WHERE id = ?
    """, (now_str, reason, token_id))
    compact_queue_positions(conn, token["queue_id"])
    cancelled = conn.execute("SELECT * FROM tokens WHERE id = ?", (token_id,)).fetchone()
    conn.close()

    return {"message": f"Token {cancelled['token_code']} cancelled", "token": dict(cancelled)}

# Recall token (increments recall_count and re-announces)
@app.post("/api/tokens/{token_id}/recall")
def recall_token(token_id: int, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    token = conn.execute("SELECT t.*, q.manager_id FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE t.id = ?", (token_id,)).fetchone()
    if not token or token["manager_id"] != current_manager["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")

    cur_recall = (token["recall_count"] or 0) + 1
    conn.execute("UPDATE tokens SET recall_count = ? WHERE id = ?", (cur_recall, token_id))
    conn.commit()
    updated = conn.execute("SELECT * FROM tokens WHERE id = ?", (token_id,)).fetchone()
    conn.close()

    return {"message": f"Token {updated['token_code']} recalled (Call #{cur_recall})", "token": dict(updated)}

# Skip token (moves down in queue)
@app.post("/api/tokens/{token_id}/skip")
def skip_token(token_id: int, current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    token = conn.execute("SELECT t.*, q.manager_id FROM tokens t JOIN queues q ON t.queue_id = q.id WHERE t.id = ?", (token_id,)).fetchone()
    if not token or token["manager_id"] != current_manager["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")

    next_t = conn.execute("SELECT * FROM tokens WHERE queue_id = ? AND status = 'WAITING' AND position = ?", (token["queue_id"], token["position"] + 1)).fetchone()
    if next_t:
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (token["position"] + 1, token["id"]))
        conn.execute("UPDATE tokens SET position = ? WHERE id = ?", (token["position"], next_t["id"]))
        conn.commit()
    conn.close()
    return {"message": f"Token {token['token_code']} skipped"}

# Customer Self-Service: Public Token Generation
@app.post("/api/tokens/public-generate", status_code=status.HTTP_201_CREATED)
def public_generate_token(req: TokenCreateRequest):
    conn = get_db()
    queue = conn.execute("SELECT * FROM queues WHERE id = ? AND is_active = 1", (req.queue_id,)).fetchone()
    if not queue:
        conn.close()
        raise HTTPException(status_code=404, detail="Active queue not found")

    last = conn.execute("SELECT MAX(token_number) as max_num FROM tokens WHERE queue_id = ?", (req.queue_id,)).fetchone()
    token_num = (last["max_num"] or 0) + 1
    token_code = f"{queue['code_prefix']}-{token_num:03d}"

    max_pos = conn.execute("SELECT MAX(position) as max_pos FROM tokens WHERE queue_id = ? AND status = 'WAITING'", (req.queue_id,)).fetchone()
    next_pos = (max_pos["max_pos"] or 0) + 1

    cur = conn.cursor()
    cur.execute("""
        INSERT INTO tokens (queue_id, token_number, token_code, customer_name, customer_phone, priority, status, position)
        VALUES (?, ?, ?, ?, ?, ?, 'WAITING', ?)
    """, (req.queue_id, token_num, token_code, req.customer_name.strip(), req.customer_phone, (req.priority or "NORMAL").upper(), next_pos))
    conn.commit()
    new_token = conn.execute("SELECT * FROM tokens WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()

    est_wait = max(1, (next_pos - 1) * 3)
    return {
        "message": f"Your Token {token_code} is confirmed!",
        "token": dict(new_token),
        "queue": {"id": queue["id"], "name": queue["name"], "counter_name": queue["counter_name"]},
        "position": next_pos,
        "estimatedWaitMinutes": est_wait
    }

# Customer Tracking: Check status of specific token code
@app.get("/api/tokens/public-track/{code}")
def public_track_token(code: str):
    conn = get_db()
    token = conn.execute("""
        SELECT t.*, q.name as queue_name, q.counter_name
        FROM tokens t
        JOIN queues q ON t.queue_id = q.id
        WHERE UPPER(t.token_code) = ?
        ORDER BY t.created_at DESC LIMIT 1
    """, (code.strip().upper(),)).fetchone()
    conn.close()

    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    people_ahead = max(0, (token["position"] or 1) - 1) if token["status"] == "WAITING" else 0
    est_wait = max(2, people_ahead * 3) if token["status"] == "WAITING" else 0

    return {
        "token": dict(token),
        "peopleAhead": people_ahead,
        "estimatedWaitMinutes": est_wait,
        "isNowServing": token["status"] == "IN_SERVICE"
    }

# ----------------- Analytics Dashboard (Requirement 8) -----------------
@app.get("/api/analytics")
def get_analytics(queue_id: Optional[int] = None, period: str = "all", current_manager: dict = Depends(get_current_manager)):
    conn = get_db()
    manager_id = current_manager["id"]

    filter_sql = ""
    params = [manager_id]
    if queue_id:
        filter_sql += " AND t.queue_id = ?"
        params.append(queue_id)

    metrics = conn.execute(f"""
        SELECT 
            COUNT(t.id) as total_tokens,
            COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_count,
            COUNT(CASE WHEN t.status = 'IN_SERVICE' THEN 1 END) as serving_count,
            COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_count,
            COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled_count,
            ROUND(AVG(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds / 60.0 END), 1) as avg_wait_min,
            ROUND(AVG(CASE WHEN t.service_duration_seconds IS NOT NULL THEN t.service_duration_seconds / 60.0 END), 1) as avg_service_min
        FROM tokens t
        JOIN queues q ON t.queue_id = q.id
        WHERE q.manager_id = ? {filter_sql}
    """, params).fetchone()

    # Hourly trends
    hourly = conn.execute(f"""
        SELECT 
            strftime('%H:00', t.created_at) as hour,
            COUNT(t.id) as arrivals,
            COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as served,
            COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END) as cancelled
        FROM tokens t
        JOIN queues q ON t.queue_id = q.id
        WHERE q.manager_id = ? {filter_sql}
        GROUP BY hour
        ORDER BY hour ASC
    """, params).fetchall()

    # Queue Comparison
    queue_comp = conn.execute("""
        SELECT 
            q.id, q.name, q.code_prefix,
            COUNT(t.id) as total_tokens,
            COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as waiting_now,
            COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tokens,
            ROUND(AVG(CASE WHEN t.wait_duration_seconds IS NOT NULL THEN t.wait_duration_seconds / 60.0 END), 1) as avg_wait_min,
            ROUND(AVG(CASE WHEN t.service_duration_seconds IS NOT NULL THEN t.service_duration_seconds / 60.0 END), 1) as avg_service_min
        FROM queues q
        LEFT JOIN tokens t ON q.id = t.queue_id
        WHERE q.manager_id = ? AND q.is_active = 1
        GROUP BY q.id
    """, (manager_id,)).fetchall()
    conn.close()

    total_tokens = metrics["total_tokens"] or 0
    waiting_count = metrics["waiting_count"] or 0
    serving_count = metrics["serving_count"] or 0
    completed_count = metrics["completed_count"] or 0
    cancelled_count = metrics["cancelled_count"] or 0
    finished = completed_count + cancelled_count
    cancellation_rate = round((cancelled_count / finished * 100)) if finished > 0 else 0

    return {
        "summary": {
            "totalTokens": total_tokens,
            "waitingCount": waiting_count,
            "servingCount": serving_count,
            "completedCount": completed_count,
            "cancelledCount": cancelled_count,
            "avgWaitMinutes": metrics["avg_wait_min"] or 3.2,
            "avgServiceMinutes": metrics["avg_service_min"] or 4.5,
            "cancellationRate": cancellation_rate
        },
        "hourlyTrends": [dict(h) for h in hourly],
        "queueComparison": [dict(c) for c in queue_comp],
        "statusBreakdown": [
            {"name": "Waiting", "value": waiting_count, "color": "#3B82F6"},
            {"name": "In Service", "value": serving_count, "color": "#10B981"},
            {"name": "Completed", "value": completed_count, "color": "#6366F1"},
            {"name": "Cancelled", "value": cancelled_count, "color": "#EF4444"}
        ]
    }

@app.get("/api/analytics/export")
def export_analytics_csv(current_manager: dict = Depends(get_current_manager)):
    from fastapi.responses import Response
    conn = get_db()
    tokens = conn.execute("""
        SELECT 
            t.token_code, t.customer_name, t.customer_phone, q.name as queue_name,
            t.priority, t.status, t.position, t.wait_duration_seconds,
            t.service_duration_seconds, t.counter_assigned, t.cancellation_reason,
            t.created_at, t.service_started_at, t.service_ended_at
        FROM tokens t
        JOIN queues q ON t.queue_id = q.id
        WHERE q.manager_id = ?
        ORDER BY t.created_at DESC
    """, (current_manager["id"],)).fetchall()
    conn.close()

    headers = [
        "Token Code", "Customer Name", "Phone", "Queue Name", "Priority", "Status",
        "Position", "Wait Time (sec)", "Service Time (sec)", "Counter",
        "Cancellation Reason", "Created At", "Service Started At", "Service Ended At"
    ]
    lines = [",".join(headers)]
    for t in tokens:
        row = [f'"{str(val or "").replace(chr(34), chr(34)+chr(34))}"' for val in t]
        lines.append(",".join(row))

    csv_data = "\n".join(lines)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="queueflow_report_{datetime.utcnow().strftime("%Y-%m-%d")}.csv"'}
    )

# ----------------- Serve Frontend Static Build -----------------
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "dist"))
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404)
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

if __name__ == "__main__":
    print("=" * 55)
    print("Starting QueueFlow Python FastAPI Server on http://localhost:8000")
    print("Interactive Swagger API Docs available at http://localhost:8000/docs")
    print("=" * 55)
    app_dir = os.path.dirname(os.path.abspath(__file__))
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, app_dir=app_dir)
