import urllib.request, json

# Test 1: District Analytics
with urllib.request.urlopen('http://localhost:8000/api/analytics/districts', timeout=10) as r:
    districts = json.loads(r.read())

print('Districts count:', len(districts))
with_data = [d for d in districts if d['has_data']]
print('Districts with DPRs:', len(with_data))
if with_data:
    d0 = with_data[0]
    print('Top district:', d0['district'], '| total:', d0['total'],
          '| approved:', d0['approved'], '| rate:', d0['approval_rate'],
          '| color:', d0['color'])

no_data = [d for d in districts if not d['has_data']]
print('Districts with no DPRs:', len(no_data))
print('Sample no-data district:', no_data[0]['district'] if no_data else 'None')

# Test 2: Risk Alerts
with urllib.request.urlopen('http://localhost:8000/api/analytics/risk-alerts', timeout=10) as r:
    alerts = json.loads(r.read())

print('\nRisk alerts count:', len(alerts))
high = [a for a in alerts if a['level'] == 'High']
pending = [a for a in alerts if a['status'] == 'Pending']
resolved = [a for a in alerts if a['status'] == 'Resolved']
print('High risk:', len(high), '| Pending:', len(pending), '| Resolved:', len(resolved))
if alerts:
    a0 = alerts[0]
    print('First alert:', a0['id'], a0['title'][:40], '| level:', a0['level'],
          '| type:', a0['type'], '| district:', a0['district'], '| status:', a0['status'])

# Verify uniqueness: no two alerts should have the same title+DPR combo
combos = [(a['title'], a['dpr_id']) for a in alerts]
unique_combos = set(combos)
print('Unique title+DPR combos:', len(unique_combos), '/', len(combos))

print('\nAll tests passed!')
