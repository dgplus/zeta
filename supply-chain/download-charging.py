#!/usr/bin/env python3
"""
Downloads all NREL EV charging stations using curl (avoids Python SSL issues on macOS).
Saves charging-stations.js next to index.html.

Usage:
    cd /Users/davidganske/Documents/Claude
    python3 download-charging.py
"""
import subprocess, json, os, sys, datetime

API_KEY = '9sEHgWP4SSmHoLQTLmvpXRgmCftgDsGmeEMdFOLA'
BASE    = 'https://developer.nrel.gov/api/alt-fuel-stations/v1.json'
FIELDS  = 'station_name,city,state,ev_network,ev_level2_evse_num,ev_dc_fast_num,latitude,longitude'
LIMIT   = 500
OUT     = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'charging-stations.js')


def curl_get(url):
    """Fetch a URL with curl and return parsed JSON."""
    result = subprocess.run(
        ['curl', '-s', '--max-time', '30', url],
        capture_output=True
    )
    if result.returncode != 0:
        raise RuntimeError(f'curl failed: {result.stderr.decode()}')
    return json.loads(result.stdout)


def build_url(offset):
    return (
        f'{BASE}?api_key={API_KEY}'
        f'&fuel_type=ELEC&status=E&country=US'
        f'&limit={LIMIT}&offset={offset}&fields={FIELDS}'
    )


# ── Get total count ──────────────────────────────────────────────────────────
print('Fetching total count…')
try:
    first = curl_get(build_url(0))
except Exception as e:
    print(f'\nERROR: Could not reach NREL API.\n{e}')
    print('\nTry opening this URL in your browser to confirm the key works:')
    print(f'  {build_url(0)}&limit=1'.replace(f'&offset=0', ''))
    sys.exit(1)

total   = first['total_results']
batches = (total + LIMIT - 1) // LIMIT
print(f'  {total:,} stations  ({batches} batches of {LIMIT})')

# ── Fetch all batches ────────────────────────────────────────────────────────
stations = first['alt_fuel_stations']
errors   = 0

for i in range(1, batches):
    offset = i * LIMIT
    pct    = int(100 * i / batches)
    print(f'  [{pct:3d}%]  batch {i+1}/{batches}  ({len(stations):,} so far)   ', end='\r', flush=True)
    try:
        data = curl_get(build_url(offset))
        stations.extend(data['alt_fuel_stations'])
    except Exception as e:
        errors += 1
        print(f'\n  Warning: batch {i} failed ({e}), skipping.')
        if errors > 5:
            print('Too many errors — aborting.')
            sys.exit(1)

print(f'\nDownloaded {len(stations):,} stations  ({errors} errors)')

# ── Strip to minimal fields ──────────────────────────────────────────────────
slim = []
for s in stations:
    lat = s.get('latitude')
    lng = s.get('longitude')
    if lat is None or lng is None:
        continue
    slim.append({
        'n':   s.get('station_name', ''),
        'c':   s.get('city', ''),
        's':   s.get('state', ''),
        'nw':  s.get('ev_network', '') or '',
        'l2':  s.get('ev_level2_evse_num') or 0,
        'dc':  s.get('ev_dc_fast_num') or 0,
        'lat': lat,
        'lng': lng,
    })

print(f'Stations with coordinates: {len(slim):,}')

# ── Write JS file ────────────────────────────────────────────────────────────
today   = datetime.date.today()
payload = json.dumps(slim, separators=(',', ':'))
js = (
    f'// NREL EV Charging Stations — downloaded {today}\n'
    f'// {len(slim):,} stations\n'
    f'var CHARGING_DATA={payload};\n'
)

with open(OUT, 'w') as f:
    f.write(js)

size_mb = os.path.getsize(OUT) / 1024 / 1024
print(f'Saved → charging-stations.js  ({size_mb:.1f} MB)')
print('Done! Reload index.html — charging stations will load instantly.')
