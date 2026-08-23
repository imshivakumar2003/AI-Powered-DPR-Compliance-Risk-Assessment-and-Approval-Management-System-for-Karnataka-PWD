import requests
import sys

BASE_URL = "http://localhost:8000"

def test_application_status_rbac():
    print("=== Testing Application Status Role-Based Access Control ===")
    
    # 1. Admin user request -> Should succeed (200 OK)
    admin_headers = {"X-User-Role": "admin", "X-User-Name": "admin_user"}
    r_admin = requests.get(f"{BASE_URL}/api/application-status", headers=admin_headers)
    print(f"[Admin Access] GET /api/application-status -> Status Code: {r_admin.status_code}")
    assert r_admin.status_code == 200, f"Expected 200 for Admin, got {r_admin.status_code}"

    # 2. Priya Sharma request -> Should succeed (200 OK)
    priya_headers = {"X-User-Role": "submitter", "X-User-Name": "priya_sharma"}
    r_priya = requests.get(f"{BASE_URL}/api/application-status", headers=priya_headers)
    print(f"[Priya Sharma Access] GET /api/application-status -> Status Code: {r_priya.status_code}")
    assert r_priya.status_code == 200, f"Expected 200 for Priya Sharma, got {r_priya.status_code}"

    # 3. Normal User request -> Should be blocked (403 Forbidden)
    normal_headers = {"X-User-Role": "submitter", "X-User-Name": "normal_student_2026"}
    r_normal = requests.get(f"{BASE_URL}/api/application-status", headers=normal_headers)
    print(f"[Normal User Access] GET /api/application-status -> Status Code: {r_normal.status_code}")
    assert r_normal.status_code == 403, f"Expected 403 Forbidden for Normal User, got {r_normal.status_code}"
    
    print("\n[SUCCESS] All Application Status RBAC tests passed 100% successfully!")

if __name__ == "__main__":
    test_application_status_rbac()
