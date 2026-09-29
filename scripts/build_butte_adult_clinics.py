"""Refresh only the four county-published adult outpatient centers; fail closed."""
import datetime
import html
import json
import re
import urllib.request
from pathlib import Path

BASE = 'https://www.buttecounty.net/'
PAGES = [
    ('Chico', 'Chico Adult Services', '1593/Adult-Mental-Health-Services-in-Chico'),
    ('Gridley', 'Gridley Family Services', '165/Gridley'),
    ('Oroville', 'Oroville Adult Services', '166/Oroville'),
    ('Paradise', 'Paradise Adult Services', '167/Paradise'),
]


def extract(page, city, name, url):
    page = re.sub(r'<(script|style)\b.*?</\1>', '', page, flags=re.S)
    text = re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', page)))
    start = text.index('Outpatient Center')
    text = text[start:]
    if 'Ages 18 and over' not in text[:250]:
        raise ValueError(f'Adult outpatient scope changed: {city}')
    pattern = re.escape(name) + r' (\d[^<>]+?) ' + re.escape(city) + r', CA (\d{5}) (.{0,180})'
    matches = list(re.finditer(pattern, text))
    if len(matches) != 1:
        raise ValueError(f'Expected one outpatient address: {city}')
    match = matches[0]
    remainder = match[3]
    if city == 'Paradise':
        remainder = remainder.split('Adult Services (Ages 18 and over) Phone: ', 1)[1]
    phone = re.search(r'\b(\d{3})[.-](\d{3})[.-](\d{4})\b', remainder)
    if not phone:
        raise ValueError(f'Missing outpatient phone: {city}')
    return dict(id=f'butte-adult-{city.lower()}', name=name, city=city,
                address=match[1], zip=match[2], phone='-'.join(phone.groups()), source=url)


def main():
    clinics = []
    for city, name, path in PAGES:
        url = BASE + path
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            if not response.url.startswith(BASE):
                raise ValueError('Unexpected source host')
            page = response.read().decode('utf-8')
        clinics.append(extract(page, city, name, url))
    target = Path(__file__).resolve().parents[1] / 'src/data/butte-adult-clinics.json'
    snapshot = dict(retrievedAt=datetime.datetime.now(datetime.UTC).date().isoformat(),
                    source=BASE + '369/Find-Adult-Services-by-Location',
                    directoryUrl=BASE + '2300/Find-a-Provider', clinics=clinics)
    target.write_text(json.dumps(snapshot, indent=2) + '\n')
    print(f'Wrote {len(clinics)} adult outpatient centers')


if __name__ == '__main__':
    main()
