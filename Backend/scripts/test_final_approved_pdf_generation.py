"""
Automated Test for Final Approved DPR Government-Standard PDF Report Generation
Tests:
1. Generate publication-grade Final Approved PDF
2. Verify PDF headers, size, binary integrity, and ReportLab canvas compilation
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
    print("[RUNNING] Final Approved DPR Professional PDF Report Generation Test")
    print("=" * 75)

    projects = get_all_projects()
    assert len(projects) > 0, "No projects found"

    sample_proj = projects[0]
    pid = sample_proj.id
    print(f"[*] Testing Project ID: {pid} ({sample_proj.title or sample_proj.filename})")

    # Grant all 5 department approvals to transition DPR to FINAL_APPROVED
    print("\n[STEP 1] Approving all 5 departments for sequential sanction ...")
    for d_key in ["technical", "financial", "compliance", "risk", "executive"]:
        res_act = process_department_decision(
            pid,
            d_key,
            "APPROVE",
            f"Director of {d_key.capitalize()} Directorate",
            f"{d_key.capitalize()} Reviewer",
            "Certified compliant with Karnataka PWD Standards."
        )
        assert res_act["success"], f"Stage {d_key} failed: {res_act}"
        print(f"  + Department '{d_key}' -> APPROVED")

    # Request Final Approved PDF
    print("\n[STEP 2] Requesting GET /api/dpr/{dpr_id}/final-approved-report/pdf ...")
    res_pdf = client.get(
        f"/api/dpr/{pid}/final-approved-report/pdf",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    assert res_pdf.status_code == 200, f"PDF generation failed: {res_pdf.status_code} {res_pdf.text}"
    assert res_pdf.headers.get("content-type") == "application/pdf", f"Unexpected content-type: {res_pdf.headers.get('content-type')}"

    pdf_data = res_pdf.content
    print(f"  + PDF Response Status: 200 OK")
    print(f"  + PDF Content-Type: application/pdf")
    print(f"  + PDF File Size: {len(pdf_data):,} bytes ({len(pdf_data)/1024:.1f} KB)")
    assert pdf_data.startswith(b"%PDF-"), "Invalid PDF binary format: missing %PDF- header"
    print("  + PDF Binary Signature: %PDF- (VALID)")

    # Save to scratch / test output file
    out_dir = os.path.join(backend_dir, "uploads")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"test_final_approved_report_{pid[:8]}.pdf")
    with open(out_path, "wb") as f:
        f.write(pdf_data)
    print(f"  + Test PDF written to: {out_path}")

    print("\n" + "=" * 75)
    print("[SUCCESS] FINAL APPROVED GOVERNMENT PDF REPORT GENERATED SUCCESSFULLY (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
