# TOPLINE - DPR Templates Service
import os
import sqlite3
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
DB_PATH = os.path.join(DB_DIR, "dpr.db")
TEMPLATE_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "templates")

os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(TEMPLATE_STORAGE_DIR, exist_ok=True)

class DprTemplate(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    category: str = "General"
    filename: str
    original_filename: str
    version: str = "v1.0"
    is_active: int = 1
    uploaded_by: str = "Admin"
    created_at: str
    updated_at: str

def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_template_db():
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dpr_templates (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'General',
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            version TEXT DEFAULT 'v1.0',
            is_active INTEGER DEFAULT 1,
            uploaded_by TEXT DEFAULT 'Admin',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_template_db()

def _row_to_template(row) -> DprTemplate:
    d = dict(row)
    return DprTemplate(**d)

def create_template(
    title: str,
    description: str,
    category: str,
    filename: str,
    original_filename: str,
    version: str = "v1.0",
    uploaded_by: str = "Admin"
) -> DprTemplate:
    template_id = f"TMPL-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO dpr_templates
           (id, title, description, category, filename, original_filename, version, is_active, uploaded_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)""",
        (template_id, title, description, category, filename, original_filename, version, uploaded_by, now_iso, now_iso)
    )
    conn.commit()
    conn.close()
    
    # Broadcast notification to users
    try:
        from app.services.project_service import add_notification
        add_notification(
            project_id=template_id,
            recipient_role="user",
            recipient_name="All Users",
            event_type="template_new",
            message=f"New DPR Template uploaded: '{title}' ({version}) for {category} projects."
        )
    except Exception as e:
        print("Failed to trigger template creation notification:", e)
        
    return get_template_by_id(template_id)

def get_templates(active_only: bool = False) -> List[DprTemplate]:
    conn = _get_db()
    cursor = conn.cursor()
    if active_only:
        cursor.execute("SELECT * FROM dpr_templates WHERE is_active = 1 ORDER BY updated_at DESC")
    else:
        cursor.execute("SELECT * FROM dpr_templates ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_template(r) for r in rows]

def get_template_by_id(template_id: str) -> Optional[DprTemplate]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dpr_templates WHERE id = ?", (template_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return _row_to_template(row)
    return None

def update_template(
    template_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    version: Optional[str] = None,
    new_filename: Optional[str] = None,
    new_original_filename: Optional[str] = None
) -> Optional[DprTemplate]:
    template = get_template_by_id(template_id)
    if not template:
        return None
        
    now_iso = datetime.utcnow().isoformat() + "Z"
    new_title = title if title is not None else template.title
    new_desc = description if description is not None else template.description
    new_cat = category if category is not None else template.category
    new_ver = version if version is not None else template.version
    fn = new_filename if new_filename is not None else template.filename
    orig_fn = new_original_filename if new_original_filename is not None else template.original_filename
    
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """UPDATE dpr_templates
           SET title=?, description=?, category=?, version=?, filename=?, original_filename=?, updated_at=?
           WHERE id=?""",
        (new_title, new_desc, new_cat, new_ver, fn, orig_fn, now_iso, template_id)
    )
    conn.commit()
    conn.close()
    
    # Broadcast update notification
    try:
        from app.services.project_service import add_notification
        add_notification(
            project_id=template_id,
            recipient_role="user",
            recipient_name="All Users",
            event_type="template_update",
            message=f"DPR Template updated: '{new_title}' ({new_ver}) has been updated by Admin."
        )
    except Exception as e:
        print("Failed to trigger template update notification:", e)
        
    return get_template_by_id(template_id)

def set_template_status(template_id: str, is_active: bool) -> Optional[DprTemplate]:
    template = get_template_by_id(template_id)
    if not template:
        return None
        
    now_iso = datetime.utcnow().isoformat() + "Z"
    val = 1 if is_active else 0
    
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE dpr_templates SET is_active=?, updated_at=? WHERE id=?",
        (val, now_iso, template_id)
    )
    conn.commit()
    conn.close()
    
    status_str = "activated" if is_active else "deactivated"
    try:
        from app.services.project_service import add_notification
        add_notification(
            project_id=template_id,
            recipient_role="user",
            recipient_name="All Users",
            event_type="template_status",
            message=f"DPR Template status changed: '{template.title}' is now {status_str}."
        )
    except Exception as e:
        print("Failed to trigger template status notification:", e)
        
    return get_template_by_id(template_id)

def delete_template(template_id: str) -> bool:
    template = get_template_by_id(template_id)
    if not template:
        return False
        
    # Delete file from disk if exists
    file_path = os.path.join(TEMPLATE_STORAGE_DIR, template.filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print("Error removing template file from disk:", e)
            
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM dpr_templates WHERE id = ?", (template_id,))
    conn.commit()
    conn.close()
    return True
