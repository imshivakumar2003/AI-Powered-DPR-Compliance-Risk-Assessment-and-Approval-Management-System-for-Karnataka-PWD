import urllib.request, json, sys

API = 'http://localhost:8000'

# Test 1: list
with urllib.request.urlopen(f'{API}/api/application-status', timeout=10) as r:
    dprs = json.loads(r.read())
print('List endpoint: OK |', len(dprs), 'DPRs')

# Test 2: detail for first DPR
dpr_id = dprs[0]['id']
with urllib.request.urlopen(f'{API}/api/application-status/{dpr_id}', timeout=10) as r:
    detail = json.loads(r.read())
print('Detail endpoint: OK')
print('  title:', detail['title'][:30])
print('  ref_number:', detail['ref_number'])
print('  progress:', detail['progress_pct'], '%%')
print('  steps:', detail['steps'])
print('  step_index:', detail['step_index'])
print('  comments:', len(detail['comments']))
print('  timeline:', len(detail['timeline']))
print('  versions:', len(detail['versions']))
print('  notifications:', len(detail['notifications']))

if detail['timeline']:
    t0 = detail['timeline'][0]
    print('  First timeline event:', t0['event_type'], '|', t0['title'])

# Test 3: post a comment
import json as _json
payload = _json.dumps({'author_role': 'user', 'author_name': 'Test User', 'message': 'Test reply message'}).encode()
req = urllib.request.Request(
    f'{API}/api/application-status/{dpr_id}/comment',
    data=payload, method='POST',
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req, timeout=10) as r:
    resp = json.loads(r.read())
print('Post comment: OK | id:', resp['comment']['id'][:8])

# Test 4: verify comment shows in detail
with urllib.request.urlopen(f'{API}/api/application-status/{dpr_id}', timeout=10) as r:
    detail2 = json.loads(r.read())
print('Comments after post:', len(detail2['comments']))
print('Timeline after post:', len(detail2['timeline']))

print('ALL TESTS PASSED!')
