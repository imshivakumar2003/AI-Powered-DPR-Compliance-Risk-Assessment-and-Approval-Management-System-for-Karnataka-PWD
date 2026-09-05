import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_visual_representation_analytics():
    print("Testing GET /api/analytics/visual-representation ...")
    res = client.get("/api/analytics/visual-representation")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    
    # Check KPIs
    kpis = data.get("kpis", {})
    print(f"  + KPIs loaded: total_dprs={kpis.get('total_dprs')}, approved={kpis.get('approved_dprs')}, pending={kpis.get('pending_dprs')}, rejected={kpis.get('rejected_dprs')}")
    assert "total_dprs" in kpis
    assert "approval_rate_pct" in kpis
    assert "avg_approval_time_days" in kpis
    assert "high_risk_dprs" in kpis

    # Check Status Distribution
    status_dist = data.get("status_distribution", [])
    print(f"  + Status distribution segments: {len(status_dist)}")
    assert len(status_dist) == 4

    # Check Department Performance
    dept_perf = data.get("department_performance", [])
    print(f"  + Department performance entries: {len(dept_perf)}")
    assert len(dept_perf) >= 5

    # Check Monthly Trend
    monthly_trend = data.get("monthly_submission_trend", [])
    print(f"  + Monthly submission trend points: {len(monthly_trend)}")
    assert len(monthly_trend) >= 6

    # Check Risk Analytics & Heatmap
    risk = data.get("risk_analytics", {})
    assert "heatmap" in risk
    assert len(risk["heatmap"]) > 0
    print(f"  + Risk heatmap cells: {len(risk['heatmap'])}")

    # Check Compliance Analytics
    comp = data.get("compliance_analytics", {})
    assert "guideline_statistics" in comp
    print(f"  + Guideline statistics count: {len(comp['guideline_statistics'])}")

    # Check Approval Analytics
    appr = data.get("approval_analytics", {})
    assert "bottlenecks" in appr
    print(f"  + Bottlenecks identified: {len(appr['bottlenecks'])}")

    # Check Financial Analytics
    fin = data.get("financial_analytics", {})
    assert "total_budget_cr" in fin
    print(f"  + Total Project Budget: Rs {fin['total_budget_cr']} Cr")

    print("\n[SUCCESS] /api/analytics/visual-representation verified 100% successfully!")

if __name__ == "__main__":
    test_visual_representation_analytics()
