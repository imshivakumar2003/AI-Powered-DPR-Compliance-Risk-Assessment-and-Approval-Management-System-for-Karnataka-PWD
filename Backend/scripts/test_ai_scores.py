import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_centralized_ai_scores():
    print("Testing GET /api/projects to find sample project ID...")
    projects_res = client.get("/api/projects")
    assert projects_res.status_code == 200
    projects = projects_res.json()
    assert len(projects) > 0
    sample_id = projects[0]["id"]
    print(f"  + Testing with sample DPR ID: {sample_id}")

    # 1. Test /api/dpr/{dpr_id}/ai-scores
    scores_res = client.get(f"/api/dpr/{sample_id}/ai-scores")
    assert scores_res.status_code == 200, f"Expected 200, got {scores_res.status_code}: {scores_res.text}"
    scores = scores_res.json()
    
    print(f"  + Overall AI Score: {scores.get('overall_ai_score')}% ({scores.get('grade')})")
    print(f"  + DPR Quality Score: {scores.get('dpr_quality_score')}%")
    print(f"  + Compliance Score: {scores.get('compliance_score')}%")
    print(f"  + Risk Score: {scores.get('risk_score')}% (Safety: {scores.get('safety_score')}%)")
    print(f"  + Technical Score: {scores.get('technical_score')}%")
    print(f"  + Financial Score: {scores.get('financial_score')}%")
    print(f"  + Documentation Score: {scores.get('documentation_score')}%")
    print(f"  + Approval Readiness Score: {scores.get('approval_readiness_score')}%")
    print(f"  + Confidence Score: {scores.get('confidence_score')}% (OCR: {scores.get('ocr_accuracy')}%, RAG: {scores.get('rag_confidence')}%)")
    print(f"  + AI Recommendation Score: {scores.get('recommendation_score')}%")

    assert scores.get("overall_ai_score") is not None
    assert scores.get("approval_readiness_score") is not None
    assert len(scores.get("page_references", [])) > 0
    assert len(scores.get("historical_snapshots", [])) > 0

    # 2. Test /api/dpr/{dpr_id}/scores-explainability
    expl_res = client.get(f"/api/dpr/{sample_id}/scores-explainability")
    assert expl_res.status_code == 200
    expl = expl_res.json()
    assert "explainability" in expl
    assert "overall_ai_score" in expl["explainability"]
    print(f"  + Explainability loaded with {len(expl['explainability'])} factor details")

    # 3. Test /api/application-status consistency
    app_res = client.get("/api/application-status")
    assert app_res.status_code == 200
    app_items = app_res.json()
    assert len(app_items) > 0
    matched = next((item for item in app_items if item["id"] == sample_id), None)
    assert matched is not None
    assert matched.get("overall_ai_score") == scores.get("overall_ai_score")
    assert matched.get("approval_readiness_score") == scores.get("approval_readiness_score")
    print("  + Application Status scores match centralized AI scores 100%!")

    print("\n[SUCCESS] Centralized AI Analysis Scores verified 100% across Backend!")

if __name__ == "__main__":
    test_centralized_ai_scores()
