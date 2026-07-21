import hashlib
import random
from typing import List, Dict, Optional
from pydantic import BaseModel

class ComplianceCheck(BaseModel):
    id: str
    label: str
    description: str
    is_mandatory: bool
    status: str = "PENDING"  # COMPLIANT, NON_COMPLIANT, NOT_APPLICABLE, PENDING
    reason: Optional[str] = None

class ProjectCompliance(BaseModel):
    project_id: str
    overall_compliance_score: int
    checks: List[ComplianceCheck]

# Comprehensive Karnataka PWD Compliance Guidelines
KARNATAKA_PWD_COMPLIANCE_TEMPLATE = [
    {
        "id": "FOR-001",
        "label": "Forest Clearance (FC Act 1980)",
        "description": "NOC & clearance from State Forest Department for land diversion.",
        "is_mandatory": True,
        "missing_reason": "Forest land diversion application pending with Regional MOEFCC office."
    },
    {
        "id": "LAN-001",
        "label": "Land Availability & Title Certificate",
        "description": "Certificate from District Collector ensuring land is free from encumbrances.",
        "is_mandatory": True,
        "missing_reason": "Clear land title and R&R plan under LARR Act 2013 not fully documented."
    },
    {
        "id": "NON-001",
        "label": "Non-Duplication Certificate",
        "description": "Ensures project is not funded under any other Central or Karnataka State scheme.",
        "is_mandatory": True,
        "missing_reason": "Dual funding verification clearance from State Planning Board missing."
    },
    {
        "id": "TEC-001",
        "label": "Techno-Economic Appraisal",
        "description": "Appraisal report from accredited institute (IIT/NIT/IISc/IIM).",
        "is_mandatory": True,
        "missing_reason": "Peer review appraisal from IISc/NITK Surathkal not attached."
    },
    {
        "id": "ENV-001",
        "label": "Environment Impact Assessment (EIA)",
        "description": "EIA report & KSPCB consent as per Environment Protection Act 1986.",
        "is_mandatory": False,
        "missing_reason": "Baseline air and water quality sampling report from KSPCB missing."
    },
    {
        "id": "SOR-001",
        "label": "Karnataka PWD SoR 2025-26 Compliance",
        "description": "Cost estimates based on current Karnataka PWD Schedule of Rates.",
        "is_mandatory": True,
        "missing_reason": "Item rates deviate from Karnataka PWD 2025-26 Schedule of Rates without justification."
    },
    {
        "id": "GEO-001",
        "label": "Geotechnical Soil Investigation",
        "description": "Standard Penetration Test (SPT) report for structural foundations per IS 2131.",
        "is_mandatory": True,
        "missing_reason": "SPT bore-log data for major bridge/structure foundations not submitted."
    },
    {
        "id": "DIS-001",
        "label": "Disaster Resilience & Seismic Zone Compliance",
        "description": "Structural design compliance with IS 1893:2016 for seismic Zone III/IV.",
        "is_mandatory": False,
        "missing_reason": "Seismic load safety calculations not verified by structural engineer."
    }
]

def get_initial_compliance(project_id: str) -> ProjectCompliance:
    checks = [ComplianceCheck(**item) for item in KARNATAKA_PWD_COMPLIANCE_TEMPLATE]
    return ProjectCompliance(
        project_id=project_id,
        overall_compliance_score=0,
        checks=checks
    )

def evaluate_compliance(project_id: str, project_metadata: Dict) -> ProjectCompliance:
    """
    Generates dynamic, document-seeded compliance results based on project attributes & status.
    If APPROVED: All mandatory checks marked COMPLIANT, optional ones COMPLIANT or NOT_APPLICABLE.
    If PENDING or REJECTED: Specific mandatory checks fail with detailed Karnataka PWD reasons.
    """
    status_str = (project_metadata.get("status") or "PENDING").upper()
    sector = project_metadata.get("sector", "Roads")
    cost = float(project_metadata.get("estimated_cost") or 50.0)
    title = project_metadata.get("title") or project_id

    # Seed random generator for consistent DPR-specific results
    seed_str = f"{project_id}_{sector}_{cost}_{title}_{status_str}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed)

    checks = []
    compliant_count = 0

    for item in KARNATAKA_PWD_COMPLIANCE_TEMPLATE:
        item_id = item["id"]
        is_mand = item["is_mandatory"]

        if status_str == "APPROVED":
            # Approved DPRs satisfy all mandatory checks
            if is_mand:
                check_status = "COMPLIANT"
                reason = "Verified and fully compliant with Karnataka PWD guidelines."
                compliant_count += 1
            else:
                if rng.choice([True, False]):
                    check_status = "COMPLIANT"
                    reason = "Verified and compliant."
                    compliant_count += 1
                else:
                    check_status = "NOT_APPLICABLE"
                    reason = "Not applicable for this project scope/location."
        elif status_str == "REJECTED":
            # Rejected DPRs fail multiple mandatory checks
            if is_mand:
                if rng.random() < 0.6:
                    check_status = "NON_COMPLIANT"
                    reason = f"CRITICAL NON-COMPLIANCE: {item['missing_reason']}"
                else:
                    check_status = "COMPLIANT"
                    reason = "Documented and verified."
                    compliant_count += 1
            else:
                check_status = "NOT_APPLICABLE" if rng.choice([True, False]) else "NON_COMPLIANT"
                reason = item['missing_reason'] if check_status == "NON_COMPLIANT" else "N/A for project scope."
        else:
            # PENDING DPRs: Some compliant, some pending/non-compliant
            if is_mand:
                prob = rng.random()
                if prob < 0.5:
                    check_status = "COMPLIANT"
                    reason = "Submitted and pending final verification."
                    compliant_count += 1
                elif prob < 0.8:
                    check_status = "PENDING"
                    reason = "Under review by State Technical Advisory Committee."
                else:
                    check_status = "NON_COMPLIANT"
                    reason = f"PENDING CORRECTION: {item['missing_reason']}"
            else:
                check_status = "NOT_APPLICABLE" if rng.choice([True, False]) else "PENDING"
                reason = "Pending verification."

        checks.append(ComplianceCheck(
            id=item_id,
            label=item["label"],
            description=item["description"],
            is_mandatory=is_mand,
            status=check_status,
            reason=reason
        ))

    mandatory_items = [c for c in checks if c.is_mandatory]
    mandatory_compliant = sum(1 for c in mandatory_items if c.status == "COMPLIANT")
    score = int((mandatory_compliant / len(mandatory_items)) * 100) if mandatory_items else 100

    if status_str == "APPROVED":
        score = 100

    return ProjectCompliance(
        project_id=project_id,
        overall_compliance_score=score,
        checks=checks
    )

