"""Refresh simplified official Census county boundaries for local-only location hints."""
import json
import urllib.parse
import urllib.request
from pathlib import Path

SOURCE = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1'
params = {'where': "STATE='06'", 'outFields': 'NAME', 'outSR': '4326', 'returnGeometry': 'true', 'maxAllowableOffset': '0.002', 'geometryPrecision': '5', 'f': 'geojson'}
data = json.load(urllib.request.urlopen(SOURCE + '/query?' + urllib.parse.urlencode(params), timeout=60))
features = data.get('features', [])
if len(features) != 58 or len({f['properties']['NAME'] for f in features}) != 58:
    raise ValueError('Expected all 58 unique California counties')
result = {'source': SOURCE, 'simplificationDegrees': 0.002, 'counties': [
    {'name': f['properties']['NAME'].removesuffix(' County'), 'geometry': f['geometry']}
    for f in sorted(features, key=lambda f: f['properties']['NAME'])
]}
Path(__file__).resolve().parents[1].joinpath('src/data/california-county-boundaries.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print('Wrote 58 simplified county boundaries')
