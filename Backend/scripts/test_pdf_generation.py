import urllib.request

BASE_URL = "http://127.0.0.1:8000"
TEST_ID = "DPR-KA-2026-DA02E3"

def test_pdf_generation():
    url = f"{BASE_URL}/api/dpr/{TEST_ID}/report/download"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            content_type = resp.headers.get("Content-Type")
            print(f"Status: {resp.status}")
            print(f"Content-Type: {content_type}")
            print(f"Size: {len(content)} bytes")
            assert content_type == "application/pdf", f"Expected application/pdf, got {content_type}"
            assert content.startswith(b"%PDF"), "Response does not start with %PDF header!"
            print("PDF GENERATION TEST PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"PDF Test error: {e}")
        raise e

if __name__ == "__main__":
    test_pdf_generation()
