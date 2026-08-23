import urllib.request

BASE_URL = "http://127.0.0.1:8000"
TEST_ID = "DPR-KA-2026-DA02E3"

ROUTES = [
    f"/api/report/{TEST_ID}",
    f"/api/report/{TEST_ID}/download",
    f"/api/dpr/{TEST_ID}/report",
    f"/api/dpr/{TEST_ID}/report/download",
    f"/api/dpr/{TEST_ID}/report/pdf",
    f"/api/dpr/{TEST_ID}/pdf",
]

def test_routes():
    print(f"Testing {len(ROUTES)} report download routes for DPR ID: {TEST_ID}")
    success_count = 0
    for path in ROUTES:
        url = f"{BASE_URL}{path}"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as resp:
                content = resp.read().decode('utf-8')
                print(f"[OK] {path:<38} -> Status: {resp.status} | Size: {len(content)} bytes")
                assert "GOVERNMENT OF KARNATAKA" in content
                success_count += 1
        except Exception as e:
            print(f"[FAIL] {path:<38} -> Error: {e}")

    print(f"\nRESULT: {success_count}/{len(ROUTES)} routes passed perfectly!")
    assert success_count == len(ROUTES), "Some report routes failed!"

if __name__ == "__main__":
    test_routes()
