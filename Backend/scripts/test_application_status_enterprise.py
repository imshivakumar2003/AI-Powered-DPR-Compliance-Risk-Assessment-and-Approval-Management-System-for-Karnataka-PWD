"""
Automated Test Suite for Enterprise DPR Application Status & Workflow Tracking System
Tests:
1. 9-Stage Lifecycle Progress Metadata
2. Department-Wise Review Status Matrix & SLA
3. AI Status Intelligence & Approval Probability
4. Exportable Application Status Report
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

client = TestClient(app)

def run_application_status_tests():
    print("=" * 75)
    print("[RUNNING] Enterprise Application Status Tracking Test Suite")
    print("=" * 75)

    # 1. Test All Application Statuses
    print("\n[TEST 1] Testing GET /api/application-status ...")
    res_list = client.get("/api/application-status", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_list.status_code == 200, f"Failed: {res_list.status_code} {res_list.text}"
    apps = res_list.json()
    assert len(apps) > 0, "No application statuses returned"
    print(f"  + Retrieved {len(apps)} DPR applications with 9-stage workflow tracking.")

    sample_app = apps[0]
    print(f"\n[*] Sample DPR Application: {sample_app['title']} ({sample_app['ref_number']})")
    print(f"  + Granular Status: {sample_app['granular_status']}")
    print(f"  + 9-Stage Progress: {sample_app['progress_pct']}% (Stage {sample_app['step_index'] + 1} of 9)")
    print(f"  + Current Department: {sample_app['current_department']}")
    print(f"  + Current Approver: {sample_app['current_approver']}")
    print(f"  + Expected Completion Date: {sample_app['expected_completion_date']}")
    print(f"  + Priority Level: {sample_app['priority_level']}")

    # Verify 9-stage array
    stages = sample_app["nine_stages"]
    assert len(stages) == 9, f"Expected 9 stages, got {len(stages)}"
    print(f"  + 9 Lifecycle Stages: {', '.join(s['label'] for s in stages)}")

    # Verify Department Tracking Matrix
    dept_track = sample_app["department_tracking"]
    assert len(dept_track) == 5, f"Expected 5 departments, got {len(dept_track)}"
    print(f"  + Department Review Matrix:")
    for dt in dept_track:
        print(f"    - {dt['department_name']}: {dt['review_status']} | Officer: {dt['assigned_officer']} | SLA: {dt['sla_status']}")

    # Verify AI Status Intelligence
    ai = sample_app["ai_status_intelligence"]
    assert "approval_probability" in ai, "Missing approval_probability"
    assert "approval_readiness_score" in ai, "Missing approval_readiness_score"
    print(f"  + AI Status Intelligence:")
    print(f"    - Approval Probability: {ai['approval_probability']}%")
    print(f"    - Readiness Score: {ai['approval_readiness_score']}%")
    print(f"    - Compliance Score: {ai['compliance_score']}%")
    print(f"    - DQCI Quality Grade: {ai['dqci_grade']}")

    # 2. Test Single Application Detail
    proj_id = sample_app["id"]
    print(f"\n[TEST 2] Testing GET /api/application-status/{proj_id} ...")
    res_detail = client.get(f"/api/application-status/{proj_id}", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_detail.status_code == 200, f"Detail failed: {res_detail.status_code} {res_detail.text}"
    detail_data = res_detail.json()
    assert detail_data["id"] == proj_id, "Project ID mismatch"
    assert "timeline" in detail_data, "Missing timeline"
    assert "comments" in detail_data, "Missing comments"
    print(f"  + Application Detail retrieved successfully for ID: {proj_id}")

    # 3. Test Export Status Report
    print(f"\n[TEST 3] Testing GET /api/application-status/{proj_id}/export-report ...")
    res_report = client.get(f"/api/application-status/{proj_id}/export-report", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_report.status_code == 200, f"Report failed: {res_report.status_code} {res_report.text}"
    report_data = res_report.json()
    assert "report" in report_data, "Missing report text"
    assert len(report_data["report"]) > 100, "Report text is too short"
    print(f"  + Generated Official Report: {report_data['filename']}")
    print("  + Report Preview:")
    for line in report_data["report"].split("\n")[:10]:
        print(f"    | {line}")

    print("\n" + "=" * 75)
    print("[SUCCESS] ALL ENTERPRISE APPLICATION STATUS TESTS PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_application_status_tests()
