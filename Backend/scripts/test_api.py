import urllib.request, json

# Test 1: Get all projects
with urllib.request.urlopen('http://localhost:8000/api/projects') as r:
    projects = json.loads(r.read())
    print(f'Projects: {len(projects)}')

if not projects:
    print("No projects found.")
    exit(0)

pid = projects[0]['id']
p_status = projects[0]['status']
print(f'Testing project: {pid[:8]}... status={p_status}')

# Test 2: Get compliance
with urllib.request.urlopen(f'http://localhost:8000/api/dpr/{pid}/compliance') as r:
    comp = json.loads(r.read())
print(f'Compliance score: {comp["overall_compliance_score"]}%')
for c in comp['checks'][:3]:
    reason = str(c.get('reason',''))[:60]
    print(f'  [{c["status"]}] {c["label"][:35]} | reason: {reason}')

# Test 3: Get risk
with urllib.request.urlopen(f'http://localhost:8000/api/dpr/{pid}/risk') as r:
    risk = json.loads(r.read())
print(f'Risk score: {risk["risk_score"]} ({risk["risk_category"]})')
for f in risk['top_risk_factors']:
    print(f'  - {f[:80]}')

# Test 4: Get info (reviewer fields)
with urllib.request.urlopen(f'http://localhost:8000/api/dpr/{pid}/info') as r:
    info = json.loads(r.read())
rv = info.get('reviewed_by')
ra = info.get('reviewed_at')
print(f'Info: reviewed_by={rv}, reviewed_at={ra[:10] if ra else None}')

# Test 5: Download report
req = urllib.request.Request(f'http://localhost:8000/api/dpr/{pid}/report/download')
with urllib.request.urlopen(req) as r:
    report_text = r.read().decode('utf-8', errors='replace')
print(f'Report length: {len(report_text)} chars')
print('Report preview (first 300 chars):')
print(report_text[:300])
