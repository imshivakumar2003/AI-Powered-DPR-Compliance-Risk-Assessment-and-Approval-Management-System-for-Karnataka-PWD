
# ══════════════════════════════════════════════════════════════════════════════
# APPLICATION STATUS API ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class CommentRequest(BaseModel):
    author_role: str      # 'reviewer' | 'user'
    author_name: str
    message: str


class ReviewerCommentRequest(BaseModel):
    reviewer_name: str
    message: str
    new_status: Optional[str] = None   # optionally change status: 'PENDING', 'APPROVED', 'REJECTED'
    department: Optional[str] = None


def _status_step(status: str) -> int:
    """Map DB status to progress step index (0-based)."""
    mapping = {
        "PENDING": 0,   # uploaded / awaiting analysis
        "PROCESSING": 1,
        "REVIEWED": 2,
        "UNDER_REVIEW": 2,
        "PENDING_INFO": 3,
        "APPROVED": 4,
        "REJECTED": 4,
    }
    return mapping.get(status.upper(), 0)


def _ensure_initial_timeline(project):
    """Create upload + AI-analysis events if they don't exist yet."""
    from datetime import datetime

    # upload event
    ensure_upload_timeline(project.id)

    # AI analysis event — create once if scores are set
    from app.services.project_service import get_db_connection_raw
    pass  # handled in ensure_upload_timeline


@app.get("/api/application-status")
def get_all_application_statuses():
    """Return list of all DPRs with application-status summary."""
    projects = get_all_projects()
    result = []
    for p in projects:
        ensure_upload_timeline(p.id)
        # Calculate progress percentage based on status
        steps = ["Uploaded", "AI Analysis", "Under Review", "Pending Info", "Decision"]
        step_idx = _status_step(p.status)
        progress_pct = round((step_idx + 1) / len(steps) * 100)

        result.append({
            "id": p.id,
            "title": p.title or p.original_filename,
            "original_filename": p.original_filename,
            "district": p.state,
            "sector": p.sector,
            "department": p.department or "Karnataka PWD",
            "submitted_by": p.submitted_by or "User",
            "upload_date": p.upload_date,
            "status": p.status,
            "reviewed_by": p.reviewed_by,
            "reviewer_name": p.reviewer_name,
            "reviewed_at": p.reviewed_at,
            "overall_score": p.overall_score,
            "risk_score": p.risk_score,
            "compliance_score": p.compliance_score,
            "estimated_cost": p.estimated_cost,
            "duration_months": p.duration_months,
            "approval_comment": p.approval_comment,
            "progress_pct": progress_pct,
            "step_index": step_idx,
            "ref_number": f"KPWD-{p.id[:8].upper()}",
        })
    return result


@app.get("/api/application-status/{project_id}")
def get_application_status_detail(project_id: str):
    """Return full detail for one DPR including comments, timeline, versions, notifications."""
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")

    ensure_upload_timeline(project_id)

    steps = ["DPR Uploaded", "AI Analysis", "Under Review", "Pending Info", "Decision"]
    step_idx = _status_step(p.status)
    progress_pct = round((step_idx + 1) / len(steps) * 100)

    # Auto-create AI analysis timeline event if scores exist and event missing
    timeline = get_timeline(project_id)
    has_ai_event = any(e["event_type"] == "ai_analysis" for e in timeline)
    if p.overall_score is not None and not has_ai_event:
        add_timeline_event(project_id, "ai_analysis", "AI Analysis Completed",
                           f"AI scored the DPR: Quality {p.overall_score}/100, Risk {p.risk_score}/100, Compliance {p.compliance_score}%.",
                           "AI Engine", "system")
        timeline = get_timeline(project_id)

    return {
        "id": p.id,
        "title": p.title or p.original_filename,
        "original_filename": p.original_filename,
        "district": p.state,
        "sector": p.sector,
        "department": p.department or "Karnataka PWD",
        "submitted_by": p.submitted_by or "User",
        "upload_date": p.upload_date,
        "status": p.status,
        "reviewed_by": p.reviewed_by,
        "reviewer_name": p.reviewer_name,
        "reviewed_at": p.reviewed_at,
        "overall_score": p.overall_score,
        "risk_score": p.risk_score,
        "compliance_score": p.compliance_score,
        "estimated_cost": p.estimated_cost,
        "duration_months": p.duration_months,
        "approval_comment": p.approval_comment,
        "progress_pct": progress_pct,
        "step_index": step_idx,
        "ref_number": f"KPWD-{p.id[:8].upper()}",
        "steps": steps,
        "comments": get_comments(project_id),
        "timeline": timeline,
        "versions": get_dpr_versions(project_id),
        "notifications": get_notifications("user", project_id),
    }


@app.post("/api/application-status/{project_id}/comment")
def post_comment(project_id: str, req: CommentRequest):
    """Post a comment from user or reviewer."""
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")

    comment = add_comment(
        project_id=project_id,
        author_role=req.author_role,
        author_name=req.author_name,
        message=req.message,
    )

    # Add timeline event
    if req.author_role == "reviewer":
        add_timeline_event(project_id, "reviewer_comment", "Reviewer Added Comment",
                           req.message[:120], req.author_name, "reviewer")
        # Notify user
        add_notification(project_id, "user", p.submitted_by or "User",
                         "reviewer_comment", f"Reviewer commented: {req.message[:80]}")
    else:
        add_timeline_event(project_id, "user_reply", "User Submitted Reply",
                           req.message[:120], req.author_name, "user")
        # Notify reviewer
        reviewer = p.reviewed_by or p.reviewer_name or "Admin"
        add_notification(project_id, "reviewer", reviewer,
                         "user_reply", f"User replied: {req.message[:80]}")

    return {"success": True, "comment": comment}


@app.post("/api/application-status/{project_id}/reviewer-action")
def reviewer_action(project_id: str, req: ReviewerCommentRequest):
    """Reviewer can add comment + optionally change DPR status."""
    from datetime import datetime
    import sqlite3 as _sqlite3

    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")

    # Post comment
    comment = add_comment(
        project_id=project_id,
        author_role="reviewer",
        author_name=req.reviewer_name,
        message=req.message,
    )

    # Update status + reviewer info in DB if status provided
    if req.new_status:
        from app.services.project_service import _get_db as _db, UPLOAD_DIR as _UDIR
        conn = _db()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat() + "Z"
        cursor.execute(
            """UPDATE projects SET status=?, reviewed_by=?, reviewed_at=?, reviewer_name=?,
               approval_comment=?, department=? WHERE id=?""",
            (req.new_status.upper(), req.reviewer_name, now, req.reviewer_name,
             req.message, req.department or "Karnataka PWD", project_id)
        )
        conn.commit()
        conn.close()
        clear_analysis_cache(project_id)

        status_label_map = {
            "APPROVED": "DPR Approved",
            "REJECTED": "DPR Rejected",
            "PENDING": "Reviewer Requested Changes",
            "UNDER_REVIEW": "DPR Under Review",
        }
        label = status_label_map.get(req.new_status.upper(), f"Status: {req.new_status}")
        add_timeline_event(project_id, f"status_{req.new_status.lower()}", label,
                           req.message[:120], req.reviewer_name, "reviewer")

        # Notify user
        notify_msg = f"Status changed to {req.new_status}: {req.message[:60]}"
        add_notification(project_id, "user", p.submitted_by or "User",
                         f"status_{req.new_status.lower()}", notify_msg)

    return {"success": True, "comment": comment}


@app.post("/api/application-status/{project_id}/upload-revision")
async def upload_revision(
    project_id: str,
    file: UploadFile = File(...),
    uploaded_by: str = Form(...),
    notes: str = Form(""),
):
    """Upload a revised DPR version."""
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")

    file_bytes = await file.read()
    version = add_dpr_version(project_id, file_bytes, file.filename, uploaded_by, notes)

    add_timeline_event(project_id, "revision_upload",
                       f"Revised DPR Uploaded (v{version['version_number']})",
                       f"Uploaded by {uploaded_by}: {file.filename}",
                       uploaded_by, "user")

    # Notify reviewer
    reviewer = p.reviewed_by or p.reviewer_name or "Admin"
    add_notification(project_id, "reviewer", reviewer, "revision_upload",
                     f"{uploaded_by} uploaded a revised DPR v{version['version_number']}: {file.filename}")
    # Notify user confirmation
    add_notification(project_id, "user", uploaded_by, "revision_upload",
                     f"Your revised DPR v{version['version_number']} has been submitted successfully.")

    return {"success": True, "version": version}


@app.get("/api/application-status/{project_id}/versions")
def get_project_versions(project_id: str):
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return get_dpr_versions(project_id)


@app.get("/api/application-status/{project_id}/notifications")
def get_project_notifications(project_id: str, role: str = "user"):
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return get_notifications(role, project_id)


@app.post("/api/application-status/{project_id}/notifications/read")
def mark_notifs_read(project_id: str, role: str = "user"):
    mark_notifications_read(project_id, role)
    return {"success": True}


@app.get("/api/application-status/{project_id}/timeline")
def get_project_timeline(project_id: str):
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    ensure_upload_timeline(project_id)
    return get_timeline(project_id)


@app.get("/api/application-status/{project_id}/comments")
def get_project_comments(project_id: str):
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return get_comments(project_id)


@app.post("/api/application-status/{project_id}/comment-with-file")
async def post_comment_with_file(
    project_id: str,
    author_role: str = Form(...),
    author_name: str = Form(...),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    """Post a comment optionally with an attached document."""
    from app.services.project_service import UPLOAD_DIR as _UDIR
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")

    att_filename = None
    att_path = None
    if file:
        import uuid as _uuid
        os.makedirs(_UDIR, exist_ok=True)
        ext = os.path.splitext(file.filename)[1]
        saved = f"att_{_uuid.uuid4()}{ext}"
        saved_path = os.path.join(_UDIR, saved)
        with open(saved_path, "wb") as fh:
            fh.write(await file.read())
        att_filename = file.filename
        att_path = saved

    comment = add_comment(project_id, author_role, author_name, message,
                          att_filename, att_path)

    if author_role == "reviewer":
        add_timeline_event(project_id, "reviewer_comment", "Reviewer Added Comment",
                           message[:120], author_name, "reviewer")
        add_notification(project_id, "user", p.submitted_by or "User",
                         "reviewer_comment", f"Reviewer commented: {message[:80]}")
    else:
        add_timeline_event(project_id, "user_reply", "User Submitted Reply",
                           message[:120], author_name, "user")
        reviewer = p.reviewed_by or p.reviewer_name or "Admin"
        add_notification(project_id, "reviewer", reviewer,
                         "user_reply", f"User replied: {message[:80]}")

    return {"success": True, "comment": comment}
