"""
Test Theme System Persistence in Backend Settings API
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

client = TestClient(app)

def test_theme_persistence():
    print("=" * 70)
    print("[TEST SUITE] Dark / Light Mode Theme Persistence Verification")
    print("=" * 70)

    # 1. Fetch current settings
    print("\n[1] Fetching GET /api/settings...")
    r1 = client.get("/api/settings")
    assert r1.status_code == 200, f"Failed: {r1.text}"
    s1 = r1.json()
    print(f"  + Current settings loaded: theme={s1.get('theme', 'none')}")

    # 2. Update theme to dark
    print("\n[2] Setting theme='dark' via PUT /api/settings...")
    s1["theme"] = "dark"
    r2 = client.put("/api/settings", json=s1)
    assert r2.status_code == 200, f"Failed: {r2.text}"
    s2 = r2.json()
    assert s2.get("theme") == "dark", f"Expected dark, got {s2.get('theme')}"
    print("  + Persisted theme='dark' successfully")

    # 3. Update theme to light
    print("\n[3] Setting theme='light' via PUT /api/settings...")
    s1["theme"] = "light"
    r3 = client.put("/api/settings", json=s1)
    assert r3.status_code == 200, f"Failed: {r3.text}"
    s3 = r3.json()
    assert s3.get("theme") == "light", f"Expected light, got {s3.get('theme')}"
    print("  + Persisted theme='light' successfully")

    # 4. Verify GET returns updated light theme
    print("\n[4] Verifying GET /api/settings returns persisted theme='light'...")
    r4 = client.get("/api/settings")
    assert r4.status_code == 200
    assert r4.json().get("theme") == "light"
    print("  + GET /api/settings matches persisted light theme (100% verified)")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL THEME PERSISTENCE TESTS PASSED (100%)")
    print("=" * 70)

if __name__ == "__main__":
    test_theme_persistence()
