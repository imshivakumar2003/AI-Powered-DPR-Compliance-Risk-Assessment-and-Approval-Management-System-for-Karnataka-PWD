import requests
import os

BASE_URL = "http://localhost:8000"

def test_conversation_sync_workflow():
    print("=== Verification of Application Status & AI Suggestions Conversation Workflow ===")

    # 1. Upload a test DPR proposal as user 'chaya' (User ID: 7)
    chaya_headers = {"X-User-Role": "viewer", "X-User-Name": "chaya", "X-User-Id": "7"}
    files = {'file': ('conversation_test.pdf', b'%PDF-1.4 Conversation Sync Test File', 'application/pdf')}
    data = {
        'title': 'Bridge Expansion DPR - Conversation Test',
        'state': 'Hassan',
        'sector': 'Bridges',
        'cost_crores': '60.0',
        'duration_months': '18',
        'submitted_by': 'chaya',
        'notes': 'Conversation sync workflow test'
    }

    r_upload = requests.post(f"{BASE_URL}/api/dpr/upload", headers=chaya_headers, files=files, data=data)
    assert r_upload.status_code == 200, f"Expected 200, got {r_upload.status_code}"
    project_id = r_upload.json()["id"]
    print(f"[1] Created test project -> ID: '{project_id}'")

    # 2. Submitter 'chaya' posts a message in Application Status / AI Suggestions
    comment_data = {
        'author_role': 'user',
        'author_name': 'chaya',
        'message': 'Hello Reviewer, please inspect Section 4 budget estimation for Hassan bridge expansion.'
    }
    r_msg1 = requests.post(f"{BASE_URL}/api/application-status/{project_id}/comment-with-file", headers=chaya_headers, data=comment_data)
    assert r_msg1.status_code == 200, f"Expected 200, got {r_msg1.status_code}"
    print(f"[2] User 'chaya' posted message -> ID: '{r_msg1.json()['comment']['id']}'")

    # 3. Reviewer 'admin' (User ID: 1) replies to user's message
    admin_headers = {"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    reply_data = {
        'author_role': 'reviewer',
        'author_name': 'State Technical Advisory Committee',
        'message': 'Section 4 verified. Rates benchmarked with CPWD 2025 Schedule of Rates.'
    }
    r_msg2 = requests.post(f"{BASE_URL}/api/application-status/{project_id}/comment", headers=admin_headers, json=reply_data)
    assert r_msg2.status_code == 200, f"Expected 200, got {r_msg2.status_code}"
    print(f"[3] Reviewer posted reply -> ID: '{r_msg2.json()['comment']['id']}'")

    # 4. Fetch comments as 'chaya' -> Expect 2 thread messages
    r_comments = requests.get(f"{BASE_URL}/api/application-status/{project_id}/comments", headers=chaya_headers)
    print(f"[4] GET comments status: {r_comments.status_code}, response: {r_comments.text}")
    assert r_comments.status_code == 200, f"Expected 200, got {r_comments.status_code}"
    comments_list = r_comments.json()
    assert len(comments_list) == 2, f"Expected 2 comments, got {len(comments_list)}"
    print(f"[4] Synchronized conversation thread verified ({len(comments_list)} messages in thread)")

    # 5. Verify data isolation: User 'student_999' (ID: 999) cannot access chaya's project details
    unauth_headers = {"X-User-Role": "viewer", "X-User-Name": "student_999", "X-User-Id": "999"}
    r_unauth = requests.get(f"{BASE_URL}/api/dpr/{project_id}/info", headers=unauth_headers)
    print(f"[5] Unauthorized user access attempt -> Status Code: {r_unauth.status_code}")
    assert r_unauth.status_code in (403, 404), f"Expected 403/404, got {r_unauth.status_code}"

    # Clean up test DPR as admin
    requests.delete(f"{BASE_URL}/api/dpr/{project_id}", headers=admin_headers)
    print(f"[6] Test project cleaned up successfully")

    print("\n[SUCCESS] Application Status & AI Suggestions Conversation Workflow verified 100% successfully!")

if __name__ == "__main__":
    test_conversation_sync_workflow()
