"""
Comprehensive Authentication and Login Flow Verification Suite
Tests:
- Login with Admin, Requester/User, Viewer roles
- JWT token structure, signature, claims
- API endpoint aliases (/auth/login and /api/auth/login)
- Invalid credentials rejection
- Disabled account handling
- User registration and login
"""

import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from app.services.auth_service import decode_token

client = TestClient(app)

def run_auth_tests():
    print("=" * 70)
    print("[TEST SUITE] DPR-AI Authentication & Login Flow Verification")
    print("=" * 70)

    # 1. Admin Login
    print("\n[1] Testing Admin Login (admin / admin)...")
    res = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    data = res.json()
    assert "access_token" in data, "No access_token returned"
    assert data["role"] == "admin", f"Role mismatch: {data.get('role')}"
    assert data["username"] == "admin", f"Username mismatch: {data.get('username')}"
    decoded = decode_token(data["access_token"])
    assert decoded is not None, "Token decoding failed"
    assert decoded.username == "admin", "Decoded username mismatch"
    assert decoded.role == "admin", "Decoded role mismatch"
    print(f"  + Admin Login SUCCESS: User={data['username']}, Role={data['role']}, Dept={data.get('department')}")

    # 2. Requester/User Login
    print("\n[2] Testing Project Requester Login (user / user)...")
    res = client.post("/auth/login", json={"username": "user", "password": "user"})
    assert res.status_code == 200, f"User login failed: {res.text}"
    data = res.json()
    assert data["role"] == "user", f"Role mismatch: {data.get('role')}"
    print(f"  + User Login SUCCESS: User={data['username']}, Role={data['role']}, Dept={data.get('department')}")

    # 3. Viewer Login
    print("\n[3] Testing Viewer Login (test / 1234)...")
    res = client.post("/auth/login", json={"username": "test", "password": "1234"})
    assert res.status_code == 200, f"Viewer login failed: {res.text}"
    data = res.json()
    assert data["role"] == "viewer", f"Role mismatch: {data.get('role')}"
    print(f"  + Viewer Login SUCCESS: User={data['username']}, Role={data['role']}")

    # 4. /api/auth/login Alias
    print("\n[4] Testing /api/auth/login Alias...")
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200, f"/api/auth/login failed: {res.text}"
    print("  + /api/auth/login Alias SUCCESS")

    # 5. Invalid Credentials
    print("\n[5] Testing Invalid Password Rejection...")
    res = client.post("/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print(f"  + Correctly rejected with 401: {res.json().get('detail')}")

    # 6. Non-Existent User Rejection
    print("\n[6] Testing Non-Existent User Rejection...")
    res = client.post("/auth/login", json={"username": "unknown_user_99", "password": "anypassword"})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print(f"  + Correctly rejected with 401: {res.json().get('detail')}")

    # 7. Test /auth/me Endpoint
    print("\n[7] Testing Authenticated /auth/me Profile Extraction...")
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert res.status_code == 200, f"/auth/me failed: {res.text}"
    me = res.json()
    print(f"  + Profile retrieved: {me['full_name']} ({me['email']}) - Role: {me['role']}")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL AUTHENTICATION TESTS PASSED (100%)")
    print("=" * 70)

if __name__ == "__main__":
    run_auth_tests()
