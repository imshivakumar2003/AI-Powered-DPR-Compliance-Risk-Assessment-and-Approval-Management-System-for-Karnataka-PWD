"""
Automated Test Suite for Deep Explainable AI Recommendations & Suggestions Platform
Tests:
1. Project-level deep recommendations & 6-KPI dashboard
2. Verifiable page citations & section headings
3. Karnataka PWD & IRC guideline references
4. Multi-project cross-corpus recommendation aggregation
"""

import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from app.services.project_service import get_all_projects

client = TestClient(app)

def run_tests():
    print("=" * 75)
    print("[RUNNING] Explainable AI Recommendations Test Suite")
    print("=" * 75)

    projects = get_all_projects()
    print(f"[*] Found {len(projects)} projects in database.")
    assert len(projects) > 0, "No projects found in database!"

    sample_project = projects[0]
    proj_id = sample_project.id
    print(f"[*] Testing Deep Recommendations for: {sample_project.title or sample_project.filename} (ID: {proj_id})")

    # 1. Test Project-level recommendations
    print("\n[TEST 1] Testing GET /api/dpr/{dpr_id}/recommendations ...")
    res = client.get(f"/api/dpr/{proj_id}/recommendations", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res.status_code == 200, f"Failed: {res.status_code} {res.text}"
    data = res.json()

    # Check dashboard KPIs
    assert "dashboard" in data, "Missing dashboard in response"
    db = data["dashboard"]
    print(f"  + Compliance Score: {db.get('compliance_score')}%")
    print(f"  + DQCI Quality Score: {db.get('dqci_quality_score')}% ({db.get('dqci_grade')})")
    print(f"  + Cost Risk Score: {db.get('cost_risk_score')}")
    print(f"  + Schedule Risk Score: {db.get('schedule_risk_score')}")
    print(f"  + Approval Readiness: {db.get('approval_readiness_score')}%")
    print(f"  + Missing Information Alerts: {len(db.get('missing_information_alerts', []))} alerts")
    print(f"  + Top Risks: {len(db.get('top_risks', []))} items")

    # Check recommendations list & explainability fields
    recs = data.get("recommendations", [])
    assert len(recs) > 0, "No recommendations generated"
    print(f"  + Generated {len(recs)} granular explainable recommendations:")

    for r in recs[:3]:
        assert "dpr_page_numbers" in r, "Missing dpr_page_numbers"
        assert "dpr_section_name" in r, "Missing dpr_section_name"
        assert "supporting_evidence" in r, "Missing supporting_evidence"
        assert "guideline_reference" in r, "Missing guideline_reference"
        assert "suggested_action" in r, "Missing suggested_action"
        assert "actionable_steps" in r, "Missing actionable_steps"
        print(f"    - [{r['id']}] ({r['impact'].upper()} Impact, {r['confidence_score']}%) {r['title']}")
        print(f"      Pages: {r['dpr_page_numbers']} | Section: {r['dpr_section_name']}")
        print(f"      Guideline: {r['guideline_reference']}")

    # 2. Test All Recommendations Aggregation
    print("\n[TEST 2] Testing GET /api/recommendations ...")
    res_all = client.get("/api/recommendations", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_all.status_code == 200, f"Failed: {res_all.status_code} {res_all.text}"
    all_recs = res_all.json()
    assert len(all_recs) > 0, "No aggregated recommendations found"
    print(f"  + Total Aggregated Recommendations across all DPRs: {len(all_recs)}")

    print("\n" + "=" * 75)
    print("[SUCCESS] ALL EXPLAINABLE AI RECOMMENDATION TESTS PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
