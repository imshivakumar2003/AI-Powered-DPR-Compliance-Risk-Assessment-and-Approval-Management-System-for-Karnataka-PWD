import requests
import os

BASE_URL = "http://localhost:8000"

def test_ai_assistant_and_settings_workflow():
    print("=== Verification of DPR AI Assistant & Admin Settings API Key Workflow ===")

    # 1. Update Admin Settings with a test Groq API Key
    test_key = "gsk_test_api_key_1234567890_abcdef"
    payload_settings = {
        "risk_threshold": 75,
        "email_alerts": True,
        "auto_assign": True,
        "language": "en",
        "groq_api_key": test_key
    }
    r_put = requests.put(f"{BASE_URL}/api/settings", json=payload_settings)
    assert r_put.status_code == 200, f"Expected 200 on PUT /api/settings, got {r_put.status_code}"
    print(f"[1] PUT /api/settings saved groq_api_key successfully")

    # 2. Get Admin Settings to verify persistence
    r_get = requests.get(f"{BASE_URL}/api/settings")
    assert r_get.status_code == 200, f"Expected 200 on GET /api/settings, got {r_get.status_code}"
    saved_settings = r_get.json()
    assert saved_settings.get("groq_api_key") == test_key, f"Expected {test_key}, got {saved_settings.get('groq_api_key')}"
    print(f"[2] GET /api/settings verified persisted API key: '{saved_settings.get('groq_api_key')}'")

    # 3. Query DPR AI Assistant for general status tracking
    r_chat1 = requests.post(f"{BASE_URL}/api/chat", json={"message": "How do I track my DPR application status?"})
    assert r_chat1.status_code == 200, f"Expected 200, got {r_chat1.status_code}"
    res1 = r_chat1.json()
    assert "reply" in res1 and len(res1["reply"]) > 50
    assert "Application Status" in res1["reply"] or "stage" in res1["reply"].lower()
    print(f"[3] Chat Query 'Status Tracking' response verified ({len(res1['reply'])} chars)")

    # 4. Query DPR AI Assistant for Environmental Clearances
    r_chat2 = requests.post(f"{BASE_URL}/api/chat", json={"message": "What environmental clearances and EIA reports are required for road DPRs?"})
    assert r_chat2.status_code == 200
    res2 = r_chat2.json()
    assert "Forest Clearance" in res2["reply"] or "MoEFCC" in res2["reply"] or "EIA" in res2["reply"]
    print(f"[4] Chat Query 'Environmental Clearances' response verified")

    # 5. Query DPR AI Assistant for Land Acquisition & LARR 2013
    r_chat3 = requests.post(f"{BASE_URL}/api/chat", json={"message": "What are the LARR 2013 land acquisition guidelines for Karnataka PWD?"})
    assert r_chat3.status_code == 200
    res3 = r_chat3.json()
    assert "LARR" in res3["reply"] or "Land Acquisition" in res3["reply"]
    print(f"[5] Chat Query 'Land Acquisition LARR 2013' response verified")

    # 6. Query DPR AI Assistant for AS & TS Sanction Powers
    r_chat4 = requests.post(f"{BASE_URL}/api/chat", json={"message": "What are the Administrative and Technical Sanction powers of Chief Engineers and Executive Engineers?"})
    assert r_chat4.status_code == 200
    res4 = r_chat4.json()
    assert "Executive Engineer" in res4["reply"] or "Chief Engineer" in res4["reply"] or "Sanction" in res4["reply"]
    print(f"[6] Chat Query 'AS/TS Sanction Powers' response verified")

    # 7. Create a temporary DPR and query AI Assistant with dpr_id context
    admin_headers = {"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    files = {'file': ('ai_test_dpr.pdf', b'%PDF-1.4 AI Assistant Test File', 'application/pdf')}
    data = {
        'title': 'AI Assistant Context Test Highway',
        'state': 'Chitradurga',
        'sector': 'Highways',
        'cost_crores': '145.0',
        'duration_months': '24',
        'submitted_by': 'admin',
    }
    r_upload = requests.post(f"{BASE_URL}/api/dpr/upload", headers=admin_headers, files=files, data=data)
    assert r_upload.status_code == 200
    dpr_id = r_upload.json()["id"]

    r_chat_dpr = requests.post(f"{BASE_URL}/api/chat", json={"message": "What is the status and score of this project?", "dpr_id": dpr_id})
    assert r_chat_dpr.status_code == 200
    res_dpr = r_chat_dpr.json()
    assert dpr_id[:8].upper() in res_dpr["reply"] or "AI Assistant Context Test Highway" in res_dpr["reply"] or "Status" in res_dpr["reply"]
    print(f"[7] Chat Query with dpr_id context verified ({len(res_dpr['reply'])} chars)")

    # Cleanup test DPR
    requests.delete(f"{BASE_URL}/api/dpr/{dpr_id}", headers=admin_headers)
    print(f"[8] Cleanup test project complete")

    print("\n[SUCCESS] DPR AI Assistant & Admin Settings API Key Workflow verified 100% successfully!")

if __name__ == "__main__":
    test_ai_assistant_and_settings_workflow()
