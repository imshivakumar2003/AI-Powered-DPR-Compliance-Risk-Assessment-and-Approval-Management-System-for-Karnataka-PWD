"""
Reset all auto-approved DPR statuses back to PENDING.
Run from the TOPLINE-main root: python Backend/scripts/reset_pending.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.project_service import init_project_db, _get_db, get_all_projects

# Ensure new columns exist
init_project_db()
print("DB migrated: reviewed_by, reviewed_at columns added if missing.")

conn = _get_db()
cur = conn.cursor()
cur.execute("SELECT id, status FROM projects")
rows = cur.fetchall()
print(f"Found {len(rows)} project(s). Resetting auto-approved statuses to PENDING...")

for row in rows:
    pid = row["id"]
    status = row["status"]
    if status in ("APPROVED", "NEEDS_REVISION", "GOOD", "PROCESSING"):
        cur.execute(
            "UPDATE projects SET status='PENDING', approval_comment=NULL, reviewed_by=NULL, reviewed_at=NULL WHERE id=?",
            (pid,)
        )
        print(f"  Reset {pid[:8]}... from {status!r} -> PENDING")

conn.commit()
conn.close()

print("\nFinal state:")
for p in get_all_projects():
    print(f"  {p.id[:8]}... title={p.title!r:20s} status={p.status}")

print("\nDone. All DPRs are now PENDING and await manual admin approval.")
