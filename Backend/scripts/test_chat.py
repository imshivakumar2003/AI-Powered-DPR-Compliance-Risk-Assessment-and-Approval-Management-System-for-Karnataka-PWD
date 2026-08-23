import urllib.request, json

API = 'http://localhost:8000'

payload = json.dumps({
    "message": "What are the mandatory environmental clearances for road DPRs in Karnataka?",
    "history": [],
    "api_key": ""
}).encode('utf-8')

req = urllib.request.Request(
    f"{API}/api/chat",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=10) as r:
        resp = json.loads(r.read())
        print("Chat Endpoint Response:")
        print(" Model:", resp.get("model"))
        print(" Is Fallback:", resp.get("is_fallback"))
        print(" Reply:\n", resp.get("reply")[:200], "...")
        print("CHAT TEST PASSED!")
except Exception as e:
    print("CHAT TEST FAILED:", e)
