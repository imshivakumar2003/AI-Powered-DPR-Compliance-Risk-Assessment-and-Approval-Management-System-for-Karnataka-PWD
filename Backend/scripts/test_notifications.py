import urllib.request, json

API = 'http://localhost:8000'

def test_notifications():
    # 1. Fetch global notifications
    req = urllib.request.Request(f"{API}/api/notifications?role=viewer")
    with urllib.request.urlopen(req) as r:
        notifs = json.loads(r.read())
        print(f"[1/3] GET /api/notifications returned {len(notifs)} notification(s)")

    # 2. Mark single read (if exists)
    if notifs:
        target_id = notifs[0]['id']
        req_single = urllib.request.Request(f"{API}/api/notifications/{target_id}/read", method="POST")
        with urllib.request.urlopen(req_single) as r:
            res = json.loads(r.read())
            print(f"[2/3] POST /api/notifications/{target_id}/read -> {res}")

    # 3. Mark all read
    req_all = urllib.request.Request(f"{API}/api/notifications/read-all?role=viewer", method="POST")
    with urllib.request.urlopen(req_all) as r:
        res = json.loads(r.read())
        print(f"[3/3] POST /api/notifications/read-all -> {res}")

    print("ALL NOTIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_notifications()
