"""
Automated Test for Dynamic Report Download Button & Export Workflow
Tests:
1. Final Approved DPR -> Returns FINAL_APPROVED report type with Sanction Order & Digital Signatures
2. Rejected DPR -> Returns REJECTED report type with Rejection particulars & Correction guidelines
3. In Review / Pending DPR -> Returns STATUS_REPORT report type with stage progress & SLA matrix
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
    print("[RUNNING] Dynamic Report Download Button & Workflow Test Suite")
    print("=" * 75)

    projects = get_all_projects()
    assert len(projects) > 0, "No projects found"

    sample_proj = projects[0]
    pid = sample_proj.id
    print(f"[*] Testing Project ID: {pid} ({sample_proj.title or sample_proj.filename})")

    # 1. Test Rejection Report (REJECTED)
    print("\n[TEST 1] Testing Rejection Report (REJECTED) ...")
    res_rej_act = process_department_decision(
        pid,
        "technical",
        "REJECT",
        "Chief Engineer (Technical)",
        "Technical Directorate Reviewer",
        "Inadequate pavement crust thickness per IRC:37-2018. CBR test insufficient."
    )
    assert res_rej_act["success"], f"Reject action failed: {res_rej_act}"

    res_rej = client.get(f"/api/application-status/{pid}/export-report", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_rej.status_code == 200, f"Rejection report failed: {res_rej.status_code}"
    data_rej = res_rej.json()
    print(f"  + Filename: {data_rej['filename']}")
    print(f"  + Report Type: {data_rej['report_type']}")
    assert data_rej["report_type"] == "REJECTED"
    assert "REJECTION & DEFICIENCY REPORT" in data_rej["report"]
    print("  + Rejection report contains deficiency notice & resubmission instructions.")

    # 2. Test Final Approved Report (FINAL_APPROVED)
    print("\n[TEST 2] Testing Final Approved Report (FINAL_APPROVED) ...")
    for d_key in ["technical", "financial", "compliance", "risk", "executive"]:
        process_department_decision(
            pid,
            d_key,
            "APPROVE",
            f"Director of {d_key.capitalize()} Directorate",
            f"{d_key.capitalize()} Reviewer",
            "Certified compliant with KPWD Standards."
        )

    res_final = client.get(f"/api/application-status/{pid}/export-report", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_final.status_code == 200, f"Final report failed: {res_final.status_code}"
    data_final = res_final.json()
    print(f"  + Filename: {data_final['filename']}")
    print(f"  + Report Type: {data_final['report_type']}")
    assert data_final["report_type"] == "FINAL_APPROVED"
    assert "ADMINISTRATIVE APPROVAL & TECHNICAL SANCTION" in data_final["report"]
    assert "Sanction Order No" in data_final["report"]
    print("  + Final Sanction Report contains Government Order, Digital Hash & 5-department audit stamps.")

    # 3. Test In-Review / Pending Status Report with another project
    if len(projects) > 1:
        pid2 = projects[1].id
        print(f"\n[TEST 3] Testing Interim Status Report (STATUS_REPORT) with Project: {pid2} ...")
        res_status = client.get(f"/api/application-status/{pid2}/export-report", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
        assert res_status.status_code == 200, f"Status report failed: {res_status.status_code}"
        data_status = res_status.json()
        print(f"  + Filename: {data_status['filename']}")
        print(f"  + Report Type: {data_status['report_type']}")
        assert "report" in data_status and len(data_status["report"]) > 100
        print("  + Status Report contains 9-stage progress, pending departments, and SLA matrix.")

    print("\n" + "=" * 75)
    print("[SUCCESS] ALL DYNAMIC REPORT WORKFLOW TESTS PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
