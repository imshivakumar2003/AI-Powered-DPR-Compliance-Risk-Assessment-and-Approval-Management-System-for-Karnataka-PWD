# app/services/project_service.py

import sqlite3
import os
import uuid
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "Database")
DB_PATH = os.path.join(DB_DIR, "projects.db")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")

class Project(BaseModel):
    id: str
    filename: str               # saved filename on disk
    original_filename: str      # original name
    status: str
    upload_date: str
    estimated_cost: float
    sector: str
    state: str = "Assam"
    title: str = ""
    duration_months: int = 0
    submitted_by: str = ""
    notes: str = ""
    overall_score: Optional[int] = None
    risk_score: Optional[int] = None
    compliance_score: Optional[int] = None
    approval_comment: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    in_approvals: Optional[bool] = False
    reviewer_name: Optional[str] = None
    department: Optional[str] = None

def _get_db() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_project_db():
    """Create all tables if they do not already exist. Never drops data."""
    conn = _get_db()
    cursor = conn.cursor()

    # Main projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            status TEXT NOT NULL,
            upload_date TEXT NOT NULL,
            estimated_cost REAL NOT NULL,
            sector TEXT NOT NULL,
            state TEXT NOT NULL DEFAULT 'Assam',
            title TEXT,
            duration_months INTEGER,
            submitted_by TEXT,
            notes TEXT,
            overall_score INTEGER,
            risk_score INTEGER,
            compliance_score INTEGER,
            approval_comment TEXT
        )
    """)

    # Migrate: add approval_comment column if missing (for existing DBs)
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN approval_comment TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Migrate: add reviewer tracking columns if missing
    for col_def in [
        "reviewed_by TEXT",
        "reviewed_at TEXT",
    ]:
        try:
            cursor.execute(f"ALTER TABLE projects ADD COLUMN {col_def}")
        except sqlite3.OperationalError:
            pass  # Column already exists

    # Persistent analysis cache – stores JSON blobs so scores never change after first run
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_cache (
            project_id TEXT PRIMARY KEY,
            assessment_json TEXT NOT NULL,
            risk_json TEXT NOT NULL,
            compliance_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Category recommendations table (10 rows per DPR)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS category_recommendations (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            confidence INTEGER NOT NULL,
            recommendation TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)

    # Migrate: add in_approvals column if missing
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN in_approvals INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass  # Column already exists

    # ── Application Status: chat-style comment threads ──────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_comments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            author_role TEXT NOT NULL,   -- 'reviewer' | 'user'
            author_name TEXT NOT NULL,
            message TEXT NOT NULL,
            attachment_filename TEXT,    -- optional uploaded file name
            attachment_path TEXT,        -- path on disk
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)

    # ── Application Status: per-user notifications ───────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_notifications (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            recipient_role TEXT NOT NULL,  -- 'user' | 'reviewer'
            recipient_name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)

    # ── Application Status: DPR version history ──────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dpr_versions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            uploaded_by TEXT NOT NULL,
            upload_date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)

    # ── Application Status: full timeline history ────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_timeline (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)

    # Migrate: add reviewer_name / department columns to projects if missing
    for col_def in ["reviewer_name TEXT", "department TEXT"]:
        try:
            cursor.execute(f"ALTER TABLE projects ADD COLUMN {col_def}")
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()


# ── Application Status CRUD ───────────────────────────────────────────────────

def add_comment(project_id: str, author_role: str, author_name: str,
                message: str, attachment_filename: str = None,
                attachment_path: str = None) -> dict:
    """Add a reviewer or user comment to the thread."""
    import uuid as _uuid
    comment_id = str(_uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO app_comments
           (id, project_id, author_role, author_name, message,
            attachment_filename, attachment_path, created_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (comment_id, project_id, author_role, author_name, message,
         attachment_filename, attachment_path, created_at)
    )
    conn.commit()
    conn.close()
    return {
        "id": comment_id, "project_id": project_id,
        "author_role": author_role, "author_name": author_name,
        "message": message, "attachment_filename": attachment_filename,
        "created_at": created_at,
    }


def get_comments(project_id: str) -> List[dict]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM app_comments WHERE project_id=? ORDER BY created_at ASC",
        (project_id,)
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def add_timeline_event(project_id: str, event_type: str, title: str,
                       description: str, actor_name: str, actor_role: str) -> dict:
    import uuid as _uuid
    event_id = str(_uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO app_timeline
           (id, project_id, event_type, title, description, actor_name, actor_role, created_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (event_id, project_id, event_type, title, description, actor_name, actor_role, created_at)
    )
    conn.commit()
    conn.close()
    return {
        "id": event_id, "project_id": project_id, "event_type": event_type,
        "title": title, "description": description,
        "actor_name": actor_name, "actor_role": actor_role, "created_at": created_at,
    }


def get_timeline(project_id: str) -> List[dict]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM app_timeline WHERE project_id=? ORDER BY created_at ASC",
        (project_id,)
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def add_notification(project_id: str, recipient_role: str, recipient_name: str,
                     event_type: str, message: str) -> dict:
    import uuid as _uuid
    notif_id = str(_uuid.uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO app_notifications
           (id, project_id, recipient_role, recipient_name, event_type, message, is_read, created_at)
           VALUES (?,?,?,?,?,?,0,?)""",
        (notif_id, project_id, recipient_role, recipient_name, event_type, message, created_at)
    )
    conn.commit()
    conn.close()
    return {"id": notif_id, "event_type": event_type, "message": message, "created_at": created_at}


def get_notifications(recipient_role: str, project_id: str = None) -> List[dict]:
    conn = _get_db()
    cursor = conn.cursor()
    if project_id:
        cursor.execute(
            "SELECT * FROM app_notifications WHERE recipient_role=? AND project_id=? ORDER BY created_at DESC",
            (recipient_role, project_id)
        )
    else:
        cursor.execute(
            "SELECT * FROM app_notifications WHERE recipient_role=? ORDER BY created_at DESC",
            (recipient_role,)
        )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def mark_notifications_read(project_id: str, recipient_role: str) -> None:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE app_notifications SET is_read=1 WHERE project_id=? AND recipient_role=?",
        (project_id, recipient_role)
    )
    conn.commit()
    conn.close()


def add_dpr_version(project_id: str, file_bytes: bytes, original_filename: str,
                    uploaded_by: str, notes: str = "") -> dict:
    import uuid as _uuid
    version_id = str(_uuid.uuid4())
    upload_date = datetime.utcnow().isoformat() + "Z"

    # Get next version number
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(version_number) FROM dpr_versions WHERE project_id=?", (project_id,))
    row = cursor.fetchone()
    last_version = row[0] if row[0] else 0
    version_number = last_version + 1

    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(original_filename)[1]
    saved_name = f"{version_id}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    cursor.execute(
        """INSERT INTO dpr_versions
           (id, project_id, version_number, filename, original_filename, uploaded_by, upload_date, notes)
           VALUES (?,?,?,?,?,?,?,?)""",
        (version_id, project_id, version_number, saved_name, original_filename,
         uploaded_by, upload_date, notes)
    )
    conn.commit()
    conn.close()

    return {
        "id": version_id, "project_id": project_id, "version_number": version_number,
        "original_filename": original_filename, "uploaded_by": uploaded_by,
        "upload_date": upload_date, "notes": notes,
    }


def get_dpr_versions(project_id: str) -> List[dict]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM dpr_versions WHERE project_id=? ORDER BY version_number ASC",
        (project_id,)
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def ensure_upload_timeline(project_id: str) -> None:
    """Ensure every project has at least an 'uploaded' event in the timeline."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM app_timeline WHERE project_id=? AND event_type='upload'", (project_id,))
    count = cursor.fetchone()[0]
    conn.close()
    if count == 0:
        p = get_project_by_id(project_id)
        if p:
            add_timeline_event(project_id, "upload", "DPR Uploaded",
                               f"DPR '{p.title or p.original_filename}' submitted for review.",
                               p.submitted_by or "User", "user")

# ── Project CRUD ──────────────────────────────────────────────────────────────

def create_project(file_bytes: bytes, original_filename: str, title: str, state: str,
                   sector: str, cost_crores: float, duration_months: int,
                   submitted_by: str, notes: str = "") -> Project:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(original_filename)[1]
    saved_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    project_id = str(uuid.uuid4())
    upload_date = datetime.utcnow().isoformat() + "Z"

    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO projects (id, filename, original_filename, status, upload_date,
           estimated_cost, sector, state, title, duration_months, submitted_by, notes)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (project_id, saved_filename, original_filename, "PENDING", upload_date,
         cost_crores, sector, state, title, duration_months, submitted_by, notes)
    )
    conn.commit()
    conn.close()

    return Project(
        id=project_id,
        filename=saved_filename,
        original_filename=original_filename,
        status="PENDING",
        upload_date=upload_date,
        estimated_cost=cost_crores,
        sector=sector,
        state=state,
        title=title,
        duration_months=duration_months,
        submitted_by=submitted_by,
        notes=notes
    )

def get_all_projects() -> List[Project]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY upload_date DESC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        d['in_approvals'] = bool(d.get('in_approvals', 0))
        result.append(Project(**d))
    return result

def get_project_by_id(project_id: str) -> Optional[Project]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['in_approvals'] = bool(d.get('in_approvals', 0))
        return Project(**d)
    return None

def update_project_scores(project_id: str, overall_score: int, risk_score: int,
                           compliance_score: int, status: Optional[str] = None) -> None:
    """Persist computed analysis scores into the projects table.
    If status is None, the current status is left unchanged (never auto-approve)."""
    conn = _get_db()
    cursor = conn.cursor()
    if status is not None:
        cursor.execute(
            """UPDATE projects
               SET overall_score=?, risk_score=?, compliance_score=?, status=?
               WHERE id=?""",
            (overall_score, risk_score, compliance_score, status, project_id)
        )
    else:
        # Only update score columns, leave status untouched
        cursor.execute(
            """UPDATE projects
               SET overall_score=?, risk_score=?, compliance_score=?
               WHERE id=?""",
            (overall_score, risk_score, compliance_score, project_id)
        )
    conn.commit()
    conn.close()

def approve_project(project_id: str, decision: str, comment: str,
                    reviewed_by: str = "Admin") -> bool:
    """
    Set project status to APPROVED, REJECTED, or PENDING and persist reviewer details.
    Returns False if project not found.
    """
    status_map = {"approve": "APPROVED", "reject": "REJECTED", "pending": "PENDING"}
    new_status = status_map.get(decision.lower())
    if not new_status:
        return False
    from datetime import datetime
    reviewed_at = datetime.utcnow().isoformat() + "Z"
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """UPDATE projects
           SET status=?, approval_comment=?, reviewed_by=?, reviewed_at=?
           WHERE id=?""",
        (new_status, comment, reviewed_by, reviewed_at, project_id)
    )
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated > 0

# ── Analysis Cache ─────────────────────────────────────────────────────────────

def get_cached_analysis(project_id: str) -> Optional[Dict[str, Any]]:
    """Return previously saved assessment/risk/compliance JSON, or None."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_cache WHERE project_id=?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "assessment": json.loads(row["assessment_json"]),
            "risk":       json.loads(row["risk_json"]),
            "compliance": json.loads(row["compliance_json"]),
        }
    return None

def save_analysis_cache(project_id: str, assessment: dict, risk: dict, compliance: dict) -> None:
    """Persist analysis results so they are returned unchanged on future requests."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT OR REPLACE INTO analysis_cache
           (project_id, assessment_json, risk_json, compliance_json, created_at)
           VALUES (?,?,?,?,?)""",
        (project_id, json.dumps(assessment), json.dumps(risk),
         json.dumps(compliance), datetime.utcnow().isoformat() + "Z")
    )
    conn.commit()
    conn.close()


def clear_analysis_cache(project_id: str) -> None:
    """Remove cached analysis for a project so it will be regenerated on next request."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM analysis_cache WHERE project_id=?", (project_id,))
    conn.commit()
    conn.close()


# ── Category Recommendations ────────────────────────────────────────────────────

def save_category_recommendations(project_id: str, recommendations: List[Dict[str, Any]]) -> None:
    """Save 10 category recommendation rows for a project. Replaces any existing rows."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM category_recommendations WHERE project_id=?", (project_id,))
    now = datetime.utcnow().isoformat() + "Z"
    for rec in recommendations:
        cursor.execute(
            """INSERT INTO category_recommendations
               (id, project_id, category, status, confidence, recommendation, reason, created_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), project_id, rec["category"], rec["status"],
             rec["confidence"], rec["recommendation"], rec["reason"], now)
        )
    conn.commit()
    conn.close()


def get_category_recommendations(project_id: str) -> List[Dict[str, Any]]:
    """Return saved category recommendations for a project, ordered by rowid."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM category_recommendations WHERE project_id=? ORDER BY rowid",
        (project_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def mark_in_approvals(project_id: str) -> bool:
    """Set in_approvals=1 for a project. Returns False if project not found."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET in_approvals=1 WHERE id=?", (project_id,))
    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated > 0


def is_in_approvals(project_id: str) -> bool:
    """Return True if the project has been sent to approvals."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT in_approvals FROM projects WHERE id=?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return bool(row["in_approvals"])
    return False


# Initialise on import
init_project_db()