import os
import sys

# Force UTF-8 stdout encoding for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from app.services.project_service import get_all_projects

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("[RUNNING] Knowledge Extraction Endpoint Verification")
    print("=" * 70)

    projects = get_all_projects()
    assert len(projects) > 0, "No projects found"
    proj_id = projects[0].id
    print(f"[*] Testing Project ID: {proj_id} ({projects[0].title or projects[0].filename})")

    res = client.get(
        f"/api/dpr/{proj_id}/knowledge-extraction",
        headers={"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}
    )
    print(f"[*] Status Code: {res.status_code}")
    assert res.status_code == 200, f"Failed: {res.status_code} {res.text}"

    data = res.json()
    assert "briefings" in data, "Missing briefings in response"
    assert "dqci" in data, "Missing dqci in response"
    assert "entities" in data, "Missing entities in response"
    print("  + Executive Briefings: OK")
    print(f"  + DQCI Score: {data['dqci'].get('overall_dqci')}% ({data['dqci'].get('grade')})")
    print("  + Entities: OK")

    print("\n" + "=" * 70)
    print("[SUCCESS] /api/dpr/{dpr_id}/knowledge-extraction PASSED 100%")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
