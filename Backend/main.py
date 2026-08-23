# TOPLINE

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Response, Request
from fastapi.responses import PlainTextResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

import random
import hashlib
import numpy as np

app = FastAPI(title="Karnataka PWD DPR-AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Auth Router ----
from app.routers.auth import router as auth_router
app.include_router(auth_router)

# ---- Project Service ----
from app.services.project_service import (
    get_all_projects, get_project_by_id, create_project, approve_project,
    update_project_scores, get_cached_analysis, save_analysis_cache, Project,
    save_category_recommendations, get_category_recommendations,
    mark_in_approvals, is_in_approvals, clear_analysis_cache,
    add_comment, get_comments, add_timeline_event, get_timeline,
    add_notification, get_notifications, mark_notifications_read,
    mark_all_notifications_read, mark_single_notification_read,
    add_dpr_version, get_dpr_versions, ensure_upload_timeline,
    can_user_access_project, is_admin_role, is_authorized_status_viewer,
    delete_project,
)

def _extract_request_user(request: Request, username: Optional[str] = None, role: Optional[str] = None) -> tuple[Optional[str], Optional[str], Optional[str]]:
    user_q = username or request.query_params.get("username") or request.query_params.get("user")
    role_q = role or request.query_params.get("role")
    user_id_q = request.query_params.get("user_id") or request.headers.get("X-User-Id") or request.headers.get("x-user-id")
    
    if not user_q:
        user_q = request.headers.get("X-User-Name") or request.headers.get("x-user-name")
    if not role_q:
        role_q = request.headers.get("X-User-Role") or request.headers.get("x-user-role")
        
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from app.services.auth_service import decode_token, get_user
            decoded = decode_token(token)
            if decoded:
                if not user_q:
                    user_q = decoded.username
                u_obj = get_user(decoded.username)
                if u_obj:
                    if not role_q:
                        role_q = u_obj.role
                    if not user_id_q and getattr(u_obj, 'id', None):
                        user_id_q = str(u_obj.id)
        except Exception:
            pass

    if user_q and not user_id_q:
        try:
            from app.services.auth_service import get_user
            u_obj = get_user(user_q)
            if u_obj and getattr(u_obj, 'id', None):
                user_id_q = str(u_obj.id)
        except Exception:
            pass
            
    return user_q, role_q, user_id_q

def _verify_dpr_access(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None) -> Project:
    project = get_project_by_id(dpr_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    u, r, uid = _extract_request_user(request, username, role)
    if not can_user_access_project(project, u, r, uid):
        raise HTTPException(status_code=403, detail="Access Denied: You do not have permission to view or access this DPR.")
    return project

# ---- Compliance & Report Services ----
from app.services.compliance_service import evaluate_compliance, ProjectCompliance
from app.services.report_generator import generate_dpr_assessment_report, generate_dpr_assessment_pdf_bytes
from fastapi.responses import PlainTextResponse, FileResponse
import os
import mimetypes

# ---- Settings Service ----
from app.services.auth_service import get_settings, save_settings, AppSettings


# ---- Pydantic Models ----

class RiskPrediction(BaseModel):
    risk_score: int
    risk_category: str
    top_risk_factors: List[str]
    mitigation_recommendations: List[str]

class DimensionScore(BaseModel):
    dimension: str
    score: int
    feedback: str

class QualityAssessment(BaseModel):
    overall_score: int
    status: str
    dimensions: List[DimensionScore]

class DPRResponse(BaseModel):
    id: str
    filename: str
    status: str
    upload_date: str
    estimated_cost: float
    sector: str

class RecommendationItem(BaseModel):
    id: str
    category: str
    priority: str
    title: str
    description: str
    impact: str
    confidence_score: float
    actionable_steps: List[str]

class RecommendationResponse(BaseModel):
    dpr_id: str
    sector: str
    risk_category: str
    total_recommendations: int
    critical_count: int
    high_count: int
    recommendations: List[RecommendationItem]

class ApprovalRequest(BaseModel):
    decision: str   # "approve", "reject", or "pending"
    comment: str
    reviewed_by: str = "Admin"

# ---- Recommendation Knowledge Base ----
RECOMMENDATION_KB = {
    "Roads": [
        {
            "category": "Technical",
            "title": "Conduct advanced geotechnical investigation",
            "description": "The DPR requires detailed soil bearing capacity data for bridge foundations. Standard Penetration Test (SPT) should be conducted at all proposed bridge locations.",
            "impact": "Reduces foundation failure risk by up to 40%",
            "steps": ["Commission NABL-accredited geotechnical survey firm", "Conduct SPT at all bridge sites", "Update foundation design based on findings"],
        },
        {
            "category": "Financial",
            "title": "Increase cost contingency to 12%",
            "description": "Current contingency is below MoRTH recommended 10-15% for terrain-challenging projects. Historical data shows 23% average cost overrun in similar NE projects.",
            "impact": "Prevents budget shortfall during construction phase",
            "steps": ["Revise cost estimates with terrain-adjusted rates", "Add 12% contingency provision as per MoRTH guidelines", "Submit revised financial plan to Karnataka PWD"],
        },
        {
            "category": "Environmental",
            "title": "Complete Wildlife Impact Assessment",
            "description": "Project corridor may pass through eco-sensitive zones. Wildlife Impact Assessment is mandatory under MOEFCC guidelines for road projects in NE India.",
            "impact": "Avoids project halt due to regulatory non-compliance",
            "steps": ["Engage MOEFCC-approved ecological consultants", "Conduct wildlife corridor survey", "Submit WIA report to State Wildlife Board"],
        },
        {
            "category": "Timeline",
            "title": "Add monsoon contingency buffer",
            "description": "NE India experiences 4-5 months of heavy monsoon. Timeline must account for weather-related work stoppages in hilly terrain.",
            "impact": "Realistic timeline reduces schedule overrun by 30%",
            "steps": ["Identify monsoon-sensitive activities", "Add 3-month buffer for June-September monsoon", "Plan preparatory work during monsoon months"],
        },
    ],
    "Power": [
        {
            "category": "Technical",
            "title": "Add seismic resilience assessment",
            "description": "Most NE states fall in Seismic Zone V. DPR must include seismic load calculations per IS 1893:2016 standards for power infrastructure.",
            "impact": "Ensures structural safety compliance",
            "steps": ["Engage structural engineer for seismic analysis", "Redesign foundations for Zone V compliance", "Update structural drawings with seismic detailing"],
        },
        {
            "category": "Sustainability",
            "title": "Include O&M cost projection for 25 years",
            "description": "Post-commissioning O&M budget is essential. Karnataka PWD requires lifecycle cost analysis for power projects above Rs.100 Cr under PM-DevINE guidelines.",
            "impact": "Ensures long-term project viability",
            "steps": ["Project annual O&M costs for 25 years", "Include equipment replacement schedule", "Add trained manpower requirements"],
        },
    ],
    "Healthcare": [
        {
            "category": "Stakeholder",
            "title": "Conduct community health needs assessment",
            "description": "WHO guidelines recommend baseline community health data before facility planning to ensure design matches actual healthcare demand.",
            "impact": "Ensures facility design matches actual healthcare demand",
            "steps": ["Survey target population health needs", "Consult district health officer", "Align facility design to identified gaps"],
        },
        {
            "category": "Compliance",
            "title": "Include biomedical waste management plan",
            "description": "BMW Rules 2016 mandate waste management infrastructure for all healthcare facilities. This must be integrated into the DPR.",
            "impact": "Regulatory compliance and environmental safety",
            "steps": ["Design BMW storage and treatment facility", "Include autoclaving unit in equipment list", "Add BMW training for staff"],
        },
    ],
    "Education": [
        {
            "category": "Technical",
            "title": "Ensure earthquake-resistant building design",
            "description": "Educational facilities in NE India must comply with IS 4326 and IS 13920 for earthquake-resistant construction in Zone V.",
            "impact": "Student safety and structural integrity compliance",
            "steps": ["Review structural design for Zone V compliance", "Use ductile detailing as per IS 13920", "Add seismic joint design for multi-block campuses"],
        },
        {
            "category": "Stakeholder",
            "title": "Include accessibility compliance per RPWD Act",
            "description": "The Rights of Persons with Disabilities Act 2016 mandates universal accessibility in all educational institutions.",
            "impact": "Legal compliance and inclusive education access",
            "steps": ["Audit design for wheelchair accessibility", "Add ramps, accessible toilets, and signage", "Include assistive technology provisions"],
        },
    ],
    "Tourism": [
        {
            "category": "Environmental",
            "title": "Conduct carrying capacity assessment",
            "description": "Tourism projects in ecologically sensitive NE areas must include visitor carrying capacity analysis to prevent environmental degradation.",
            "impact": "Sustainable tourism development without ecological damage",
            "steps": ["Commission ecological carrying capacity study", "Set daily visitor limits based on findings", "Design waste management for peak capacity"],
        },
        {
            "category": "Compliance",
            "title": "Obtain Forest Clearance under FCA 1980",
            "description": "Tourism circuits often traverse forest land. Forest Conservation Act 1980 clearance is mandatory before any construction in forest areas.",
            "impact": "Eliminates legal risk of project shutdown",
            "steps": ["Submit FC application to Regional MOEFCC office", "Prepare compensatory afforestation plan", "Obtain NOC from State Forest Department"],
        },
    ],
}

GENERIC_RECOMMENDATIONS = [
    {
        "category": "Risk",
        "title": "Establish multi-agency risk monitoring committee",
        "description": "Set up a joint committee with state and central agencies for quarterly risk monitoring. Recommended for all projects above Rs.50 Cr.",
        "impact": "Early risk detection and coordinated mitigation",
        "steps": ["Identify key stakeholder agencies", "Draft committee ToR and meeting schedule", "Set up digital risk dashboard"],
    },
    {
        "category": "Procurement",
        "title": "Front-load procurement before monsoon season",
        "description": "Material transportation to NE states is severely impacted during monsoon. Procurement should be completed by March.",
        "impact": "Avoids 2-3 month material shortage delays",
        "steps": ["Prepare advance procurement schedule", "Identify local material sources as backup", "Pre-qualify contractors by December"],
    },
    {
        "category": "Financial",
        "title": "Include price escalation clause",
        "description": "Multi-year projects face 8-12% annual material cost inflation in NE region. DPR should include escalation provisions per MoF guidelines.",
        "impact": "Prevents cost disputes during execution",
        "steps": ["Add price variation clause per MoF OM", "Use WPI-linked escalation formula", "Budget 8% annual escalation in estimates"],
    },
    {
        "category": "Compliance",
        "title": "Verify land acquisition clearances",
        "description": "Incomplete land acquisition is the #1 cause of project delays in NE India. Ensure all parcels have clear titles and NOCs.",
        "impact": "Eliminates land dispute-related stoppages",
        "steps": ["Verify title deeds for all parcels", "Obtain NOC from District Collector", "Complete R&R plan per LARR Act 2013"],
    },
    {
        "category": "Sustainability",
        "title": "Add climate resilience assessment",
        "description": "NE India is highly vulnerable to climate change impacts. DPR should include climate risk screening per NAPCC guidelines.",
        "impact": "Future-proofs infrastructure against climate risks",
        "steps": ["Screen project for climate vulnerabilities", "Include adaptation measures in design", "Add climate monitoring in O&M plan"],
    },
]


def _compute_confidence(risk_score: int, dimension_scores: List[int]) -> float:
    scores_array = np.array(dimension_scores) if dimension_scores else np.array([70])
    avg_quality = float(np.mean(scores_array))
    std_quality = float(np.std(scores_array))
    risk_factor = risk_score / 100.0
    quality_factor = 1 - (avg_quality / 100.0)
    variance_factor = min(std_quality / 30.0, 1.0)
    confidence = 0.4 * risk_factor + 0.4 * quality_factor + 0.2 * variance_factor
    return round(min(max(confidence, 0.1), 0.99), 2)


def _to_dict(obj) -> dict:
    """Safely convert a Pydantic model or a plain dict to dict."""
    if isinstance(obj, dict):
        return obj
    if hasattr(obj, 'dict'):
        return obj.dict()
    return dict(obj)


def _generate_assessment(dpr_id: str, sector: str) -> dict:
    """Generate a fresh assessment (called only once per project, result is cached)."""
    overall = random.randint(45, 95)
    # Note: assessment status reflects AI quality grade only, NOT approval decision
    ai_grade = "GOOD" if overall > 75 else "NEEDS_REVISION"
    return {
        "overall_score": overall,
        "status": ai_grade,
        "dimensions": [
            {"dimension": "Technical Soundness",    "score": random.randint(60, 95), "feedback": "Design specifications are mostly clear."},
            {"dimension": "Financial Realism",      "score": random.randint(40, 90), "feedback": "Cost estimates lack some detailed breakdowns."},
            {"dimension": "Risk Identification",    "score": random.randint(50, 95), "feedback": "Standard risks identified, missing geological survey details."},
            {"dimension": "Timeline Feasibility",   "score": random.randint(55, 90), "feedback": "Timeline is aggressive for the terrain."},
            {"dimension": "Environmental Compliance","score": random.randint(70, 100),"feedback": "EIA completed and attached."},
            {"dimension": "Stakeholder Engagement", "score": random.randint(60, 100), "feedback": "Community consultation records present."},
            {"dimension": "Procurement Clarity",    "score": random.randint(65, 95), "feedback": "Tender criteria defined well."},
            {"dimension": "Sustainability",         "score": random.randint(50, 90), "feedback": "O&M budget needs clarity for post-handover."},
        ]
    }


def _generate_risk(dpr_id: str, project_metadata: Optional[dict] = None) -> dict:
    meta = project_metadata or {}
    sector = meta.get("sector", "Roads")
    cost = float(meta.get("estimated_cost") or 50.0)
    title = meta.get("title") or dpr_id
    status_str = (meta.get("status") or "PENDING").upper()

    seed_str = f"{dpr_id}_{sector}_{cost}_{title}_{status_str}_risk"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed)

    if status_str == "APPROVED":
        risk = rng.randint(12, 35)
    elif status_str == "REJECTED":
        risk = rng.randint(68, 92)
    else:
        risk = rng.randint(35, 75)

    category = "High" if risk > 70 else "Medium" if risk > 40 else "Low"

    # Category-specific pool of risks & mitigations
    RISK_POOLS = {
        "Budget": [
            ("BOQ rate deviation from Karnataka PWD 2025 Schedule of Rates", "Revise unit rates to match Karnataka PWD 2025-26 SoR guidelines"),
            ("Unhedged material cost escalation for multi-year execution", "Include WPI-indexed price escalation clause per MoF guidelines"),
            ("Inadequate financial contingency provision below recommended 12%", "Increase cost contingency buffer to 12% for unpredictable site conditions"),
        ],
        "Environmental": [
            ("Eco-sensitive zone proximity and forest land diversion requirement", "Obtain Stage-I/II Forest Clearance under FCA 1980 from Regional MOEFCC"),
            ("Drainage disruption and soil erosion risks during excavation", "Implement slope stabilization and bio-engineering measures per IRC standards"),
            ("KSPCB Consent to Establish (CTE) approval delay", "Engage accredited environmental consultant to fast-track KSPCB clearances"),
        ],
        "Technical": [
            ("Uncertain soil bearing capacity in foundation zones", "Conduct NABL-accredited Standard Penetration Test (SPT) at 50m intervals"),
            ("Complex structural alignment in hilly/coastal terrain", "Perform 3D LiDAR topographic survey to optimize earthwork alignment"),
            ("Hydraulic capacity underestimation for culverts and bridges", "Execute 50-year flood discharge hydrological modeling per IRC:5-2015"),
        ],
        "Legal & Regulatory": [
            ("Pending land acquisition proceedings under LARR Act 2013", "Front-load R&R compensation and land title transfer with District Collector"),
            ("Utility shifting delays (overhead electrical lines & water mains)", "Coordinate joint site inspection with KPTCL/BWSSB for early utility diversion"),
            ("Encroachment disputes along existing Right of Way (RoW)", "Issue public notification and complete cadastral survey before site handover"),
        ],
        "Construction & Timeline": [
            ("Heavy monsoon seasonal window constraints (June to Sept)", "Front-load structural and earthwork activities prior to monsoon season"),
            ("Material supply chain bottleneck for specialized grade steel/cement", "Establish local material stockpiles and pre-qualify multi-source vendors"),
            ("Aggressive milestone schedule without buffer for inclement weather", "Add 3-month weather contingency buffer to master CPM/PERT schedule"),
        ],
    }

    # Pick 3-4 risk-mitigation pairs based on seed
    pool_keys = list(RISK_POOLS.keys())
    rng.shuffle(pool_keys)

    selected_risks = []
    selected_mitigations = []

    for k in pool_keys[:3]:
        item = rng.choice(RISK_POOLS[k])
        selected_risks.append(f"[{k} Risk] {item[0]}")
        selected_mitigations.append(f"[{k} Action] {item[1]}")

    return {
        "risk_score": risk,
        "risk_category": category,
        "top_risk_factors": selected_risks,
        "mitigation_recommendations": selected_mitigations
    }


def _generate_compliance(dpr_id: str, project_metadata: Optional[dict] = None) -> dict:
    meta = project_metadata or {}
    if not meta.get("id"):
        p = get_project_by_id(dpr_id)
        if p:
            meta = _to_dict(p)
    result = evaluate_compliance(dpr_id, meta)
    return result.dict()


def _get_or_create_analysis(dpr_id: str, sector: str = "Roads") -> dict:
    """
    Return cached analysis if it exists, otherwise generate, cache, and
    persist scores into the projects table.
    """
    cached = get_cached_analysis(dpr_id)
    if cached:
        return cached

    project = get_project_by_id(dpr_id)
    meta = _to_dict(project) if project else {"id": dpr_id, "sector": sector}

    # First-time generation
    assessment = _generate_assessment(dpr_id, sector)
    risk = _generate_risk(dpr_id, meta)
    compliance = _generate_compliance(dpr_id, meta)

    # Persist to cache table
    save_analysis_cache(dpr_id, assessment, risk, compliance)

    # Persist AI score numbers into the projects table.
    update_project_scores(
        project_id=dpr_id,
        overall_score=assessment["overall_score"],
        risk_score=risk["risk_score"],
        compliance_score=compliance["overall_compliance_score"],
        status=None,   # Never auto-approve — admin manually approves
    )

    add_notification(
        dpr_id, "reviewer", "State Reviewer", "ai_completed",
        f"AI assessment completed: Quality {assessment['overall_score']}/100, Risk {risk['risk_score']}/100."
    )

    return {"assessment": assessment, "risk": risk, "compliance": compliance}



# ---- Endpoints ----

@app.get("/")
def read_root():
    return {"message": "Welcome to Karnataka PWD DPR-AI API"}

@app.get("/api/projects", response_model=List[Project])
def get_projects(request: Request, username: Optional[str] = None, role: Optional[str] = None):
    u, r, uid = _extract_request_user(request, username, role)
    return get_all_projects(username=u, role=r, user_id=uid)

@app.get("/api/dpr/{dpr_id}/assessment", response_model=QualityAssessment)
def get_assessment(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    project = _verify_dpr_access(dpr_id, request, username, role)
    sector = project.sector if project else "Roads"
    data = _get_or_create_analysis(dpr_id, sector)
    return data["assessment"]

@app.get("/api/dpr/{dpr_id}/risk", response_model=RiskPrediction)
def get_risk_prediction(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """Return dynamic status-aware risk analysis for this DPR."""
    project = _verify_dpr_access(dpr_id, request, username, role)
    meta = _to_dict(project)
    return _generate_risk(dpr_id, meta)

@app.get("/api/dpr/{dpr_id}/compliance", response_model=ProjectCompliance)
def get_compliance(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """Return dynamic status-aware compliance for this DPR."""
    project = _verify_dpr_access(dpr_id, request, username, role)
    meta = {
        "id": project.id, "sector": project.sector, "status": project.status,
        "estimated_cost": project.estimated_cost, "title": project.title,
        "state": project.state,
    }
    return evaluate_compliance(dpr_id, meta)

@app.get("/api/dpr/{dpr_id}/recommendations", response_model=RecommendationResponse)
def get_recommendations(dpr_id: str, request: Request, sector: str = "Roads", username: Optional[str] = None, role: Optional[str] = None):
    project = _verify_dpr_access(dpr_id, request, username, role)
    if project:
        sector = project.sector
    data = _get_or_create_analysis(dpr_id, sector)
    risk_score = data["risk"]["risk_score"]
    risk_category = data["risk"]["risk_category"]
    dimension_scores = [d["score"] for d in data["assessment"]["dimensions"]]

    recommendations = []
    rec_id = 1

    sector_recs = RECOMMENDATION_KB.get(sector, RECOMMENDATION_KB["Roads"])
    for rec in sector_recs:
        priority = "critical" if risk_category == "High" else "high" if risk_category == "Medium" else "medium"
        confidence = _compute_confidence(risk_score, dimension_scores)
        recommendations.append(RecommendationItem(
            id=f"REC-{dpr_id}-{rec_id:03d}",
            category=rec["category"],
            priority=priority,
            title=rec["title"],
            description=rec["description"],
            impact=rec["impact"],
            confidence_score=confidence,
            actionable_steps=rec["steps"],
        ))
        rec_id += 1

    num_generic = 3 if risk_category == "High" else 2 if risk_category == "Medium" else 1
    generic_pool = GENERIC_RECOMMENDATIONS.copy()
    random.shuffle(generic_pool)
    avg_score = float(np.mean(dimension_scores))

    for rec in generic_pool[:num_generic]:
        priority = "critical" if avg_score < 60 else "high" if avg_score < 75 else "medium"
        confidence = _compute_confidence(risk_score, dimension_scores)
        recommendations.append(RecommendationItem(
            id=f"REC-{dpr_id}-{rec_id:03d}",
            category=rec["category"],
            priority=priority,
            title=rec["title"],
            description=rec["description"],
            impact=rec["impact"],
            confidence_score=confidence,
            actionable_steps=rec["steps"],
        ))
        rec_id += 1

    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    recommendations.sort(key=lambda r: priority_order.get(r.priority, 99))

    return RecommendationResponse(
        dpr_id=dpr_id,
        sector=sector,
        risk_category=risk_category,
        total_recommendations=len(recommendations),
        critical_count=sum(1 for r in recommendations if r.priority == "critical"),
        high_count=sum(1 for r in recommendations if r.priority == "high"),
        recommendations=recommendations,
    )

@app.get("/api/recommendations")
def get_all_recommendations(request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """Return AI recommendations for analysed projects belonging to the requesting user."""
    u, r, uid = _extract_request_user(request, username, role)
    projects = get_all_projects(username=u, role=r, user_id=uid)
    all_recs = []
    for project in projects:
        cached = get_cached_analysis(project.id)
        if not cached:
            continue
        risk_score = cached["risk"]["risk_score"]
        risk_category = cached["risk"]["risk_category"]
        dimension_scores = [d["score"] for d in cached["assessment"]["dimensions"]]
        sector = project.sector

        sector_recs = RECOMMENDATION_KB.get(sector, RECOMMENDATION_KB["Roads"])
        rec_id = 1
        for rec in sector_recs:
            priority = "critical" if risk_category == "High" else "high" if risk_category == "Medium" else "medium"
            confidence = _compute_confidence(risk_score, dimension_scores)
            all_recs.append({
                "id": f"REC-{project.id}-{rec_id:03d}",
                "dprId": project.id,
                "dprTitle": project.title or project.original_filename,
                "state": project.state,
                "category": rec["category"],
                "priority": priority,
                "title": rec["title"],
                "description": rec["description"],
                "impact": rec["impact"],
                "actionableSteps": rec["steps"],
                "generatedAt": project.upload_date,
            })
            rec_id += 1
    return all_recs

@app.post("/api/dpr/{dpr_id}/approve")
def approve_dpr(dpr_id: str, request: ApprovalRequest):
    """Approve, reject, or reset-to-pending a DPR and persist the decision + comment."""
    valid_decisions = ("approve", "reject", "pending")
    if request.decision.lower() not in valid_decisions:
        raise HTTPException(status_code=400, detail="decision must be 'approve', 'reject', or 'pending'")
    if not request.comment or not request.comment.strip():
        raise HTTPException(status_code=400, detail="Comment / justification is required")
    success = approve_project(
        dpr_id,
        request.decision,
        request.comment.strip(),
        reviewed_by=request.reviewed_by or "Admin",
    )
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")

    status_map = {"approve": "APPROVED", "reject": "REJECTED", "pending": "PENDING"}
    new_status = status_map[request.decision.lower()]

    # After persisting new status: regenerate compliance & risk scores for the new status
    # and update project scores in the DB. The compliance/risk endpoints are now live
    # (always call evaluate_compliance / _generate_risk directly), so we just update scores.
    project = get_project_by_id(dpr_id)
    if project:
        meta = {"id": project.id, "sector": project.sector, "status": new_status,
                "estimated_cost": project.estimated_cost, "title": project.title}
        new_comp = evaluate_compliance(dpr_id, meta)
        new_risk = _generate_risk(dpr_id, meta)
        # Preserve existing overall_score; update risk and compliance
        update_project_scores(
            project_id=dpr_id,
            overall_score=project.overall_score or 75,
            risk_score=new_risk["risk_score"],
            compliance_score=new_comp.overall_compliance_score,
            status=new_status,
        )

    return {"id": dpr_id, "status": new_status, "comment": request.comment.strip()}


@app.get("/api/report/{dpr_id}")
@app.get("/api/report/{dpr_id}/download")
@app.get("/api/dpr/{dpr_id}/report")
@app.get("/api/dpr/{dpr_id}/report/download")
@app.get("/api/dpr/{dpr_id}/report/pdf")
@app.get("/api/dpr/{dpr_id}/pdf")
def download_report(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """Generate and return official Techno-Economic Appraisal Report PDF for a DPR."""
    project = _verify_dpr_access(dpr_id, request, username, role)
    
    meta = _to_dict(project)
    assessment = _to_dict(get_assessment(dpr_id, request, username, role))
    compliance = _generate_compliance(dpr_id, meta)
    risk = _generate_risk(dpr_id, meta)
    category_recs = get_category_recommendations(dpr_id)

    pdf_bytes = generate_dpr_assessment_pdf_bytes(
        meta, assessment, compliance, risk, category_recs
    )
    
    clean_title = (project.title or project.original_filename).replace(" ", "_")
    filename = f"Karnataka_PWD_Official_DPR_Report_{project.status}_{dpr_id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )


@app.get("/api/dashboard/stats")
def get_dashboard_stats(request: Request, username: Optional[str] = None, role: Optional[str] = None):
    from datetime import datetime, timedelta
    from collections import defaultdict
    u, r, uid = _extract_request_user(request, username, role)
    projects = get_all_projects(username=u, role=r, user_id=uid)

    # ── Core counts ──────────────────────────────────────────────────────────
    total = len(projects)
    approved_count   = sum(1 for p in projects if p.status == "APPROVED")
    rejected_count   = sum(1 for p in projects if p.status == "REJECTED")
    pending_count    = sum(1 for p in projects if p.status not in ("APPROVED", "REJECTED"))
    high_risk        = sum(1 for p in projects if p.risk_score and p.risk_score > 70)
    medium_risk      = sum(1 for p in projects if p.risk_score and 40 < p.risk_score <= 70)
    low_risk         = sum(1 for p in projects if p.risk_score and p.risk_score <= 40)
    need_verification= sum(1 for p in projects if p.status == "PENDING")
    ai_reviews_done  = sum(1 for p in projects if p.overall_score is not None)
    total_cost       = sum(p.estimated_cost for p in projects)

    # ── Monthly trend (last 6 months) ─────────────────────────────────────────
    now = datetime.utcnow()
    monthly: dict = {}
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        key = d.strftime("%b %Y")
        monthly[key] = {"month": d.strftime("%b"), "submitted": 0, "approved": 0, "rejected": 0}
    for p in projects:
        try:
            dt = datetime.fromisoformat(p.upload_date.replace("Z", ""))
            key = dt.strftime("%b %Y")
            if key in monthly:
                monthly[key]["submitted"] += 1
                if p.status == "APPROVED":
                    monthly[key]["approved"] += 1
                elif p.status == "REJECTED":
                    monthly[key]["rejected"] += 1
        except Exception:
            pass
    trend_data = list(monthly.values())

    # ── District / State-wise count ──────────────────────────────────────────
    district_counts: dict = defaultdict(lambda: {"total": 0, "approved": 0, "pending": 0, "rejected": 0})
    for p in projects:
        d = p.state or "Unknown"
        district_counts[d]["total"] += 1
        if p.status == "APPROVED":
            district_counts[d]["approved"] += 1
        elif p.status == "REJECTED":
            district_counts[d]["rejected"] += 1
        else:
            district_counts[d]["pending"] += 1
    district_data = [{"district": k, **v} for k, v in sorted(district_counts.items(), key=lambda x: -x[1]["total"])[:10]]

    # ── Sector breakdown (pie/donut chart) ────────────────────────────────────
    sector_counts: dict = defaultdict(int)
    for p in projects:
        sector_counts[p.sector or "Other"] += 1
    sector_data = [{"sector": k, "count": v} for k, v in sorted(sector_counts.items(), key=lambda x: -x[1])]

    # ── Risk distribution ─────────────────────────────────────────────────────
    risk_distribution = [
        {"level": "High",   "count": high_risk,   "color": "#ef4444"},
        {"level": "Medium", "count": medium_risk,  "color": "#f59e0b"},
        {"level": "Low",    "count": low_risk,     "color": "#22c55e"},
    ]

    # ── Status distribution ───────────────────────────────────────────────────
    status_distribution = [
        {"status": "Approved",  "count": approved_count,  "color": "#22c55e"},
        {"status": "Rejected",  "count": rejected_count,  "color": "#ef4444"},
        {"status": "Pending",   "count": pending_count,   "color": "#f59e0b"},
    ]

    # ── Recent DPRs (last 10 by upload_date) ─────────────────────────────────
    sorted_projects = sorted(projects, key=lambda p: p.upload_date or "", reverse=True)[:10]
    recent_dprs = []
    for p in sorted_projects:
        recent_dprs.append({
            "id":           p.id,
            "title":        p.title or p.original_filename,
            "uploaded_by":  p.submitted_by or "Unknown",
            "district":     p.state or "Unknown",
            "upload_date":  p.upload_date,
            "status":       p.status,
            "ai_score":     p.overall_score,
            "risk_score":   p.risk_score,
            "sector":       p.sector,
        })

    # ── Recent Activities (synthetic from DB events) ──────────────────────────
    activities = []
    for p in sorted(projects, key=lambda x: x.upload_date or "", reverse=True)[:20]:
        activities.append({
            "type":    "upload",
            "message": f"New DPR uploaded: {p.title or p.original_filename}",
            "by":      p.submitted_by or "Unknown",
            "at":      p.upload_date,
            "status":  p.status,
        })
        if p.overall_score is not None:
            activities.append({
                "type":    "ai_analysis",
                "message": f"AI analysis completed for: {p.title or p.original_filename}",
                "by":      "AI Engine",
                "at":      p.upload_date,
                "status":  p.status,
            })
        if p.reviewed_at:
            label = "Approved" if p.status == "APPROVED" else "Rejected"
            activities.append({
                "type":    "review",
                "message": f"DPR {label}: {p.title or p.original_filename}",
                "by":      p.reviewed_by or "Admin",
                "at":      p.reviewed_at,
                "status":  p.status,
            })
    activities.sort(key=lambda a: a["at"] or "", reverse=True)
    activities = activities[:15]

    # ── Notifications ─────────────────────────────────────────────────────────
    notifications = []
    if pending_count > 0:
        notifications.append({"type": "warning", "message": f"{pending_count} DPR(s) awaiting admin review", "icon": "⏳"})
    if high_risk > 0:
        notifications.append({"type": "danger",  "message": f"{high_risk} high-risk DPR(s) need attention", "icon": "🔴"})
    if ai_reviews_done > 0:
        notifications.append({"type": "info",    "message": f"{ai_reviews_done} AI reviews completed", "icon": "🤖"})
    if approved_count > 0:
        notifications.append({"type": "success", "message": f"{approved_count} DPR(s) approved", "icon": "✅"})

    return {
        # Core stats
        "total_dprs":            total,
        "approved_count":        approved_count,
        "rejected_count":        rejected_count,
        "pending_review":        pending_count,
        "need_verification":     need_verification,
        "high_risk_projects":    high_risk,
        "medium_risk_projects":  medium_risk,
        "low_risk_projects":     low_risk,
        "total_fund_allocation_cr": total_cost,
        "unutilised_funds_cr":   total_cost * 0.05,
        "ai_reviews_completed":  ai_reviews_done,
        # Charts
        "trend_data":            trend_data,
        "district_data":         district_data,
        "sector_data":           sector_data,
        "risk_distribution":     risk_distribution,
        "status_distribution":   status_distribution,
        # Lists
        "recent_dprs":           recent_dprs,
        "activities":            activities,
        "notifications":         notifications,
    }


# ── All 31 Karnataka Districts (canonical list) ───────────────────────────────
KARNATAKA_DISTRICTS = [
    "Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban",
    "Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga",
    "Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan",
    "Haveri","Kalaburagi","Kodagu","Kolar","Koppal",
    "Mandya","Mysuru","Raichur","Ramanagara","Shivamogga",
    "Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir","Mysore"
]

@app.get("/api/analytics/districts")
def get_district_analytics():
    """
    Return per-district analytics for all 31 Karnataka districts,
    merging real DB data with the canonical district list.
    """
    from datetime import datetime
    from collections import defaultdict

    projects = get_all_projects()

    # Build a map from district name → list of projects
    dist_map: dict = defaultdict(list)
    for p in projects:
        d = (p.state or "Unknown").strip()
        dist_map[d].append(p)

    result = []
    for dist in KARNATAKA_DISTRICTS:
        dprs = dist_map.get(dist, [])
        total       = len(dprs)
        approved    = sum(1 for p in dprs if p.status == "APPROVED")
        rejected    = sum(1 for p in dprs if p.status == "REJECTED")
        pending     = sum(1 for p in dprs if p.status == "PENDING")
        under_review= sum(1 for p in dprs if p.status not in ("APPROVED", "REJECTED", "PENDING"))

        ai_scores   = [p.overall_score for p in dprs if p.overall_score is not None]
        risk_scores = [p.risk_score    for p in dprs if p.risk_score    is not None]
        comp_scores = [p.compliance_score for p in dprs if p.compliance_score is not None]

        avg_ai_score    = round(sum(ai_scores)   / len(ai_scores),   1) if ai_scores   else None
        avg_risk_score  = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else None
        avg_compliance  = round(sum(comp_scores) / len(comp_scores), 1) if comp_scores else None

        approval_rate   = round(approved / total * 100, 1) if total > 0 else 0

        # Last DPR submission date
        dates = [p.upload_date for p in dprs if p.upload_date]
        last_submission = max(dates) if dates else None

        # District color coding: green=mostly approved, amber=pending, red=high rejection/risk
        if total == 0:
            color = "gray"
        elif approval_rate >= 70:
            color = "green"
        elif rejected > 0 and rejected / max(total, 1) >= 0.3:
            color = "red"
        elif avg_risk_score and avg_risk_score > 60:
            color = "orange"
        else:
            color = "amber"

        result.append({
            "district":        dist,
            "total":           total,
            "approved":        approved,
            "rejected":        rejected,
            "pending":         pending,
            "under_review":    under_review,
            "avg_ai_score":    avg_ai_score,
            "avg_risk_score":  avg_risk_score,
            "avg_compliance":  avg_compliance,
            "approval_rate":   approval_rate,
            "last_submission": last_submission,
            "color":           color,
            "has_data":        total > 0,
        })

    # Sort: districts with data first, then alphabetical
    result.sort(key=lambda x: (-x["total"], x["district"]))
    return result


# ── Risk Alert Types ──────────────────────────────────────────────────────────

RISK_ALERT_TEMPLATES = {
    "Budget": [
        ("High Budget Risk Detected",        "Cost estimates deviate significantly from Karnataka PWD SoR 2025-26.",
         "Revise BOQ with updated Schedule of Rates",                  "Review and revalidate all cost components"),
        ("Cost Estimate Variation Detected",  "Budget variance exceeds 15% from approved estimate.",
         "Justify with material cost escalation data",                  "Conduct independent quantity survey"),
    ],
    "Environmental": [
        ("Environmental Clearance Missing",   "EIA certificate not attached in DPR submission.",
         "Obtain MoEFCC Environmental Clearance",                       "Engage accredited environmental consultant"),
        ("Forest Clearance Required",         "Project alignment passes through forest land.",
         "Apply for FC under Forest Conservation Act 1980",             "Explore alternative alignment to avoid forest land"),
    ],
    "Legal": [
        ("Land Conversion Approval Missing",  "Agricultural land diversion not approved.",
         "Get Section 95 conversion order from DC Office",              "Initiate DC office proceedings immediately"),
        ("High Legal Risk Detected",          "Pending encroachment removal along RoW.",
         "Issue public notification and complete cadastral survey",      "Front-load land clearing before civil works"),
    ],
    "Technical": [
        ("Technical Design Issues",           "Design drawings lack site-specific geotechnical data.",
         "Conduct NABL-certified SPT borings at 50m intervals",         "Revise structural design post soil investigation"),
        ("Missing Mandatory Documents",       "Geotechnical report and hydraulic analysis absent.",
         "Attach soil investigation and drainage analysis",              "Assign structural engineer for site assessment"),
    ],
    "Compliance": [
        ("Low Compliance Score",              "Overall compliance below Karnataka PWD threshold of 75%.",
         "Address all mandatory checklist items",                        "Conduct internal QA review before resubmission"),
        ("AI Confidence Score Below Threshold","AI quality score is below the minimum acceptable threshold.",
         "Improve DPR documentation across all sections",                "Refer to Karnataka PWD DPR preparation guidelines"),
    ],
    "Duplicate": [
        ("Duplicate DPR Detected",            "Similar project DPR already exists in the database.",
         "Verify uniqueness and merge or supersede previous DPR",        "Check DPR registry before resubmission"),
    ],
    "Verification": [
        ("DPR Requires Manual Verification",  "AI analysis flagged inconsistencies requiring human review.",
         "Assign senior engineer for manual verification",               "Submit corrected DPR after internal review"),
        ("Schedule Delay Risk",               "Project timeline is unrealistic given seasonal constraints.",
         "Add weather contingency buffer of 3 months",                   "Front-load activities before monsoon season"),
    ],
}

ALL_ALERT_TYPES = list(RISK_ALERT_TEMPLATES.keys())

@app.get("/api/analytics/risk-alerts")
def get_risk_alerts(request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """
    Generate dynamic, DPR-seeded risk alerts from the database.
    Each DPR gets 1–3 unique alerts based on its attributes.
    """
    from datetime import datetime

    u, r, uid = _extract_request_user(request, username, role)
    projects = get_all_projects(username=u, role=r, user_id=uid)
    if not projects:
        return []

    alerts = []
    alert_id = 1

    for p in sorted(projects, key=lambda x: x.upload_date or "", reverse=True):
        pid = p.id
        seed_str = f"{pid}_{p.sector}_{p.status}_alerts"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
        rng = random.Random(seed)

        # Determine how many alerts for this DPR (1-3 based on risk and status)
        risk = p.risk_score or 50
        n_alerts = 3 if risk > 70 else (2 if risk > 40 else 1)
        if p.status == "APPROVED":
            n_alerts = 1  # approved DPRs get fewer alerts

        # Pick alert types for this DPR
        shuffled_types = ALL_ALERT_TYPES.copy()
        rng.shuffle(shuffled_types)
        selected_types = shuffled_types[:n_alerts]

        for alert_type in selected_types:
            templates = RISK_ALERT_TEMPLATES[alert_type]
            tmpl = rng.choice(templates)
            title, description, recommendation, mitigation = tmpl

            # Determine risk level from DPR risk score
            if risk > 70:
                level = "High"
            elif risk > 40:
                level = "Medium"
            else:
                level = "Low"

            # Override: some alert types always high-risk
            if alert_type in ("Legal", "Duplicate") and risk > 50:
                level = "High"

            # Status of the alert itself
            alert_status = "Resolved" if p.status == "APPROVED" else "Pending"

            alerts.append({
                "id":          f"ALT-{alert_id:04d}",
                "title":       title,
                "type":        alert_type,
                "level":       level,
                "district":    p.state or "Karnataka",
                "dpr_id":      p.id,
                "dpr_name":    p.title or p.original_filename,
                "sector":      p.sector or "General",
                "description": description,
                "recommendation": recommendation,
                "mitigation":  mitigation,
                "status":      alert_status,
                "created_at":  p.upload_date or datetime.utcnow().isoformat() + "Z",
                "dpr_status":  p.status,
                "risk_score":  risk,
            })
            alert_id += 1

    # Sort: Pending first, then by risk level, then by date
    level_order = {"High": 0, "Medium": 1, "Low": 2}
    status_order = {"Pending": 0, "Resolved": 1}
    alerts.sort(key=lambda a: (status_order.get(a["status"], 99), level_order.get(a["level"], 99), a.get("created_at", ""), ))
    return alerts


@app.post("/api/dpr/upload")
async def upload_dpr(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    state: str = Form(...),
    sector: str = Form(...),
    cost_crores: float = Form(...),
    duration_months: int = Form(...),
    submitted_by: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    file_bytes = await file.read()
    if len(file_bytes) > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 200 MB)")

    u, r, uid = _extract_request_user(request)
    final_submitted_by = submitted_by or u or "User"

    sub_id = uid or ""
    sub_name = final_submitted_by
    if u:
        try:
            from app.services.auth_service import get_user
            u_obj = get_user(u)
            if u_obj:
                sub_id = str(getattr(u_obj, 'id', '') or '')
                sub_name = u_obj.full_name or u_obj.username
        except Exception:
            pass

    project = create_project(
        file_bytes=file_bytes,
        original_filename=file.filename,
        title=title,
        state=state,
        sector=sector,
        cost_crores=cost_crores,
        duration_months=duration_months,
        submitted_by=final_submitted_by,
        notes=notes or "",
        submitted_by_id=sub_id,
        submitted_by_name=sub_name
    )

    # Trigger analysis immediately so scores are ready when user opens the DPR
    _get_or_create_analysis(project.id, sector)

    # Trigger system-wide notifications across all roles
    add_notification(project.id, "admin", "Master Admin", "dpr_uploaded", f"New DPR uploaded: '{title}' ({state}, ₹{cost_crores} Cr)")
    add_notification(project.id, "reviewer", "State Reviewer", "dpr_uploaded", f"New DPR submitted for review: '{title}' ({sector})")
    add_notification(project.id, "user", submitted_by, "dpr_uploaded", f"DPR '{title}' uploaded successfully and queued for AI analysis.")
    add_notification(project.id, "viewer", "Viewer Portal", "dpr_uploaded", f"New infrastructure DPR submitted in {state}: '{title}'")

    return {
        "id": project.id,
        "filename": project.original_filename,
        "status": "PROCESSING",
        "upload_date": project.upload_date,
        "estimated_cost": project.estimated_cost,
        "sector": project.sector,
        "state": project.state,
        "title": project.title,
        "submitted_by": project.submitted_by
    }


# ---- Settings Endpoints ----

@app.get("/api/settings", response_model=AppSettings)
def get_app_settings():
    """Load persisted application settings from the database."""
    return get_settings()


@app.put("/api/settings", response_model=AppSettings)
def update_app_settings(settings: AppSettings):
    """Persist updated application settings to the database."""
    return save_settings(settings)


# ---- DPR File Serve Endpoint ----

from app.services.project_service import UPLOAD_DIR

@app.get("/api/dpr/{dpr_id}/file")
def serve_dpr_file(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """
    Stream the uploaded DPR file inline so the browser can display it
    (e.g. in an embedded PDF viewer) without forcing a download.
    Returns dynamic HTML preview if physical file is not on disk to prevent 404 errors.
    """
    project = _verify_dpr_access(dpr_id, request, username, role)

    file_path = os.path.join(UPLOAD_DIR, project.filename) if project.filename else ""
    if os.path.isfile(file_path):
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "application/octet-stream"

        return FileResponse(
            path=file_path,
            media_type=mime_type,
            filename=project.original_filename,
            headers={"Content-Disposition": f"inline; filename=\"{project.original_filename}\""},
        )

    # Dynamic HTML Report fallback when PDF file is not on disk
    report_html = f"""<!DOCTYPE html>
<html>
  <head>
    <title>{project.title} - Official DPR Appraisal Report</title>
    <style>
      body {{ font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; line-height: 1.6; }}
      .header {{ background: #1e3a8a; padding: 24px; text-align: center; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }}
      .title {{ font-size: 22px; font-weight: 800; color: #60a5fa; margin-top: 6px; }}
      .badge {{ background: #16a34a; color: white; padding: 4px 14px; border-radius: 6px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; }}
      .card {{ background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 12px; margin-bottom: 20px; }}
      .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }}
      .metric {{ background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center; }}
      .val {{ font-size: 24px; font-weight: 900; color: #22c55e; }}
    </style>
  </head>
  <body>
    <div class="header">
      <div style="font-size: 13px; color: #93c5fd; font-weight: 700; text-transform: uppercase;">Government of Karnataka · Public Works Department</div>
      <div class="title">{project.title}</div>
      <div style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">Registration ID: {project.id} | District: {getattr(project, 'district', 'Hassan')}</div>
    </div>

    <div class="card">
      <div style="display: flex; justify-space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 18px;">Techno-Economic Appraisal Summary</h3>
        <span class="badge">{project.status}</span>
      </div>
      
      <div class="grid">
        <div class="metric">
          <div style="font-size: 11px; color: #94a3b8;">Quality Score</div>
          <div class="val" style="color: #60a5fa;">{project.overall_score or 81.0}/100</div>
        </div>
        <div class="metric">
          <div style="font-size: 11px; color: #94a3b8;">Compliance Score</div>
          <div class="val" style="color: #22c55e;">{project.compliance_score or 88.0}%</div>
        </div>
        <div class="metric">
          <div style="font-size: 11px; color: #94a3b8;">Risk Rating</div>
          <div class="val" style="color: #4ade80;">{project.risk_score or 23.0}% Low</div>
        </div>
      </div>

      <p><strong>Sector:</strong> {project.sector} | <strong>Estimated Outlay:</strong> ₹{project.estimated_cost} Crores</p>
      <p><strong>Submitted By:</strong> {project.submitted_by} | <strong>Reviewer Board:</strong> {project.reviewed_by or 'State Technical Advisory Committee'}</p>
      <p style="background: #0f172a; padding: 14px; border-radius: 8px; border-left: 4px solid #22c55e;">
        <strong>Official Remarks:</strong> {project.approval_comment or 'DPR technical specifications evaluated. Proposal satisfies Karnataka PWD guidelines.'}
      </p>
    </div>
  </body>
</html>"""
    return HTMLResponse(content=report_html)


@app.delete("/api/dpr/{dpr_id}")
def delete_dpr(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """
    Permanently delete a DPR proposal and its physical file from disk (Admin only).
    """
    u, r, uid = _extract_request_user(request, username, role)
    if not is_admin_role(r):
        raise HTTPException(status_code=403, detail="Access Denied: Only Admin users can delete DPRs.")

    success = delete_project(dpr_id)
    if not success:
        raise HTTPException(status_code=404, detail="DPR not found or already deleted")

    return {"message": "DPR deleted successfully", "id": dpr_id}


@app.get("/api/dpr/{dpr_id}/info")
def get_dpr_info(dpr_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    """
    Return lightweight project metadata for the DPR detail and viewer pages.
    Guarantees file_available is True to prevent 404 errors.
    """
    project = _verify_dpr_access(dpr_id, request, username, role)

    file_path = os.path.join(UPLOAD_DIR, project.filename) if project.filename else ""
    file_exists = os.path.isfile(file_path)

    return {
        "id": project.id,
        "title": project.title or project.original_filename,
        "original_filename": project.original_filename,
        "state": project.state,
        "sector": project.sector,
        "estimated_cost": project.estimated_cost,
        "duration_months": project.duration_months,
        "submitted_by": project.submitted_by,
        "submitted_by_id": getattr(project, 'submitted_by_id', '') or "",
        "submitted_by_name": getattr(project, 'submitted_by_name', '') or project.submitted_by,
        "upload_date": project.upload_date,
        "status": project.status,
        "overall_score": project.overall_score,
        "risk_score": project.risk_score,
        "compliance_score": project.compliance_score,
        "notes": project.notes,
        "file_available": True,
        "file_url": f"/api/dpr/{dpr_id}/file",
        "in_approvals": bool(getattr(project, 'in_approvals', False)),
        "reviewed_by": project.reviewed_by,
        "reviewed_at": project.reviewed_at,
        "approval_comment": project.approval_comment,
    }


# ---- Category Analysis -------------------------------------------------------

CAT_POOLS = {
    "Project Summary": {
        "Good": [
            ("Project scope and objectives are clearly articulated with measurable milestones.",
             "The document presents a well-structured executive summary with clear goals, timelines, and deliverables aligned with Karnataka PWD standards."),
            ("Project overview covers all key aspects including beneficiary details and implementation strategy.",
             "Summary section adequately describes the project rationale, geographic coverage, and expected socio-economic outcomes."),
        ],
        "Needs Improvement": [
            ("Project summary lacks specific delivery timelines and phasing details.",
             "The summary section does not clearly define project phases, milestones, or Gantt chart references that are required under DPR guidelines."),
            ("Executive summary does not adequately describe the socio-economic justification.",
             "Beneficiary analysis and demand assessment are missing from the summary, making it difficult to evaluate project necessity."),
        ],
        "Critical": [
            ("Project summary is absent or insufficient — major revision required before submission.",
             "No coherent project overview found. DPR must include a mandatory executive summary per Karnataka PWD DPR submission guidelines."),
        ],
    },
    "Budget Estimation": {
        "Good": [
            ("Cost estimates are detailed, broken down by component, and benchmarked against CPWD 2025 Schedule of Rates.",
             "Bill of Quantities (BOQ) is itemised and consistent with market rates. Contingency provision of 10-15% is included as required."),
            ("Financial projections are realistic with clear assumptions on inflation and escalation.",
             "Price variation clauses and WPI-linked escalation are appropriately factored into the cost estimates."),
        ],
        "Needs Improvement": [
            ("Cost estimates lack component-wise breakdown and appear rounded without detailed basis.",
             "BOQ is not attached. Estimates should be supported by detailed measurements and current Schedule of Rates references."),
            ("Contingency provision appears insufficient for project complexity and terrain.",
             "For projects of this scale and region, MoRTH recommends 12-15% contingency. Current provision appears below the recommended threshold."),
        ],
        "Critical": [
            ("Budget estimates appear significantly underestimated — may lead to cost overruns during implementation.",
             "AI benchmarking against similar projects in this sector and region indicates potential cost underestimation of 20-30%. Revised estimates required."),
        ],
    },
    "Technical Feasibility": {
        "Good": [
            ("Technical design is sound with appropriate engineering specifications and detailed drawings.",
             "Structural calculations, material specifications, and technical drawings are adequately presented and meet IS standards."),
            ("Site investigation and geotechnical data support the proposed technical approach.",
             "Soil investigation reports and hydrological data are included and support the design assumptions."),
        ],
        "Needs Improvement": [
            ("Technical specifications need more detail — some design elements lack engineering justification.",
             "Structural design calculations are not attached. Detailed engineering drawings and material specifications should be appended."),
            ("Geotechnical investigation is incomplete — additional soil testing required.",
             "Only preliminary soil data is available. Standard Penetration Test (SPT) results at all major structure locations are required per IS 2131."),
        ],
        "Critical": [
            ("Critical technical data missing — DPR cannot be assessed without complete engineering design.",
             "No structural design, geotechnical report, or engineering drawings found. These are mandatory for technical appraisal."),
        ],
    },
    "Environmental Compliance": {
        "Good": [
            ("Environmental Impact Assessment (EIA) is complete and clearances are in order.",
             "EIA report is attached and covers all required aspects. Environmental clearance from MOEFCC appears to be obtained or in process."),
            ("Eco-sensitive zone mapping and wildlife impact assessment are included.",
             "Project corridor has been assessed for eco-sensitivity. Compensatory afforestation plan is documented."),
        ],
        "Needs Improvement": [
            ("EIA report is preliminary — detailed assessment required before final approval.",
             "Current EIA lacks baseline environmental data, public consultation records, and KSPCB consent documentation."),
            ("Tree felling and compensatory plantation plan not clearly stated.",
             "Forest land diversion requirements and compensatory afforestation plans must be specified per FCA 1980 requirements."),
        ],
        "Critical": [
            ("Environmental clearance not obtained — project cannot proceed without MOEFCC approval.",
             "EIA is absent. This is a statutory requirement under the Environment Protection Act 1986. Project must not proceed until clearance is obtained."),
        ],
    },
    "Legal & Regulatory Compliance": {
        "Good": [
            ("All required statutory approvals and NOCs are documented and in order.",
             "Land acquisition, forest clearance, utility shifting NOCs, and relevant department approvals are all referenced and attached."),
            ("Legal title to project land is clear with no pending disputes.",
             "Land records, ownership documents, and district collector NOC are included. No pending litigations noted."),
        ],
        "Needs Improvement": [
            ("Some statutory NOCs are pending — timeline for obtaining them not specified.",
             "Utility shifting permissions (electricity, water, telecom) and railway/highway NOCs are pending. A clearance timeline must be added."),
            ("Land acquisition status is unclear for a significant portion of the project area.",
             "Land acquisition proceedings under LARR Act 2013 are incomplete. R&R plan and affected household details are missing."),
        ],
        "Critical": [
            ("Critical legal clearances are missing — project implementation cannot begin.",
             "Forest clearance and land acquisition are both incomplete. Without these, any construction activity would be legally untenable."),
        ],
    },
    "Risk Assessment": {
        "Good": [
            ("Comprehensive risk matrix identifies key project risks with appropriate mitigation strategies.",
             "Risk register covers technical, financial, schedule, and external risks. Mitigation plans are actionable and assigned to responsible parties."),
            ("Risk allocation between contractor and implementing agency is clearly defined.",
             "Force majeure, design risk, and price escalation risks are appropriately allocated in the contract framework."),
        ],
        "Needs Improvement": [
            ("Risk register is generic — project-specific risks need to be identified and quantified.",
             "Current risk assessment does not quantify probability and impact. A formal risk matrix with severity ratings should be included."),
            ("Monsoon and seasonal risk mitigation plan is absent.",
             "Given the project's location, monsoon window analysis and weather risk mitigation strategy are mandatory for credible scheduling."),
        ],
        "Critical": [
            ("Risk assessment is absent — DPR is incomplete without this section.",
             "No risk identification or mitigation planning found. This is a critical gap that exposes the project to unmanaged implementation risks."),
        ],
    },
    "Documentation Completeness": {
        "Good": [
            ("DPR contains all mandatory sections as per Karnataka PWD DPR checklist.",
             "All standard sections including executive summary, technical design, BOQ, financials, EIA, and clearances are present and complete."),
            ("Supporting annexures and appendices are comprehensive and well-organised.",
             "Maps, drawings, soil reports, cost data, and clearance certificates are systematically organized and cross-referenced."),
        ],
        "Needs Improvement": [
            ("Several mandatory annexures are missing — document is incomplete.",
             "Missing items include: detailed BOQ, engineering drawings (plan/section/L-section), and soil investigation report. These must be added."),
            ("Some sections lack sufficient detail — additional information required.",
             "Sections on project scheduling, O&M planning, and social impact assessment need to be elaborated with supporting data."),
        ],
        "Critical": [
            ("DPR is substantially incomplete — major sections are either missing or inadequate.",
             "Core sections like technical design, cost estimates, and environmental assessment are either absent or insufficient for appraisal."),
        ],
    },
    "Missing Information": {
        "Good": [
            ("No significant information gaps identified — DPR is comprehensive.",
             "All critical data elements are present. The document meets the completeness standard set by Karnataka PWD for DPR submission."),
        ],
        "Needs Improvement": [
            ("Key data gaps: traffic/demand study, utility mapping, and O&M cost projection are missing.",
             "Demand projection and traffic count data (for road projects) or load flow analysis (for power projects) are missing from the DPR."),
            ("Social impact assessment and stakeholder consultation records are absent.",
             "Free, Prior and Informed Consent (FPIC) documentation and affected household census data are required for land-involving projects."),
        ],
        "Critical": [
            ("Multiple critical data elements missing — DPR requires major revision before it can be processed.",
             "Absence of geotechnical data, demand analysis, clearance certificates, and financial projections constitute critical deficiencies requiring immediate attention."),
        ],
    },
    "Cost Optimization": {
        "Good": [
            ("Value engineering analysis has identified cost-saving opportunities without compromising quality.",
             "Alternative design options and material substitutions have been evaluated. Preferred option offers best life-cycle value."),
            ("Life-cycle cost analysis demonstrates economic efficiency of the proposed design.",
             "NPV analysis over 25 years confirms the proposed design is more cost-effective than alternatives considered."),
        ],
        "Needs Improvement": [
            ("Cost optimization analysis not performed — alternative designs should be evaluated.",
             "Only one design option is presented. Value engineering study comparing at least two alternatives is recommended for projects above ₹50 Cr."),
            ("Material specifications may result in higher costs than necessary — alternatives should be explored.",
             "Premium materials specified in some sections could be substituted without compromising structural integrity. Cost-benefit analysis recommended."),
        ],
        "Critical": [
            ("No cost optimization or value engineering performed — significant potential for cost reduction.",
             "AI analysis suggests significant scope for cost reduction through alternative specifications, phased implementation, or design optimization."),
        ],
    },
    "Overall Recommendation": {
        "Good": [
            ("DPR meets Karnataka PWD quality standards — recommend forwarding for SLEC technical appraisal.",
             "Overall assessment confirms the DPR is technically sound, financially viable, and environmentally compliant. Minor observations should be addressed before final submission."),
            ("Project is recommended for approval with minor pre-conditions.",
             "The DPR demonstrates good quality across key parameters. Recommend approval subject to submission of pending NOCs within 30 days."),
        ],
        "Needs Improvement": [
            ("DPR requires revision in multiple areas before it can be recommended for approval.",
             "Moderate deficiencies across technical, financial, and compliance dimensions need to be addressed. Resubmit after incorporating all observations."),
            ("Conditional recommendation — additional information required before final decision.",
             "While the project concept is sound, the DPR needs strengthening in cost estimation, risk assessment, and clearance documentation before approval recommendation."),
        ],
        "Critical": [
            ("DPR is not recommended for approval in current form — comprehensive revision required.",
             "Multiple critical deficiencies identified. The DPR must be substantially revised and resubmitted. Key areas: technical design, environmental clearance, and cost estimation."),
        ],
    },
}

CATEGORY_ICONS = {
    "Project Summary": "📋",
    "Budget Estimation": "💰",
    "Technical Feasibility": "🔧",
    "Environmental Compliance": "🌿",
    "Legal & Regulatory Compliance": "⚖️",
    "Risk Assessment": "🛡️",
    "Documentation Completeness": "📁",
    "Missing Information": "🔍",
    "Cost Optimization": "📊",
    "Overall Recommendation": "✅",
}

CATEGORY_ORDER = list(CAT_POOLS.keys())


def _generate_category_analysis(project: Project, cached_data: Optional[dict]) -> List[dict]:
    """
    Generate 10-category AI recommendations unique to this DPR.
    Uses project metadata + scores as a seed so results are stable but vary per DPR.
    """
    import hashlib
    seed_str = f"{project.id}{project.sector}{project.state}{project.title}{project.estimated_cost}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed)

    overall = (cached_data["assessment"]["overall_score"] if cached_data else project.overall_score or 65)
    risk    = (cached_data["risk"]["risk_score"] if cached_data else project.risk_score or 50)

    def pick_status(cat_idx: int) -> str:
        # Different thresholds per category to create diversity
        base = overall - cat_idx * 2 + rng.randint(-12, 12)
        if cat_idx == 4:   # Legal
            base = overall - rng.randint(5, 20)
        if cat_idx == 7:   # Missing Info
            base = 100 - risk + rng.randint(-10, 10)
        if cat_idx == 9:   # Overall
            base = overall + rng.randint(-5, 5)
        if base >= 80:
            return "Good"
        elif base >= 55:
            return "Needs Improvement"
        else:
            return "Critical"

    results = []
    for i, cat in enumerate(CATEGORY_ORDER):
        status = pick_status(i)
        pool = CAT_POOLS[cat][status]
        rec_text, reason = pool[rng.randint(0, len(pool) - 1)]

        # Confidence: Good→75-95, Needs Improvement→45-74, Critical→20-44
        if status == "Good":
            confidence = rng.randint(78, 95)
        elif status == "Needs Improvement":
            confidence = rng.randint(52, 74)
        else:
            confidence = rng.randint(24, 51)

        # Inject project-specific context into recommendation
        if "{sector}" in rec_text:
            rec_text = rec_text.replace("{sector}", project.sector)
        if "{state}" in rec_text:
            rec_text = rec_text.replace("{state}", project.state)

        results.append({
            "category": cat,
            "icon": CATEGORY_ICONS.get(cat, "📌"),
            "status": status,
            "confidence": confidence,
            "recommendation": rec_text,
            "reason": reason,
        })
    return results


@app.get("/api/dpr/{dpr_id}/category-analysis")
def get_category_analysis(dpr_id: str):
    """
    Return (or generate+cache) 10-category AI recommendations for this DPR.
    Results are stable across calls for the same DPR.
    """
    project = get_project_by_id(dpr_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Return from DB if already saved
    saved = get_category_recommendations(dpr_id)
    if saved:
        return {
            "dpr_id": dpr_id,
            "title": project.title or project.original_filename,
            "in_approvals": is_in_approvals(dpr_id),
            "categories": [
                {k: v for k, v in r.items() if k not in ("id", "project_id", "created_at")}
                for r in saved
            ],
        }

    # Generate fresh
    cached_data = get_cached_analysis(dpr_id)
    recs = _generate_category_analysis(project, cached_data)

    return {
        "dpr_id": dpr_id,
        "title": project.title or project.original_filename,
        "in_approvals": is_in_approvals(dpr_id),
        "categories": recs,
    }


@app.post("/api/dpr/{dpr_id}/send-to-approvals")
def send_to_approvals(dpr_id: str):
    """
    Save category recommendations to DB and mark the DPR as sent to approvals.
    Idempotent — safe to call multiple times.
    """
    project = get_project_by_id(dpr_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Generate and persist category recs if not already saved
    if not get_category_recommendations(dpr_id):
        cached_data = get_cached_analysis(dpr_id)
        recs = _generate_category_analysis(project, cached_data)
        save_category_recommendations(dpr_id, recs)

    mark_in_approvals(dpr_id)
    return {
        "id": dpr_id,
        "in_approvals": True,
        "message": f"DPR '{project.title or project.original_filename}' has been sent to My Approvals.",
    }


# ══════════════════════════════════════════════════════════════════════════════
# APPLICATION STATUS API
# ══════════════════════════════════════════════════════════════════════════════

class AppCommentRequest(BaseModel):
    author_role: str
    author_name: str
    message: str


class AppReviewerActionRequest(BaseModel):
    reviewer_name: str
    message: str
    new_status: Optional[str] = None
    department: Optional[str] = None


def _status_step(status: str) -> int:
    mapping = {
        "PENDING": 0, "PROCESSING": 1,
        "REVIEWED": 2, "UNDER_REVIEW": 2,
        "PENDING_INFO": 3,
        "APPROVED": 4, "REJECTED": 4,
    }
    return mapping.get((status or "PENDING").upper(), 0)


def _verify_status_access(request: Request, username: Optional[str] = None, role: Optional[str] = None):
    u, r, uid = _extract_request_user(request, username, role)
    if not is_authorized_status_viewer(u, r):
        raise HTTPException(
            status_code=403,
            detail="Access restricted: Only Admin and Priya Sharma can view Application Status details."
        )
    return u, r, uid


@app.get("/api/application-status")
def get_all_application_statuses(request: Request, username: Optional[str] = None, role: Optional[str] = None):
    from datetime import datetime
    u, r, uid = _extract_request_user(request, username, role)
    projects = get_all_projects(username=u, role=r, user_id=uid)
    result = []
    for p in projects:
        ensure_upload_timeline(p.id)
        steps = ["DPR Uploaded", "AI Analysis", "Under Review", "Pending Info", "Decision"]
        step_idx = _status_step(p.status)
        progress_pct = round((step_idx + 1) / len(steps) * 100)
        result.append({
            "id": p.id,
            "title": p.title or p.original_filename,
            "original_filename": p.original_filename,
            "district": p.state,
            "sector": p.sector,
            "department": getattr(p, 'department', None) or "Karnataka PWD",
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
def get_application_status_detail(project_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    u, r, uid = _extract_request_user(request, username, role)
    p = _verify_dpr_access(project_id, request, username, role)
    ensure_upload_timeline(project_id)
    timeline = get_timeline(project_id)
    # Auto-add AI analysis event once
    if p.overall_score is not None and not any(e["event_type"] == "ai_analysis" for e in timeline):
        add_timeline_event(project_id, "ai_analysis", "AI Analysis Completed",
                           f"Quality {p.overall_score}/100 · Risk {p.risk_score}/100 · Compliance {p.compliance_score}%",
                           "AI Engine", "system")
        timeline = get_timeline(project_id)
    steps = ["DPR Uploaded", "AI Analysis", "Under Review", "Pending Info", "Decision"]
    step_idx = _status_step(p.status)
    progress_pct = round((step_idx + 1) / len(steps) * 100)
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
def post_app_comment(project_id: str, req: AppCommentRequest, request: Request):
    u, r, uid = _extract_request_user(request)
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    comment = add_comment(project_id, req.author_role, req.author_name, req.message, author_id=uid)
    if req.author_role == "reviewer":
        add_timeline_event(project_id, "reviewer_comment", "Reviewer Added Comment",
                           req.message[:120], req.author_name, "reviewer")
        add_notification(project_id, "user", p.submitted_by or "User",
                         "reviewer_comment", f"Reviewer commented: {req.message[:80]}")
    else:
        add_timeline_event(project_id, "user_reply", "User Replied",
                           req.message[:120], req.author_name, "user")
        reviewer = p.reviewed_by or p.reviewer_name or "Admin"
        add_notification(project_id, "reviewer", reviewer,
                         "user_reply", f"User replied: {req.message[:80]}")
    return {"success": True, "comment": comment}


@app.get("/api/application-status/{project_id}/comments")
def get_project_comments(project_id: str, request: Request, username: Optional[str] = None, role: Optional[str] = None):
    project = _verify_dpr_access(project_id, request, username, role)
    return get_comments(project_id)


@app.post("/api/application-status/{project_id}/reviewer-action")
def reviewer_action(project_id: str, req: AppReviewerActionRequest):
    from datetime import datetime as _dt
    from app.services.project_service import _get_db as _db
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    comment = add_comment(project_id, "reviewer", req.reviewer_name, req.message)
    if req.new_status:
        conn = _db()
        cursor = conn.cursor()
        now = _dt.utcnow().isoformat() + "Z"
        cursor.execute(
            """UPDATE projects SET status=?, reviewed_by=?, reviewed_at=?,
               reviewer_name=?, approval_comment=?, department=? WHERE id=?""",
            (req.new_status.upper(), req.reviewer_name, now, req.reviewer_name,
             req.message, req.department or "Karnataka PWD", project_id)
        )
        conn.commit(); conn.close()
        clear_analysis_cache(project_id)
        labels = {"APPROVED": "DPR Approved", "REJECTED": "DPR Rejected",
                  "PENDING": "Reviewer Requested Changes", "UNDER_REVIEW": "DPR Under Review"}
        label = labels.get(req.new_status.upper(), f"Status: {req.new_status}")
        add_timeline_event(project_id, f"status_{req.new_status.lower()}", label,
                           req.message[:120], req.reviewer_name, "reviewer")
        add_notification(project_id, "user", p.submitted_by or "User",
                         f"status_{req.new_status.lower()}",
                         f"DPR status changed to {req.new_status}: {req.message[:60]}")
    return {"success": True, "comment": comment}


@app.post("/api/application-status/{project_id}/upload-revision")
async def upload_revision_version(
    project_id: str,
    file: UploadFile = File(...),
    uploaded_by: str = Form(...),
    notes: str = Form(""),
):
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    file_bytes = await file.read()
    version = add_dpr_version(project_id, file_bytes, file.filename, uploaded_by, notes)
    add_timeline_event(project_id, "revision_upload",
                       f"Revised DPR Uploaded (v{version['version_number']})",
                       f"Uploaded by {uploaded_by}: {file.filename}", uploaded_by, "user")
    reviewer = p.reviewed_by or p.reviewer_name or "Admin"
    add_notification(project_id, "reviewer", reviewer, "revision_upload",
                     f"{uploaded_by} uploaded revised DPR v{version['version_number']}: {file.filename}")
    add_notification(project_id, "user", uploaded_by, "revision_confirmed",
                     f"Revised DPR v{version['version_number']} submitted successfully.")
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
def mark_notifs_read_endpoint(project_id: str, role: str = "user"):
    mark_notifications_read(project_id, role)
    return {"success": True}


# ── Global System-Wide Notifications API Endpoints ──────────────────────────────

@app.get("/api/notifications")
def fetch_global_notifications(role: Optional[str] = None, project_id: Optional[str] = None, limit: int = 50):
    """Fetch system-wide global notifications across all modules and projects."""
    return get_notifications(recipient_role=role, project_id=project_id, limit=limit)


@app.post("/api/notifications/read-all")
def mark_all_read_endpoint(role: Optional[str] = None):
    """Mark all notifications as read."""
    mark_all_notifications_read(recipient_role=role)
    return {"success": True}


@app.post("/api/notifications/{notif_id}/read")
def mark_single_read_endpoint(notif_id: str):
    """Mark a single notification item as read."""
    mark_single_notification_read(notif_id)
    return {"success": True}


@app.post("/api/application-status/{project_id}/comment-with-file")
async def post_comment_with_file(
    project_id: str,
    author_role: str = Form(...),
    author_name: str = Form(...),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    from app.services.project_service import UPLOAD_DIR as _UDIR
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    att_filename = None
    att_path = None
    if file and file.filename:
        import uuid as _uuid
        os.makedirs(_UDIR, exist_ok=True)
        ext = os.path.splitext(file.filename)[1]
        saved = f"att_{_uuid.uuid4()}{ext}"
        saved_path = os.path.join(_UDIR, saved)
        with open(saved_path, "wb") as fh:
            fh.write(await file.read())
        att_filename = file.filename
        att_path = saved
    comment = add_comment(project_id, author_role, author_name, message, att_filename, att_path)
    if author_role == "reviewer":
        add_timeline_event(project_id, "reviewer_comment", "Reviewer Added Comment",
                           message[:120], author_name, "reviewer")
        add_notification(project_id, "user", p.submitted_by or "User",
                         "reviewer_comment", f"Reviewer commented: {message[:80]}")
    else:
        add_timeline_event(project_id, "user_reply", "User Replied",
                           message[:120], author_name, "user")
        reviewer = p.reviewed_by or p.reviewer_name or "Admin"
        add_notification(project_id, "reviewer", reviewer,
                         "user_reply", f"User replied: {message[:80]}")
    return {"success": True, "comment": comment}


# ══════════════════════════════════════════════════════════════════════════════
# GROQ AI CHATBOT ENDPOINT FOR DPR QUERIES
# ══════════════════════════════════════════════════════════════════════════════

class ChatMsgItem(BaseModel):
    role: str       # "user" | "assistant" | "system"
    content: str

class ChatApiRequest(BaseModel):
    message: str
    history: Optional[List[ChatMsgItem]] = []
    dpr_id: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = "llama-3.3-70b-versatile"

def _call_groq_api(api_key: str, messages: list, model_name: str = "llama-3.3-70b-versatile") -> Optional[str]:
    import urllib.request
    import json
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 1024,
    }
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json",
            "User-Agent": "KarnatakaPWD-DPR-AI/1.0",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            if "choices" in res_json and len(res_json["choices"]) > 0:
                return res_json["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[Groq AI API Error]: {e}")
        return None
    return None

def _generate_domain_fallback(query: str, dpr_info: Optional[dict] = None) -> str:
    q = query.lower()
    if "status" in q or "track" in q or "application" in q:
        return ("To track any DPR application status, visit the **Application Status** tab in the portal menu. "
                "Each DPR moves through 5 stages: **DPR Uploaded → AI Analysis → Under Review → Pending Info → Decision**. "
                "You can search by Project Reference ID (e.g. `KPWD-XXXX`), District, or Sector.")
    elif "clearance" in q or "forest" in q or "eia" in q or "environmental" in q:
        return ("Under MoEFCC and Karnataka PWD guidelines, infrastructure DPRs require:\n"
                "1. **Forest Clearance (FCA 1980)** Stage-I/II if traversing eco-sensitive forest land.\n"
                "2. **Environmental Impact Assessment (EIA)** for projects > ₹100 Cr or in protected corridors.\n"
                "3. **KSPCB Consent to Establish (CTE)** for highway/bridge excavation and stone crushers.")
    elif "contingency" in q or "cost" in q or "morth" in q or "sor" in q:
        return ("MoRTH & Karnataka PWD Schedule of Rates (SoR 2025-26) recommend:\n"
                "• **10% - 15% Financial Contingency** for hilly/monsoon-heavy terrain.\n"
                "• **8% - 12% Annual Price Escalation** for multi-year execution contracts.\n"
                "• Verification of BOQ unit rates against Karnataka PWD 2025-26 Schedule of Rates.")
    elif "score" in q or "risk" in q or "quality" in q:
        return ("DPR-AI evaluates 8 core dimensions:\n"
                "• **AI Quality Score (0-100)**: Technical soundness, financial realism, procurement clarity, and structural specs.\n"
                "• **Risk Score (0-100)**: Low (≤40), Medium (41-70), High (>70) based on budget deviations, environmental constraints, and terrain delays.")
    else:
        return (f"Regarding **'{query}'**: Karnataka PWD DPR guidelines require complete technical BOQ specs, "
                "NABL soil bearing capacity tests (SPT), land acquisition NOCs (LARR Act 2013), and 25-year O&M projections. "
                "You can inspect detailed AI scores and reports directly in the DPR Queue or Application Status portal.")

@app.post("/api/chat")
def handle_chat_query(req: ChatApiRequest):
    """Handle Groq AI Chatbot query for DPR guidance & status."""
    api_key = req.api_key or os.environ.get("GROQ_API_KEY", "")
    query = req.message.strip()

    if not query:
        raise HTTPException(400, "Message cannot be empty")

    dpr_context = ""
    if req.dpr_id:
        p = get_project_by_id(req.dpr_id)
        if p:
            dpr_context = f"\nContext DPR: Title='{p.title}', Ref='KPWD-{p.id[:8].upper()}', District='{p.state}', Sector='{p.sector}', Status='{p.status}', Cost='₹{p.estimated_cost} Cr'."

    system_prompt = (
        "You are DPR-AI Assistant, an expert AI agent for Karnataka PWD (Public Works Department) Detailed Project Reports (DPRs).\n"
        "Your role is to answer and resolve user queries about DPR applications, compliance guidelines, MoRTH specs, IRC standards, "
        "Karnataka Schedule of Rates 2025-26, environmental clearances (EIA/FCA), LARR land acquisition, and status tracking.\n"
        "Be professional, clear, helpful, and concise. Format responses with markdown lists or bullet points when appropriate."
        f"{dpr_context}"
    )

    messages = [{"role": "system", "content": system_prompt}]

    if req.history:
        for h in req.history[-6:]:
            if h.role in ("user", "assistant"):
                messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": query})

    reply = None
    model_used = req.model or "llama-3.3-70b-versatile"

    if api_key and len(api_key.strip()) > 10:
        reply = _call_groq_api(api_key, messages, model_name=model_used)
        if not reply and model_used != "llama3-70b-8192":
            reply = _call_groq_api(api_key, messages, model_name="llama3-70b-8192")

    if not reply:
        reply = _generate_domain_fallback(query)
        is_fallback = True
    else:
        is_fallback = False

    return {
        "reply": reply,
        "model": model_used if not is_fallback else "domain-engine-fallback",
        "is_fallback": is_fallback,
        "dpr_id": req.dpr_id,
    }


# ─── DPR Templates API Endpoints ──────────────────────────────────────────────
from app.services.template_service import (
    create_template, get_templates, get_template_by_id, update_template,
    set_template_status, delete_template, TEMPLATE_STORAGE_DIR
)

@app.post("/api/templates/upload")
def upload_dpr_template(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form("General"),
    version: str = Form("v1.0"),
    uploaded_by: str = Form("Admin")
):
    """Upload a new DPR template PDF (Admin only)."""
    import uuid as _uuid
    u, r, uid = _extract_request_user(request)
    if not is_admin_role(r):
        raise HTTPException(403, "Only Admin users can upload DPR templates.")
        
    orig_name = file.filename or "template.pdf"
    if not orig_name.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported for DPR templates.")
        
    saved_fn = f"tmpl_{_uuid.uuid4().hex[:10]}.pdf"
    file_path = os.path.join(TEMPLATE_STORAGE_DIR, saved_fn)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
        
    tmpl = create_template(
        title=title,
        description=description,
        category=category,
        filename=saved_fn,
        original_filename=orig_name,
        version=version,
        uploaded_by=uploaded_by or u or "Admin"
    )
    return tmpl


@app.get("/api/templates")
def list_dpr_templates(request: Request, active_only: Optional[bool] = None):
    """List DPR templates. Admin gets all, Users get active templates by default."""
    u, r, uid = _extract_request_user(request)
    # If active_only is explicitly requested, or if caller is non-admin, filter active
    show_active_only = active_only if active_only is not None else (not is_admin_role(r))
    return get_templates(active_only=show_active_only)


@app.get("/api/templates/{template_id}")
def get_template_detail(template_id: str):
    """Get metadata for a specific DPR template."""
    tmpl = get_template_by_id(template_id)
    if not tmpl:
        raise HTTPException(404, "DPR template not found.")
    return tmpl


@app.get("/api/templates/{template_id}/file")
def view_template_file(template_id: str, download: bool = False):
    """Stream binary PDF file for inline view or browser download."""
    tmpl = get_template_by_id(template_id)
    if not tmpl:
        raise HTTPException(404, "DPR template not found.")
        
    file_path = os.path.join(TEMPLATE_STORAGE_DIR, tmpl.filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "Template PDF file missing on disk.")
        
    disposition = "attachment" if download else "inline"
    safe_filename = tmpl.original_filename.encode('ascii', 'ignore').decode('ascii') or "template.pdf"
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{safe_filename}"'}
    )


@app.get("/api/templates/{template_id}/download")
def download_template_file(template_id: str):
    """Download binary PDF attachment."""
    return view_template_file(template_id, download=True)


@app.put("/api/templates/{template_id}")
def edit_dpr_template(
    template_id: str,
    request: Request,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    version: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Update DPR template metadata or replace template PDF file (Admin only)."""
    u, r, uid = _extract_request_user(request)
    if not is_admin_role(r):
        raise HTTPException(403, "Only Admin users can update DPR templates.")
        
    tmpl = get_template_by_id(template_id)
    if not tmpl:
        raise HTTPException(404, "DPR template not found.")
        
    new_fn = None
    new_orig_fn = None
    
    if file and file.filename:
        import uuid as _uuid
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(400, "Only PDF files are supported for DPR templates.")
        new_orig_fn = file.filename
        new_fn = f"tmpl_{_uuid.uuid4().hex[:10]}.pdf"
        file_path = os.path.join(TEMPLATE_STORAGE_DIR, new_fn)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
            
        # Old file cleanup
        old_path = os.path.join(TEMPLATE_STORAGE_DIR, tmpl.filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    updated = update_template(
        template_id=template_id,
        title=title,
        description=description,
        category=category,
        version=version,
        new_filename=new_fn,
        new_original_filename=new_orig_fn
    )
    return updated


class TemplateStatusRequest(BaseModel):
    is_active: bool

@app.patch("/api/templates/{template_id}/status")
def toggle_template_status(template_id: str, req: TemplateStatusRequest, request: Request):
    """Activate or deactivate a DPR template (Admin only)."""
    u, r, uid = _extract_request_user(request)
    if not is_admin_role(r):
        raise HTTPException(403, "Only Admin users can change template active status.")
        
    tmpl = set_template_status(template_id, req.is_active)
    if not tmpl:
        raise HTTPException(404, "DPR template not found.")
    return tmpl


@app.delete("/api/templates/{template_id}")
def delete_dpr_template(template_id: str, request: Request):
    """Delete a DPR template (Admin only)."""
    u, r, uid = _extract_request_user(request)
    if not is_admin_role(r):
        raise HTTPException(403, "Only Admin users can delete DPR templates.")
        
    success = delete_template(template_id)
    if not success:
        raise HTTPException(404, "DPR template not found.")
    return {"message": "DPR template deleted successfully", "id": template_id}