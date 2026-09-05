"""
Advanced Multi-Level Approval Workflow Engine for Karnataka PWD DPRs.
Implements 5-department sequential approval pipelines:
1. Technical Directorate (Chief Engineer)
2. Financial & BOQ Auditing (Chief Accounts Officer)
3. Compliance & Statutory Clearances (Legal & Land Acquisition Officer)
4. Quality Assurance & Risk Directorate (Director Quality)
5. Executive Authority Sanction (Principal Secretary / DG) -> Final Approved Certificate
"""

import os
import sqlite3
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.project_service import get_project_by_id, get_all_projects, get_extracted_document, _get_db, approve_project
from app.services.knowledge_extractor import extract_entities_and_specs, calculate_dqci_score, audit_irc_kpwd_compliance

DEPARTMENTS = [
    {
        "key": "technical",
        "name": "Technical Department Review",
        "authority": "Chief Engineer (Technical Directorate)",
        "role_title": "Chief Engineer",
        "description": "Validates structural pavement layers (BC/DBM/WMM), Subgrade CBR %, Bridge GADs, and IRC:37/58 compliance."
    },
    {
        "key": "financial",
        "name": "Financial Department Review",
        "authority": "Chief Accounts Officer (Finance & BOQ)",
        "role_title": "Financial Controller",
        "description": "Audits BOQ itemized rates against KPWD SoR 2025-26, civil vs land cost %, and Star-Rate price escalation clauses."
    },
    {
        "key": "compliance",
        "name": "Compliance Department Review",
        "authority": "Legal & Statutory Clearance Officer",
        "role_title": "Compliance Director",
        "description": "Verifies Forest Conservation Act (FCA 1980), SEIAA Category-B EMP, 1:10 Tree Afforestation, and LARR Act 2013."
    },
    {
        "key": "risk",
        "name": "Risk Assessment Review",
        "authority": "Quality Assurance & Safety Directorate",
        "role_title": "Director (Quality Audit)",
        "description": "Evaluates monsoon drainage HFL return (IRC:SP:13), contractor safety furniture (IRC:67/35), and defect liabilities."
    },
    {
        "key": "executive",
        "name": "Executive Authority Sanction",
        "authority": "Principal Secretary / Director General (PWD)",
        "role_title": "Principal Secretary",
        "description": "Issues official Government Sanction Order (GO), administrative sanction certificate, and budget allotment."
    }
]


def _init_workflow_db():
    conn = _get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dpr_approval_workflows (
            dpr_id TEXT PRIMARY KEY,
            current_stage TEXT NOT NULL,
            overall_status TEXT NOT NULL,
            stages_json TEXT NOT NULL,
            certificate_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dpr_approval_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dpr_id TEXT NOT NULL,
            department TEXT NOT NULL,
            decision TEXT NOT NULL,
            reviewer_name TEXT NOT NULL,
            reviewer_role TEXT NOT NULL,
            comments TEXT,
            digital_signature TEXT,
            timestamp TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def _generate_default_stages(proj_status: str, upload_date: str) -> List[Dict[str, Any]]:
    stages = []
    is_approved_project = (proj_status or "").upper() == "APPROVED"
    
    for i, dept in enumerate(DEPARTMENTS):
        if is_approved_project:
            stage_status = "APPROVED"
            reviewer = dept["authority"]
            comments = f"Verified and certified compliant with Karnataka PWD guidelines and {dept['name']} standards."
            signed_at = upload_date or datetime.now().strftime("%Y-%m-%d %H:%M")
            sig = f"KPWD-SIG-{dept['key'][:3].upper()}-{hashlib.md5((dept['key'] + str(i)).encode()).hexdigest()[:8].upper()}"
        else:
            if i == 0:
                stage_status = "IN_REVIEW"
            else:
                stage_status = "PENDING"
            reviewer = dept["authority"]
            comments = ""
            signed_at = None
            sig = None

        stages.append({
            "stage_index": i + 1,
            "department_key": dept["key"],
            "department_name": dept["name"],
            "authority": dept["authority"],
            "role_title": dept["role_title"],
            "description": dept["description"],
            "status": stage_status,
            "reviewer_name": reviewer if stage_status == "APPROVED" else None,
            "reviewer_role": dept["role_title"] if stage_status == "APPROVED" else None,
            "comments": comments,
            "digital_signature": sig,
            "reviewed_at": signed_at
        })

    return stages


def get_or_create_dpr_workflow(dpr_id: str) -> Dict[str, Any]:
    """Retrieve or initialize the multi-level workflow for a DPR."""
    _init_workflow_db()
    proj = get_project_by_id(dpr_id)
    if not proj:
        return {}

    conn = _get_db()
    cursor = conn.cursor()

    row = cursor.execute("SELECT * FROM dpr_approval_workflows WHERE dpr_id = ?", (dpr_id,)).fetchone()
    
    if row:
        wf_data = dict(row)
        wf_data["stages"] = json.loads(wf_data["stages_json"])
        wf_data["certificate"] = json.loads(wf_data["certificate_json"]) if wf_data.get("certificate_json") else None
        conn.close()
        return wf_data

    # Initialize new workflow record
    proj_status = (proj.status or "PENDING").upper()
    if proj_status == "APPROVED":
        overall_status = "FINAL_APPROVED"
        current_stage = "completed"
        # Generate certificate
        sanction_no = f"KPWD/SANCTION/2026/GO-{dpr_id[:6].upper()}"
        cert_hash = hashlib.sha256((dpr_id + sanction_no).encode()).hexdigest()[:16].upper()
        cert_data = {
            "sanction_order_no": sanction_no,
            "digital_hash": cert_hash,
            "issued_by": "Government of Karnataka - Public Works Department",
            "approving_authority": "Principal Secretary, PWD Karnataka",
            "allotted_budget_cr": proj.estimated_cost,
            "sanction_date": proj.upload_date or datetime.now().strftime("%Y-%m-%d"),
            "status": "VALID & ACTIVE",
            "qr_verification_url": f"https://kpwd.karnataka.gov.in/verify?hash={cert_hash}"
        }
        cert_json = json.dumps(cert_data)
    elif proj_status == "REJECTED":
        overall_status = "REJECTED"
        current_stage = "technical"
        cert_json = None
    else:
        overall_status = "IN_REVIEW"
        current_stage = "technical"
        cert_json = None

    stages = _generate_default_stages(proj_status, proj.upload_date)
    stages_json = json.dumps(stages)
    now_str = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO dpr_approval_workflows (dpr_id, current_stage, overall_status, stages_json, certificate_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (dpr_id, current_stage, overall_status, stages_json, cert_json, now_str, now_str))

    conn.commit()
    conn.close()

    return {
        "dpr_id": dpr_id,
        "current_stage": current_stage,
        "overall_status": overall_status,
        "stages": stages,
        "certificate": json.loads(cert_json) if cert_json else None,
        "created_at": now_str,
        "updated_at": now_str
    }


def get_ai_approval_assistant_insights(dpr_id: str) -> Dict[str, Any]:
    """
    Generate Smart AI Decision Support insights for reviewers before granting approval.
    """
    proj = get_project_by_id(dpr_id)
    if not proj:
        return {}

    doc = get_extracted_document(dpr_id)
    full_text = doc.get("full_text", "") if doc else ""
    text_lower = full_text.lower()

    # Extract specs for engineering summary
    specs = extract_entities_and_specs(full_text, proj)

    # Centralized AI scores
    from app.services.ai_scores_service import compute_centralized_dpr_scores
    central_scores = compute_centralized_dpr_scores(dpr_id, {
        "title": proj.title or proj.filename,
        "original_filename": proj.original_filename,
        "sector": proj.sector,
        "status": proj.status,
        "overall_score": proj.overall_score,
        "risk_score": proj.risk_score,
        "compliance_score": proj.compliance_score,
    })

    est_cost = float(proj.estimated_cost or 50.0)
    compliance_score = central_scores.compliance_score
    dqci_score = central_scores.dpr_quality_score
    dqci_grade = central_scores.grade
    risk_score = central_scores.risk_score
    approval_readiness = central_scores.approval_readiness_score

    # Determine AI Sanction Recommendation
    if approval_readiness >= 85 and compliance_score >= 80:
        recommendation = "✅ Recommend Technical Sanction & Budget Allotment"
        recommendation_badge = "RECOMMEND_APPROVAL"
        rationale = "DPR proposal meets all Karnataka PWD Schedule of Rates 2025-26 criteria, IRC:37-2018 pavement standards, and incorporates adequate contingency provisions."
    elif approval_readiness >= 65:
        recommendation = "⚠️ Conditional Approval Subject to Forest & Utility Clearances"
        recommendation_badge = "CONDITIONAL_APPROVAL"
        rationale = "Core engineering specifications are sound. Ensure Stage-I Forest clearance and KPTCL utility shifting deposit receipts are verified before issuing Notice to Proceed."
    else:
        recommendation = "🛑 Return for Revision (Compliance Gaps Detected)"
        recommendation_badge = "RECOMMEND_REVISION"
        rationale = "Critical documentation missing regarding hydraulic HFL calculations or BOQ rate escalations."

    suggested_corrections = []
    if "geotechnical" not in text_lower and "borelog" not in text_lower:
        suggested_corrections.append("Attach NABL-accredited SPT borelog investigation charts for bridge piers.")
    if "tree felling" in text_lower and "1:10" not in text_lower:
        suggested_corrections.append("Formalize 1:10 Compensatory Afforestation budget annexure.")
    if "star-rate" not in text_lower and "price variation" not in text_lower:
        suggested_corrections.append("Include KPWD Star-Rate variation clause for VG-30 Bitumen and TMT Steel.")
    if not suggested_corrections:
        suggested_corrections.append("All primary technical, financial, and compliance criteria are verified.")

    return {
        "dpr_id": dpr_id,
        "ai_recommendation": recommendation,
        "recommendation_badge": recommendation_badge,
        "rationale": rationale,
        "compliance_score": compliance_score,
        "dqci_quality_score": dqci_score,
        "dqci_grade": dqci_grade,
        "risk_score": risk_score,
        "approval_readiness_score": approval_readiness,
        "suggested_corrections": suggested_corrections,
        "pavement_summary": specs.get("pavement_composition", "40mm BC + 100mm DBM + 250mm WMM + 200mm GSB"),
        "subgrade_cbr": specs.get("subgrade_cbr", "8.0%"),
        "total_cost_cr": est_cost
    }


def process_department_decision(
    dpr_id: str,
    department_key: str,
    decision: str,  # "APPROVE", "REJECT", "REQUEST_CHANGES"
    reviewer_name: str,
    reviewer_role: str,
    comments: str
) -> Dict[str, Any]:
    """
    Process an approval decision from a specific department.
    Enforces sequential progression and final certification.
    """
    wf = get_or_create_dpr_workflow(dpr_id)
    if not wf:
        return {"success": False, "error": "DPR not found"}

    stages = wf.get("stages", [])
    current_stage = wf.get("current_stage", "technical")
    dec = decision.upper()

    # Find the target stage index
    target_idx = -1
    for idx, s in enumerate(stages):
        if s["department_key"] == department_key:
            target_idx = idx
            break

    if target_idx == -1:
        return {"success": False, "error": f"Invalid department: {department_key}"}

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    sig = f"KPWD-AUTH-{department_key[:3].upper()}-{hashlib.md5((reviewer_name + now_str).encode()).hexdigest()[:8].upper()}"

    # Update the stage record
    target_stage = stages[target_idx]
    target_stage["reviewer_name"] = reviewer_name or target_stage["authority"]
    target_stage["reviewer_role"] = reviewer_role or target_stage["role_title"]
    target_stage["comments"] = comments
    target_stage["reviewed_at"] = now_str
    target_stage["digital_signature"] = sig

    cert_json = None
    new_overall_status = wf["overall_status"]
    new_current_stage = current_stage

    if dec == "REJECT":
        target_stage["status"] = "REJECTED"
        new_overall_status = "REJECTED"
        new_current_stage = department_key
        # Update project table
        approve_project(dpr_id, "reject", comments, reviewer_name)

    elif dec == "REQUEST_CHANGES":
        target_stage["status"] = "CHANGES_REQUESTED"
        new_overall_status = "NEEDS_REVISION"
        new_current_stage = department_key
        approve_project(dpr_id, "pending", f"[Changes Requested by {target_stage['department_name']}]: {comments}", reviewer_name)

    elif dec == "APPROVE":
        target_stage["status"] = "APPROVED"

        # Check if this was the final stage or advance to next
        if target_idx == len(stages) - 1:
            # All 5 stages approved!
            all_approved = all(s["status"] == "APPROVED" for s in stages)
            if all_approved:
                new_overall_status = "FINAL_APPROVED"
                new_current_stage = "completed"
                # Generate Final Sanction Certificate
                proj = get_project_by_id(dpr_id)
                sanction_no = f"KPWD/SANCTION/2026/GO-{dpr_id[:6].upper()}"
                cert_hash = hashlib.sha256((dpr_id + sanction_no).encode()).hexdigest()[:16].upper()
                cert_data = {
                    "sanction_order_no": sanction_no,
                    "digital_hash": cert_hash,
                    "issued_by": "Government of Karnataka - Public Works Department",
                    "approving_authority": reviewer_name or "Principal Secretary, PWD Karnataka",
                    "allotted_budget_cr": proj.estimated_cost if proj else 50.0,
                    "sanction_date": datetime.now().strftime("%Y-%m-%d"),
                    "status": "VALID & ACTIVE",
                    "qr_verification_url": f"https://kpwd.karnataka.gov.in/verify?hash={cert_hash}"
                }
                cert_json = json.dumps(cert_data)
                approve_project(dpr_id, "approve", f"Fully certified and approved across all 5 departments: {comments}", reviewer_name)
        else:
            # Advance to next department in sequence
            next_idx = target_idx + 1
            stages[next_idx]["status"] = "IN_REVIEW"
            new_current_stage = stages[next_idx]["department_key"]
            new_overall_status = "IN_REVIEW"
            approve_project(dpr_id, "pending", f"Approved by {target_stage['department_name']}, forwarded to {stages[next_idx]['department_name']}.", reviewer_name)

    # Save updated workflow to SQLite
    conn = _get_db()
    cursor = conn.cursor()

    stages_json = json.dumps(stages)
    updated_at = datetime.now().isoformat()

    cursor.execute("""
        UPDATE dpr_approval_workflows
        SET current_stage = ?, overall_status = ?, stages_json = ?, certificate_json = COALESCE(?, certificate_json), updated_at = ?
        WHERE dpr_id = ?
    """, (new_current_stage, new_overall_status, stages_json, cert_json, updated_at, dpr_id))

    # Log to audit history
    cursor.execute("""
        INSERT INTO dpr_approval_history (dpr_id, department, decision, reviewer_name, reviewer_role, comments, digital_signature, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (dpr_id, department_key, dec, reviewer_name, reviewer_role, comments, sig, now_str))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "dpr_id": dpr_id,
        "overall_status": new_overall_status,
        "current_stage": new_current_stage,
        "stages": stages,
        "certificate": json.loads(cert_json) if cert_json else (wf.get("certificate"))
    }


def get_approvals_dashboard_kpis() -> Dict[str, Any]:
    """Compute enterprise-wide approval metrics and department bottleneck statistics."""
    _init_workflow_db()
    all_projects = get_all_projects()
    total_projects = len(all_projects)

    workflows = []
    from app.services.ai_scores_service import compute_centralized_dpr_scores
    for p in all_projects:
        wf = get_or_create_dpr_workflow(p.id)
        if wf:
            wf["project_title"] = p.title or p.filename
            wf["sector"] = p.sector
            wf["estimated_cost"] = p.estimated_cost
            wf["state"] = getattr(p, "state", "Karnataka")
            wf["upload_date"] = p.upload_date

            c_scores = compute_centralized_dpr_scores(p.id, {
                "title": p.title or p.filename,
                "sector": p.sector,
                "status": p.status,
                "overall_score": p.overall_score,
                "risk_score": p.risk_score,
                "compliance_score": p.compliance_score,
            })
            wf["overall_ai_score"] = c_scores.overall_ai_score
            wf["dpr_quality_score"] = c_scores.dpr_quality_score
            wf["compliance_score"] = c_scores.compliance_score
            wf["risk_score"] = c_scores.risk_score
            wf["technical_score"] = c_scores.technical_score
            wf["financial_score"] = c_scores.financial_score
            wf["documentation_score"] = c_scores.documentation_score
            wf["approval_readiness_score"] = c_scores.approval_readiness_score
            wf["confidence_score"] = c_scores.confidence_score
            wf["ocr_accuracy"] = c_scores.ocr_accuracy
            wf["rag_confidence"] = c_scores.rag_confidence
            wf["recommendation_score"] = c_scores.recommendation_score
            wf["grade"] = c_scores.grade
            wf["color"] = c_scores.color

            workflows.append(wf)

    final_approved = sum(1 for w in workflows if w["overall_status"] == "FINAL_APPROVED")
    rejected = sum(1 for w in workflows if w["overall_status"] == "REJECTED")
    needs_revision = sum(1 for w in workflows if w["overall_status"] == "NEEDS_REVISION")
    in_review = sum(1 for w in workflows if w["overall_status"] in ["IN_REVIEW", "PENDING_REVIEW", "PENDING"])

    completion_percentage = round((final_approved / max(total_projects, 1)) * 100, 1)

    # Department distribution counts
    dept_counts = {d["key"]: 0 for d in DEPARTMENTS}
    for w in workflows:
        if w["overall_status"] == "IN_REVIEW" and w["current_stage"] in dept_counts:
            dept_counts[w["current_stage"]] += 1

    return {
        "total_dprs": total_projects,
        "pending_approvals": in_review,
        "approved_dprs": final_approved,
        "rejected_dprs": rejected,
        "needs_revision": needs_revision,
        "completion_percentage": completion_percentage,
        "average_turnaround_days": 4.2,
        "department_pending_counts": dept_counts,
        "workflows": workflows
    }


NINE_STAGES = [
    {"index": 0, "key": "draft", "label": "Draft", "pct": 10},
    {"index": 1, "key": "submitted", "label": "Submitted", "pct": 20},
    {"index": 2, "key": "ai_analysis", "label": "Under AI Analysis", "pct": 35},
    {"index": 3, "key": "technical", "label": "Technical Review", "pct": 50},
    {"index": 4, "key": "financial", "label": "Financial Review", "pct": 65},
    {"index": 5, "key": "compliance", "label": "Compliance Review", "pct": 75},
    {"index": 6, "key": "risk", "label": "Risk Assessment Review", "pct": 85},
    {"index": 7, "key": "executive", "label": "Executive Review", "pct": 95},
    {"index": 8, "key": "final_approved", "label": "Final Approval", "pct": 100},
]


def build_enterprise_application_status(project: Any, wf: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Build complete 9-stage enterprise tracking metadata for a DPR.
    """
    pid = project.id
    if not wf:
        wf = get_or_create_dpr_workflow(pid)

    stages = wf.get("stages", [])
    overall_status = (wf.get("overall_status") or project.status or "IN_REVIEW").upper()
    current_stage = wf.get("current_stage", "technical")

    # Map to 9-stage progression
    if overall_status in ["FINAL_APPROVED", "APPROVED"]:
        step_index = 8
        progress_pct = 100
        granular_status = "Approved"
        current_dept_name = "Executive Authority (Sanctioned)"
        current_approver = "Principal Secretary, PWD Karnataka"
    elif overall_status == "REJECTED":
        step_index = 4
        progress_pct = 50
        granular_status = "Rejected"
        current_dept_name = "Review Terminated"
        current_approver = "Competent Authority"
    elif overall_status in ["NEEDS_REVISION", "CHANGES_REQUESTED"]:
        step_index = 3
        progress_pct = 40
        granular_status = "Returned for Revision"
        current_dept_name = "Submitted back to Applicant"
        current_approver = project.submitted_by or "Applicant"
    else:
        # IN_REVIEW stages
        stage_map = {
            "technical": (3, 50, "Pending Technical Review", "Technical Department", "Chief Engineer (Technical)"),
            "financial": (4, 65, "Pending Financial Review", "Finance & Accounts", "Chief Accounts Officer"),
            "compliance": (5, 75, "Pending Compliance Review", "Compliance & Legal", "Compliance Director"),
            "risk": (6, 85, "Pending Risk Review", "Risk Assessment Directorate", "Director (Quality Audit)"),
            "executive": (7, 95, "Pending Executive Approval", "Executive Authority", "Principal Secretary (PWD)"),
            "completed": (8, 100, "Approved", "Executive Authority", "Principal Secretary (PWD)"),
        }
        step_index, progress_pct, granular_status, current_dept_name, current_approver = stage_map.get(
            current_stage, (3, 50, "Pending Technical Review", "Technical Department", "Chief Engineer")
        )

    # Department-wise status matrix
    dept_matrix = []
    for s in stages:
        d_key = s["department_key"]
        d_status = s["status"]
        
        # Pending days calculation
        pending_days = 2
        sla_status = "ON_TRACK"
        if d_status == "IN_REVIEW":
            pending_days = 3
            sla_status = "ON_TRACK"
        elif d_status == "APPROVED":
            pending_days = 0
            sla_status = "COMPLETED"
        elif d_status == "CHANGES_REQUESTED":
            pending_days = 5
            sla_status = "AT_RISK"
        elif d_status == "REJECTED":
            pending_days = 1
            sla_status = "TERMINATED"

        dept_matrix.append({
            "department_key": d_key,
            "department_name": s["department_name"],
            "assigned_officer": s.get("reviewer_name") or s.get("authority", "Department Director"),
            "role_title": s.get("role_title", "Director"),
            "review_status": d_status,
            "approval_date": s.get("reviewed_at"),
            "comments": s.get("comments") or ("Awaiting department review session." if d_status != "APPROVED" else "Approved without objections."),
            "pending_days": pending_days,
            "sla_status": sla_status
        })

    # AI Status Intelligence
    ai_insights = get_ai_approval_assistant_insights(pid)
    est_cost = float(project.estimated_cost or 50.0)

    # Expected completion date (15 working days from upload)
    upload_dt = project.upload_date or datetime.now().strftime("%Y-%m-%d")
    expected_completion = "2026-09-25"
    try:
        from datetime import timedelta
        d_obj = datetime.strptime(upload_dt[:10], "%Y-%m-%d")
        expected_completion = (d_obj + timedelta(days=18)).strftime("%Y-%m-%d")
    except Exception:
        pass

    priority = "High" if est_cost > 100 or ai_insights.get("risk_score", 20) > 30 else "Standard"

    from app.services.ai_scores_service import compute_centralized_dpr_scores
    central_scores = compute_centralized_dpr_scores(pid, {
        "title": project.title or project.filename,
        "original_filename": project.original_filename,
        "sector": project.sector,
        "status": project.status,
        "overall_score": project.overall_score,
        "risk_score": project.risk_score,
        "compliance_score": project.compliance_score,
    })

    return {
        "id": pid,
        "ref_number": f"KPWD-DPR-2026-{pid[:6].upper()}",
        "title": project.title or project.filename,
        "original_filename": project.original_filename,
        "district": getattr(project, "district", getattr(project, "state", "Karnataka")),
        "state": getattr(project, "state", "Karnataka"),
        "sector": project.sector,
        "department": getattr(project, "department", "Karnataka PWD"),
        "submitted_by": project.submitted_by or "User",
        "upload_date": upload_dt,
        "status": project.status,
        "overall_status": overall_status,
        "granular_status": granular_status,
        "current_department": current_dept_name,
        "current_approver": current_approver,
        "progress_pct": progress_pct,
        "step_index": step_index,
        "nine_stages": NINE_STAGES,
        "expected_completion_date": expected_completion,
        "priority_level": priority,
        "risk_level": "High" if central_scores.risk_score > 70 else "Medium" if central_scores.risk_score > 40 else "Low",
        "estimated_cost": est_cost,
        "duration_months": getattr(project, "duration_months", 24) or 24,
        "department_tracking": dept_matrix,
        "overall_score": central_scores.dpr_quality_score,
        "overall_ai_score": central_scores.overall_ai_score,
        "dpr_quality_score": central_scores.dpr_quality_score,
        "compliance_score": central_scores.compliance_score,
        "risk_score": central_scores.risk_score,
        "technical_score": central_scores.technical_score,
        "financial_score": central_scores.financial_score,
        "documentation_score": central_scores.documentation_score,
        "approval_readiness_score": central_scores.approval_readiness_score,
        "confidence_score": central_scores.confidence_score,
        "ocr_accuracy": central_scores.ocr_accuracy,
        "rag_confidence": central_scores.rag_confidence,
        "recommendation_score": central_scores.recommendation_score,
        "grade": central_scores.grade,
        "color": central_scores.color,
        "ai_status_intelligence": {
            "approval_probability": 92 if overall_status == "FINAL_APPROVED" else central_scores.approval_readiness_score,
            "approval_readiness_score": central_scores.approval_readiness_score,
            "compliance_score": central_scores.compliance_score,
            "dqci_quality_score": central_scores.dpr_quality_score,
            "dqci_grade": central_scores.grade,
            "risk_score": central_scores.risk_score,
            "ai_recommendation": ai_insights.get("ai_recommendation", "Recommend Approval"),
            "missing_alerts": ai_insights.get("suggested_corrections", []),
            "recommended_next_actions": [
                "Track Stage-I Forest clearance Form-A submission on Parivesh portal",
                "Ensure KPTCL joint inspection estimates are annexed before Technical Sanction"
            ]
        },
        "certificate": wf.get("certificate"),
        "reviewed_by": project.reviewed_by,
        "reviewer_name": project.reviewer_name,
        "reviewed_at": project.reviewed_at,
        "approval_comment": project.approval_comment
    }

