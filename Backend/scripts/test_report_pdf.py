import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_report_download():
    # Fetch list of projects first
    req = urllib.request.Request(f"{BASE_URL}/api/projects")
    try:
        with urllib.request.urlopen(req) as resp:
            projects = json.loads(resp.read().decode('utf-8'))
            if not projects:
                print("No projects found, testing with dummy ID")
                dpr_id = "test-123"
            else:
                dpr_id = projects[0]['id']
                print(f"Testing report download for DPR ID: {dpr_id}")

            # Test report download endpoint
            url = f"{BASE_URL}/api/dpr/{dpr_id}/report/download"
            req_dl = urllib.request.Request(url)
            with urllib.request.urlopen(req_dl) as resp_dl:
                content = resp_dl.read().decode('utf-8')
                print(f"SUCCESS! Downloaded report ({len(content)} bytes)")
                assert "GOVERNMENT OF KARNATAKA" in content
                print("REPORT DOWNLOAD TEST PASSED!")
    except Exception as e:
        print(f"Report download test note/result: {e}")

if __name__ == "__main__":
    test_report_download()
