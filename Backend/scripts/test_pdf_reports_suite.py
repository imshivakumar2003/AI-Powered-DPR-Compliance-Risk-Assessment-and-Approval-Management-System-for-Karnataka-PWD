"""
Automated Test Suite for Government-Standard PDF Reports:
1. Status Monitoring Report PDF (for In-Review / Pending DPRs)
2. Final Approved DPR Sanction Report PDF (for Approved DPRs)
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
    print("[RUNNING] Government-Standard DPR PDF Report Generation Test Suite")
    print("=" * 75)

    projects = get_all_projects()
    assert len(projects) > 0, "No projects found"

    sample_proj = projects[0]
    pid = sample_proj.id
    print(f"[*] Testing Project ID: {pid} ({sample_proj.title or sample_proj.filename})")

    # 1. Test Status Monitoring Report PDF
    print("\n[TEST 1] Requesting Status Monitoring Report PDF: GET /api/dpr/{dpr_id}/status-report/pdf ...")
    res_status_pdf = client.get(
        f"/api/dpr/{pid}/status-report/pdf",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    assert res_status_pdf.status_code == 200, f"Status PDF failed: {res_status_pdf.status_code}"
    assert res_status_pdf.headers.get("content-type") == "application/pdf"
    status_pdf_bytes = res_status_pdf.content
    print(f"  + Status PDF Response: 200 OK")
    print(f"  + Size: {len(status_pdf_bytes):,} bytes ({len(status_pdf_bytes)/1024:.1f} KB)")
    assert status_pdf_bytes.startswith(b"%PDF-"), "Invalid PDF signature"
    print("  + PDF Binary Signature: %PDF- (VALID)")

    # 2. Approve all 5 departments for Final Sanction
    print("\n[TEST 2] Approving all 5 departments for sequential sanction ...")
    for d_key in ["technical", "financial", "compliance", "risk", "executive"]:
        process_department_decision(
            pid,
            d_key,
            "APPROVE",
            f"Director of {d_key.capitalize()} Directorate",
            f"{d_key.capitalize()} Reviewer",
            "Certified compliant with Karnataka PWD Standards."
        )

    # 3. Test Final Approved Sanction Report PDF
    print("\n[TEST 3] Requesting Final Sanction Report PDF: GET /api/dpr/{dpr_id}/final-approved-report/pdf ...")
    res_final_pdf = client.get(
        f"/api/dpr/{pid}/final-approved-report/pdf",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    assert res_final_pdf.status_code == 200, f"Final Approved PDF failed: {res_final_pdf.status_code}"
    assert res_final_pdf.headers.get("content-type") == "application/pdf"
    final_pdf_bytes = res_final_pdf.content
    print(f"  + Final Approved PDF Response: 200 OK")
    print(f"  + Size: {len(final_pdf_bytes):,} bytes ({len(final_pdf_bytes)/1024:.1f} KB)")
    assert final_pdf_bytes.startswith(b"%PDF-"), "Invalid PDF signature"
    print("  + PDF Binary Signature: %PDF- (VALID)")

    print("\n" + "=" * 75)
    print("[SUCCESS] ALL GOVERNMENT PDF REPORT GENERATION TESTS PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
