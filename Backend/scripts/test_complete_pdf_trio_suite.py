"""
Automated Test Suite for the Complete Government PDF Trio:
1. Status Monitoring Report PDF (In-Review / Pending)
2. Rejection Assessment Report PDF (Rejected)
3. Final Sanction Order Report PDF (Final Approved)
"""

import os
import sys

# Force UTF-8 stdout encoding for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from app.services.project_service import get_all_projects
from app.services.approval_workflow_service import process_department_decision

client = TestClient(app)

def run_tests():
    print("=" * 75)
    print("[RUNNING] Complete Government DPR PDF Trio Test Suite")
    print("=" * 75)

    projects = get_all_projects()
    assert len(projects) > 0, "No projects found"

    sample_proj = projects[0]
    pid = sample_proj.id
    print(f"[*] Testing Project ID: {pid} ({sample_proj.title or sample_proj.filename})")

    # 1. Test Status Monitoring Report PDF
    print("\n[TEST 1] Testing Status Monitoring PDF: GET /api/dpr/{dpr_id}/status-report/pdf ...")
    res_status_pdf = client.get(
        f"/api/dpr/{pid}/status-report/pdf",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    assert res_status_pdf.status_code == 200, f"Status PDF failed: {res_status_pdf.status_code}"
    assert res_status_pdf.headers.get("content-type") == "application/pdf"
    assert res_status_pdf.content.startswith(b"%PDF-"), "Invalid PDF signature for Status Report"
    print(f"  + Status PDF Size: {len(res_status_pdf.content):,} bytes -> VALID %PDF-")

    # 2. Test Rejection Report PDF
    print("\n[TEST 2] Testing Rejection Report PDF: GET /api/dpr/{dpr_id}/rejection-report/pdf ...")
    res_rej_act = process_department_decision(
        pid,
        "compliance",
        "REJECT",
        "Smt. K. Anitha, Senior Legal & Compliance Officer",
        "Compliance Directorate Reviewer",
        "Mandatory Stage-I Forest Land Diversion Form-A acknowledgement under FCA 1980 is missing. Pavement crust thickness falls below minimum IRC:37-2018 guidelines."
    )
    assert res_rej_act["success"], f"Reject action failed: {res_rej_act}"

    res_rej_pdf = client.get(
        f"/api/dpr/{pid}/rejection-report/pdf",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    assert res_rej_pdf.status_code == 200, f"Rejection PDF failed: {res_rej_pdf.status_code}"
    assert res_rej_pdf.headers.get("content-type") == "application/pdf"
    assert res_rej_pdf.content.startswith(b"%PDF-"), "Invalid PDF signature for Rejection Report"
    print(f"  + Rejection PDF Size: {len(res_rej_pdf.content):,} bytes -> VALID %PDF-")

    # 3. Test Final Approved PDF
    print("\n[TEST 3] Testing Final Approved Sanction PDF: GET /api/dpr/{dpr_id}/final-approved-report/pdf ...")
    for d_key in ["technical", "financial", "compliance", "risk", "executive"]:
        process_department_decision(
            pid,
            d_key,
            "APPROVE",
            f"Director of {d_key.capitalize()} Directorate",
            f"{d_key.capitalize()} Reviewer",
            "Certified compliant with Karnataka PWD Standards."
        )

    res_final_pdf = client.get(
        f"/api/dpr/{pid}/final-approved-report/pdf",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    assert res_final_pdf.status_code == 200, f"Final Approved PDF failed: {res_final_pdf.status_code}"
    assert res_final_pdf.headers.get("content-type") == "application/pdf"
    assert res_final_pdf.content.startswith(b"%PDF-"), "Invalid PDF signature for Final Sanction Report"
    print(f"  + Final Approved PDF Size: {len(res_final_pdf.content):,} bytes -> VALID %PDF-")

    print("\n" + "=" * 75)
    print("[SUCCESS] ALL 3 GOVERNMENT PDF REPORTS GENERATED AND VALIDATED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
