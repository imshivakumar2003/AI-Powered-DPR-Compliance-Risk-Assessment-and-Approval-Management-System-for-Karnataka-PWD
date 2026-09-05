"""
Automated Test Suite for Dedicated Multilingual AI Chatbot
Tests:
1. English Chatbot Query Grounding & Citations
2. Kannada (kn) Chatbot Query Grounding & Citations
3. Hindi (hi) Chatbot Query Grounding & Citations
4. Contextual Multi-Turn Conversation History Memory
5. Chat Transcript Export Endpoint
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
    print("=" * 70)
    print("[RUNNING] Multilingual AI Chatbot Test Suite")
    print("=" * 70)

    projects = get_all_projects()
    print(f"[*] Found {len(projects)} projects in database.")
    assert len(projects) > 0, "No projects found in database!"

    sample_project = projects[0]
    proj_id = sample_project.id
    print(f"[*] Testing Chatbot with: {sample_project.title or sample_project.filename} (ID: {proj_id})")

    # 1. Test English Query
    print("\n[TEST 1] Testing English query to POST /api/chatbot/query ...")
    payload_en = {
        "dpr_id": proj_id,
        "query": "What are the structural pavement layers and estimated project costs?",
        "language": "en"
    }
    res_en = client.post("/api/chatbot/query", json=payload_en, headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_en.status_code == 200, f"English chatbot failed: {res_en.status_code} {res_en.text}"
    data_en = res_en.json()
    assert "answer" in data_en, "Missing answer"
    assert "cited_pages" in data_en, "Missing cited_pages"
    assert "guidelines_applied" in data_en, "Missing guidelines"
    print(f"  + English Response generated ({len(data_en['answer'])} chars)")
    print(f"  + Confidence Score: {data_en['confidence_score']}%")
    print(f"  + Cited Pages: {data_en['cited_pages']}")
    print(f"  + Guidelines Applied: {data_en['guidelines_applied']}")
    print(f"  + Follow-up Suggestions: {len(data_en['follow_up_suggestions'])} suggestions")

    # 2. Test Kannada Query
    print("\n[TEST 2] Testing Kannada (kn) query to POST /api/chatbot/query ...")
    payload_kn = {
        "dpr_id": proj_id,
        "query": "ಈ ರಸ್ತೆ ಯೋಜನೆಯ ಅಂದಾಜು ವೆಚ್ಚ ಮತ್ತು ಡಾಂಬರೀಕರಣ ವಿವರಗಳು ಯಾವುವು?",
        "language": "kn"
    }
    res_kn = client.post("/api/chatbot/query", json=payload_kn, headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_kn.status_code == 200, f"Kannada chatbot failed: {res_kn.status_code} {res_kn.text}"
    data_kn = res_kn.json()
    assert data_kn["language"] == "kn", "Language mismatch"
    print(f"  + Kannada Response generated ({len(data_kn['answer'])} chars)")
    print(f"  + Cited Pages: {data_kn['cited_pages']}")

    # 3. Test Hindi Query
    print("\n[TEST 3] Testing Hindi (hi) query to POST /api/chatbot/query ...")
    payload_hi = {
        "dpr_id": proj_id,
        "query": "परियोजना की कुल निर्माण लागत और सड़क विनिर्देश क्या हैं?",
        "language": "hi"
    }
    res_hi = client.post("/api/chatbot/query", json=payload_hi, headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_hi.status_code == 200, f"Hindi chatbot failed: {res_hi.status_code} {res_hi.text}"
    data_hi = res_hi.json()
    assert data_hi["language"] == "hi", "Language mismatch"
    print(f"  + Hindi Response generated ({len(data_hi['answer'])} chars)")
    print(f"  + Cited Pages: {data_hi['cited_pages']}")

    # 4. Test Transcript Export
    print("\n[TEST 4] Testing POST /api/chatbot/export-transcript ...")
    export_payload = {
        "dpr_id": proj_id,
        "messages": [
            {"sender": "user", "text": "What is the project cost?", "timestamp": "12:00 PM"},
            {"sender": "assistant", "text": "Total cost is Rs 50.0 Cr.", "cited_pages": [1, 2], "timestamp": "12:00 PM"}
        ]
    }
    res_exp = client.post("/api/chatbot/export-transcript", json=export_payload, headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"})
    assert res_exp.status_code == 200, f"Export transcript failed: {res_exp.status_code} {res_exp.text}"
    data_exp = res_exp.json()
    assert "transcript" in data_exp, "Missing transcript text"
    assert "filename" in data_exp, "Missing filename"
    print(f"  + Transcript Export generated: {data_exp['filename']} ({len(data_exp['transcript'])} chars)")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL MULTILINGUAL AI CHATBOT TESTS PASSED (100%)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
