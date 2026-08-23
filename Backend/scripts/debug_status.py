import traceback
from app.services.project_service import get_all_projects
from main import ensure_upload_timeline, _status_step

try:
    projects = get_all_projects(username="admin_user", role="admin")
    print(f"Projects count: {len(projects)}")
    for p in projects:
        ensure_upload_timeline(p.id)
        steps = ["DPR Uploaded", "AI Analysis", "Under Review", "Pending Info", "Decision"]
        step_idx = _status_step(p.status)
        progress_pct = round((step_idx + 1) / len(steps) * 100)
        item = {
            "id": p.id,
            "title": p.title or p.original_filename,
            "original_filename": p.original_filename,
            "district": p.state,
            "sector": p.sector,
            "department": getattr(p, 'department', None) or "Karnataka PWD",
            "submitted_by": p.submitted_by or "User",
            "upload_date": p.upload_date,
            "status": p.status,
            "reviewed_by": getattr(p, 'reviewed_by', None),
            "reviewer_name": getattr(p, 'reviewer_name', None),
            "reviewed_at": getattr(p, 'reviewed_at', None),
            "overall_score": p.overall_score,
            "risk_score": p.risk_score,
            "compliance_score": p.compliance_score,
            "estimated_cost": p.estimated_cost,
            "duration_months": p.duration_months,
            "approval_comment": getattr(p, 'approval_comment', None),
            "progress_pct": progress_pct,
            "step_index": step_idx,
            "ref_number": f"KPWD-{p.id[:8].upper()}",
        }
        print(f"Success for project {p.id}")
except Exception as e:
    traceback.print_exc()
