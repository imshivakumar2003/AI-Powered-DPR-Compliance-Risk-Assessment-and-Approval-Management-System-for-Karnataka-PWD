# Backend/scripts/test_user_global_access.py

import urllib.request
import urllib.error
import json
import sys
import os
import sqlite3

BASE_URL = "http://127.0.0.1:8000"

def seed_test_dpr():
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "Database", "projects.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE id='test-global-dpr-1'")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO projects (id, filename, original_filename, status, upload_date, estimated_cost, sector, state, title, submitted_by)
            VALUES ('test-global-dpr-1', 'test.pdf', 'karnataka_bypass_dpr.pdf', 'PENDING', '2026-08-13T00:00:00Z', 85.0, 'Roads', 'Karnataka', 'Bangalore Rural Bypass Corridor', 'pwd_engineer')
        """)
        conn.commit()
    conn.close()

def make_req(url, method="GET", headers=None, data=None):
    req_data = json.dumps(data).encode('utf-8') if data else None
    headers = headers or {}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            content_type = response.headers.get('Content-Type', '')
            raw = response.read()
            if 'json' in content_type:
                return status, json.loads(raw.decode('utf-8'))
            elif 'pdf' in content_type or raw.startswith(b'%PDF'):
                return status, f"PDF Binary Data ({len(raw)} bytes)"
            else:
                return status, raw.decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        return e.code, body
    except Exception as e:
        return 500, str(e)

def test_user_global_access():
    seed_test_dpr()

    print("==================================================")
    print("Testing User Global Access to All DPRs & Real-Time Approval Updates")
    print("==================================================")

    # 1. Normal User fetches /api/projects
    headers_user = {"X-User-Name": "user_alpha", "X-User-Role": "user"}
    status_list, dprs = make_req(f"{BASE_URL}/api/projects", headers=headers_user)
    print(f"[1] User (user_alpha) listing /api/projects: Status {status_list}, Total returned: {len(dprs)}")
    if status_list != 200 or not dprs:
        print("    FAILED: User could not fetch system DPR list!")
        return False
    print("    SUCCESS: User received all system DPR proposals.")

    # 2. User fetches info for DPR submitted by pwd_engineer
    status_info, info = make_req(f"{BASE_URL}/api/dpr/test-global-dpr-1/info", headers=headers_user)
    print(f"[2] User GET /api/dpr/test-global-dpr-1/info: Status {status_info}")
    if status_info != 200:
        print(f"    FAILED: Expected 200, got {status_info}")
        return False
    print(f"    SUCCESS: User opened DPR '{info.get('title')}' submitted by '{info.get('submitted_by')}'")

    # 3. User downloads report/PDF for DPR
    status_dl, dl_resp = make_req(f"{BASE_URL}/api/dpr/test-global-dpr-1/report/download", headers=headers_user)
    print(f"[3] User GET /api/dpr/test-global-dpr-1/report/download: Status {status_dl}")
    if status_dl != 200:
        print(f"    FAILED: Expected 200, got {status_dl}")
        return False
    print(f"    SUCCESS: User can view/download uploaded DPR report PDF ({dl_resp}).")

    # 4. User executes Approval on DPR
    approval_payload = {
        "decision": "approve",
        "comment": "Verified against Karnataka PWD norms and environmental guidelines. Approved for execution."
    }
    status_appr, resp_appr = make_req(f"{BASE_URL}/api/dpr/test-global-dpr-1/approve", method="POST", headers=headers_user, data=approval_payload)
    print(f"[4] User POST /api/dpr/test-global-dpr-1/approve: Status {status_appr}")
    if status_appr != 200:
        print(f"    FAILED: Approval execution failed: {resp_appr}")
        return False

    # 5. Check immediate status reflection in Track & History
    status_track, track_detail = make_req(f"{BASE_URL}/api/application-status/test-global-dpr-1", headers=headers_user)
    print(f"[5] User checking /api/application-status/test-global-dpr-1: Status {status_track}")
    if status_track != 200:
        print(f"    FAILED: Track check failed: {status_track}")
        return False

    updated_status = track_detail.get("status")
    approval_comment = track_detail.get("approval_comment")
    print(f"    Updated Status: '{updated_status}'")
    print(f"    Approval Comment: '{approval_comment}'")

    if updated_status == "APPROVED" and approval_comment:
        print("\n==================================================")
        print("ALL USER GLOBAL ACCESS & APPROVAL TESTS PASSED 100% CLEANLY!")
        print("==================================================")
        return True
    else:
        print(f"    FAILED: Expected status APPROVED, got {updated_status}")
        return False

if __name__ == "__main__":
    success = test_user_global_access()
    if not success:
        sys.exit(1)
