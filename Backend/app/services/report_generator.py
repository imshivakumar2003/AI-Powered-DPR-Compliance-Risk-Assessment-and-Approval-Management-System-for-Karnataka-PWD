# TOPLINE

from typing import Dict, List, Optional
from datetime import datetime

def generate_dpr_assessment_report(
    project_data: Dict,
    assessment_data: Dict,
    compliance_data: Dict,
    risk_data: Optional[Dict] = None,
    category_recs: Optional[List[Dict]] = None
) -> str:
    """
    Generates a comprehensive, professional text/PDF report tailored to the DPR's status
    (APPROVED, PENDING, REJECTED) following Karnataka PWD guidelines.
    """
    timestamp = datetime.now().strftime("%d-%b-%Y %H:%M:%S IST")
    status_str = (project_data.get("status") or "PENDING").upper()
    
    pid = project_data.get('id', 'N/A')
    title = project_data.get('title') or project_data.get('original_filename', 'N/A')
    fname = project_data.get('original_filename', 'N/A')
    state = project_data.get('state', 'Karnataka')
    sector = project_data.get('sector', 'Infrastructure')
    cost = project_data.get('estimated_cost', 0.0)
    submitted_by = project_data.get('submitted_by', 'N/A')
    reviewed_by = project_data.get('reviewed_by') or 'State Technical Advisory Committee (Admin)'
    reviewed_at = project_data.get('reviewed_at') or timestamp
    comment = project_data.get('approval_comment') or 'N/A'
    
    overall_score = assessment_data.get('overall_score', 'N/A')
    compliance_score = compliance_data.get('overall_compliance_score', 'N/A')
    risk_score = risk_data.get('risk_score', 'N/A') if risk_data else 'N/A'
    risk_category = risk_data.get('risk_category', 'N/A') if risk_data else 'N/A'

    report = f"""
================================================================================
                    GOVERNMENT OF KARNATAKA - PUBLIC WORKS DEPARTMENT
                     SMART DPR ASSESSMENT & APPRAISAL SYSTEM
================================================================================
                                OFFICIAL DPR REPORT
================================================================================

1. PROJECT INFORMATION & METADATA
--------------------------------------------------------------------------------
Project Title:        {title}
Project ID:           {pid}
Uploaded File Name:   {fname}
State / District:     {state}
Sector:               {sector}
Estimated Cost:       ₹ {cost} Crores
Submitted By:         {submitted_by}
Report Generated On:  {timestamp}
Review Date:          {reviewed_at}
Reviewer:             {reviewed_by}
Current Status:       {status_str}
Reviewer Comment:     {comment}

================================================================================
2. EXECUTIVE SUMMARY & QUALITY SCORES
================================================================================
Overall Quality Score:     {overall_score} / 100
Compliance Score:          {compliance_score}%
Risk Score:                {risk_score} / 100 ({risk_category} Risk)
Approval Decision:         {status_str}

Summary:
This Detailed Project Report (DPR) for the {sector} sector in {state} has been 
evaluated against Karnataka PWD technical, financial, environmental, and statutory 
standards. The overall appraisal yields a Quality Score of {overall_score}/100 and a 
Compliance Score of {compliance_score}%.
"""

    if status_str == "APPROVED":
        report += f"""
APPROVAL STATUS RATIONALE:
--------------------------------------------------------------------------------
[✓] SANCTIONED & APPROVED FOR IMPLEMENTATION
The DPR satisfies all mandatory Karnataka PWD statutory guidelines, techno-economic
appraisal parameters, and environmental clearance requirements. The cost estimate 
conforms to the 2025-26 Schedule of Rates (SoR). Administrative and financial 
sanction is hereby RECOMMENDED.
"""
    elif status_str == "REJECTED":
        report += f"""
REJECTION RATIONALE & VIOLATED GUIDELINES:
--------------------------------------------------------------------------------
[✗] REJECTED - REVISION & RESUBMISSION REQUIRED
The DPR has been evaluated as NON-COMPLIANT due to critical deficiencies and failure
to meet mandatory Karnataka PWD guidelines:
  • Violated Guideline: Missing statutory land availability certificate under LARR Act 2013.
  • Missing Documentation: Soil bearing capacity bore-logs (IS 2131) and IISc/NITK appraisal.
  • Cost Escalation: Unit rates deviate significantly from Karnataka PWD 2025-26 SoR.
  • Action Required: Substantially revise design and submit complete BOQ with statutory NOCs.
"""
    else:
        report += f"""
PENDING STATUS RATIONALE & REQUIRED CORRECTIONS:
--------------------------------------------------------------------------------
[⌛] PENDING REVIEW - AWAITING MANDATORY CORRECTIONS & NOCs
The DPR is currently kept PENDING review pending receipt of missing clarifications:
  • Pending Item: Final Stage-I Forest Clearance NOC from MOEFCC/State Forest Dept.
  • Pending Item: Verification of Non-Duplication Certificate from State Planning Board.
  • Recommended Action: Resubmit missing annexures to move project to APPROVED status.
"""

    report += """
================================================================================
3. QUALITY ASSESSMENT BREAKDOWN (8-AXIS AI AUDIT)
================================================================================
"""
    for dim in assessment_data.get('dimensions', []):
        report += f"  • {dim['dimension']:<28} : {dim['score']:>3}/100 | {dim['feedback']}\n"

    report += """
================================================================================
4. STATUTORY COMPLIANCE CHECKLIST (KARNATAKA PWD / PM-DevINE GUIDELINES)
================================================================================
"""
    for check in compliance_data.get('checks', []):
        st = check.get('status', 'PENDING')
        if st == "COMPLIANT":
            icon = "[✓] COMPLIANT    "
        elif st == "NOT_APPLICABLE":
            icon = "[-] N/A          "
        elif st == "NON_COMPLIANT":
            icon = "[X] NON-COMPLIANT"
        else:
            icon = "[⌛] PENDING      "

        mand = "(MANDATORY)" if check.get('is_mandatory') else "(OPTIONAL) "
        reason_text = f"\n      Details / Reason: {check['reason']}" if check.get('reason') else ""
        report += f"{icon} {mand} {check['label']}\n      Description: {check['description']}{reason_text}\n\n"

    if risk_data:
        report += """================================================================================
5. TOP RISK FACTORS & MITIGATION ACTIONS
================================================================================
"""
        risks = risk_data.get('top_risk_factors', [])
        mits = risk_data.get('mitigation_recommendations', [])
        for r, m in zip(risks, mits):
            report += f"  • RISK FACTOR:  {r}\n    MITIGATION:   {m}\n\n"

    if category_recs:
        report += """================================================================================
6. AI CATEGORY RECOMMENDATIONS & SUGGESTIONS
================================================================================
"""
        for cat in category_recs:
            c_name = cat.get('category', 'General')
            c_status = cat.get('status', 'Good')
            c_conf = cat.get('confidence', 80)
            c_rec = cat.get('recommendation', '')
            c_reason = cat.get('reason', '')
            report += f"  [{c_name}] Status: {c_status} ({c_conf}% Confidence)\n"
            report += f"    Recommendation: {c_rec}\n"
            report += f"    Reason:         {c_reason}\n\n"

    report += f"""================================================================================
7. FINAL RECOMMENDATION & NEXT STEPS
================================================================================
Status:               {status_str}
Reviewer:             {reviewed_by}
Review Date:          {reviewed_at}

Next Steps:
"""
    if status_str == "APPROVED":
        report += """  1. Issue Technical Sanction (TS) order from the Chief Engineer, Karnataka PWD.
  2. Initiate E-Tendering process via Karnataka Public Procurement Portal (KPPP).
  3. Form Project Monitoring Unit (PMU) for site supervision and milestone tracking.
"""
    elif status_str == "REJECTED":
        report += """  1. Address all identified non-compliances and missing geotechnical/statutory documents.
  2. Recalculate BOQ using updated Karnataka PWD 2025-26 Schedule of Rates.
  3. Upload revised DPR for fresh AI audit and administrative appraisal.
"""
    else:
        report += """  1. Submit missing Forest Clearance and Land Availability NOCs.
  2. Provide clarified cost breakdown for contingency provisions.
  3. Re-trigger admin review upon document upload.
"""

    report += """
--------------------------------------------------------------------------------
This report is digitally generated by the Karnataka PWD DPR-AI Engine.
It serves as the official techno-economic appraisal document for administrative
and financial review.
================================================================================
"""
    return report

