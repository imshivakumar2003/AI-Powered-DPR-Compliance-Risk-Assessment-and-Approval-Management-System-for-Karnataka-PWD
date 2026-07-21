import urllib.request, json

with urllib.request.urlopen('http://localhost:8000/api/dashboard/stats') as r:
    d = json.loads(r.read())

notifs = d.get('notifications', [])
print('Notifications count:', len(notifs))
for n in notifs:
    ntype = n.get('type', '?')
    msg = n.get('message', '')[:60]
    print('  type=' + ntype + ' msg=' + msg)

activities = d.get('activities', [])
print('Activities count:', len(activities))
for a in activities[:3]:
    atype = a.get('type', '?')
    msg = a.get('message', '')[:50]
    at = a.get('at', '')[:16]
    print('  type=' + atype + ' | ' + msg + ' | ' + at)

print('DONE')
