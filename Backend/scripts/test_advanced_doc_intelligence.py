"""
Automated Test Suite for Advanced Document Intelligence & RAG Engine
Tests:
1. Multi-Document Cross-Corpus RAG Querying
2. Deep Knowledge Extraction & 5-Level Executive Briefings
3. Document Quality & Completeness Index (DQCI)
4. IRC Standards & KPWD Schedule of Rates Compliance Audit
5. Cross-DPR Comparative Analytics API
"""

import os
import sys
import json

# Setup import path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from app.services.project_service import get_all_projects

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("[RUNNING] Advanced Document Intelligence & RAG Engine Test Suite")
    print("=" * 70)

    projects = get_all_projects()
    print(f"[*] Found {len(projects)} projects in database.")
    assert len(projects) > 0, "No projects found in database!"

    sample_project = projects[0]
    proj_id = sample_project.id
    print(f"[*] Testing with sample project: {sample_project.title or sample_project.filename} (ID: {proj_id})")

    # 1. Test Knowledge Extraction & 5-Level Briefings
    print("\n[TEST 1] Testing GET /api/dpr/{dpr_id}/knowledge-extraction ...")
    res1 = client.get(f"/api/dpr/{proj_id}/knowledge-extraction", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res1.status_code == 200, f"Knowledge extraction failed: {res1.status_code} {res1.text}"
    data1 = res1.json()
    assert "briefings" in data1, "Missing briefings in response"
    assert "dqci" in data1, "Missing dqci in response"
    assert "entities" in data1, "Missing entities in response"
    print(f"  + Executive Briefing generated ({len(data1['briefings']['executive_summary'])} chars)")
    print(f"  + DQCI Overall Score: {data1['dqci']['overall_dqci']}% ({data1['dqci']['grade']})")
    print(f"  + Extracted Pavement Layers: {len(data1['entities']['pavement_layers'])} layers")

    # 2. Test IRC Compliance Audit
    print("\n[TEST 2] Testing GET /api/dpr/{dpr_id}/compliance-audit ...")
    res2 = client.get(f"/api/dpr/{proj_id}/compliance-audit", headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res2.status_code == 200, f"Compliance audit failed: {res2.status_code} {res2.text}"
    data2 = res2.json()
    assert "compliance_score" in data2, "Missing compliance_score"
    assert "checks" in data2 and len(data2["checks"]) > 0, "Missing compliance checks"
    print(f"  + Compliance Score: {data2['compliance_score']}% ({data2['passed_checks']}/{data2['total_checks']} checks passed)")
    for chk in data2["checks"]:
        print(f"    - [{chk['status']}] {chk['code']}: {chk['observed_value'][:60]}...")

    # 3. Test Multi-Document Cross-Corpus RAG Query
    print("\n[TEST 3] Testing POST /api/dpr/rag/multi-query ...")
    multi_query_payload = {
        "query": "What are the structural pavement layers and subgrade CBR specifications?",
        "project_ids": [p.id for p in projects[:3]],
        "top_k": 5
    }
    res3 = client.post("/api/dpr/rag/multi-query", json=multi_query_payload, headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res3.status_code == 200, f"Multi-DPR RAG query failed: {res3.status_code} {res3.text}"
    data3 = res3.json()
    assert "answer" in data3, "Missing answer in multi-RAG response"
    assert "cited_projects" in data3, "Missing cited_projects"
    print(f"  + Answer synthesized across {len(data3['cited_projects'])} projects ({data3['engine']})")
    print(f"  + Confidence Score: {data3['confidence_score']}%")
    print(f"  + Cited Pages: {data3['cited_pages']}")

    # 4. Test Cross-DPR Comparative Analytics
    print("\n[TEST 4] Testing POST /api/dpr/compare ...")
    compare_payload = {
        "project_ids": [p.id for p in projects[:4]]
    }
    res4 = client.post("/api/dpr/compare", json=compare_payload, headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res4.status_code == 200, f"DPR compare failed: {res4.status_code} {res4.text}"
    data4 = res4.json()
    assert "total_projects_compared" in data4, "Missing total_projects_compared"
    assert "projects" in data4 and len(data4["projects"]) == len(compare_payload["project_ids"]), "Project count mismatch"
    print(f"  + Compared {data4['total_projects_compared']} DPRs")
    print(f"  + Total Outlay: INR {data4['total_capital_outlay_cr']} Cr (Avg: INR {data4['average_project_cost_cr']} Cr)")
    for cp in data4["projects"]:
        print(f"    - {cp['title'][:30]}: INR {cp['total_cost_cr']} Cr | CBR: {cp['subgrade_cbr']} | DQCI: {cp['dqci_score']}%")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL ADVANCED DOCUMENT INTELLIGENCE & RAG TESTS PASSED (100%)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
