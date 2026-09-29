#!/usr/bin/env python3
"""Build a minimized Orange County MHP site snapshot from its public provider API.

Usage: python3 scripts/build_orange_provider_sites.py PATH_TO_OFFICIAL_JSON
Source: https://bhpproviderdirectory.ochca.com/machine-readable-data
Only Behavioral Health Plan MHP sites are included, not DMC/SUD-only sites.
Never copy the source's individual provider roster into the browser bundle.
"""
from datetime import date, datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys

OUTPUT = Path(__file__).resolve().parent.parent / "src/data/orange-provider-sites.json"


def main(paths):
    if len(paths) != 1:
        raise SystemExit(__doc__)
    source = json.loads(Path(paths[0]).read_text(encoding="utf-8"))
    if not isinstance(source, list):
        raise ValueError("Expected the official site's JSON array")
    as_of = datetime.now(timezone.utc)
    sites = []
    for entry in source:
        if entry.get("plan_type") != "MHP" or entry.get("state") != "CA":
            continue
        zip_match = re.fullmatch(r"(\d{5})(?:-\d{4})?", str(entry.get("zip_code") or "").strip())
        if not zip_match:
            continue
        name = " ".join(str(entry.get("name") or "").split())
        city = " ".join(str(entry.get("city") or "").split()).title()
        address = " ".join(str(entry.get("address_line_1") or "").split())
        if not name or not city or not address:
            continue
        expiry = entry.get("medical_certificate_expiration_date")
        if expiry and date.fromisoformat(expiry[:10]) < as_of.date():
            continue
        stable_key = f"{entry.get('entity')}|{name}|{address}|{zip_match.group(1)}"
        sites.append({
            "id": "oc-" + hashlib.sha256(stable_key.encode()).hexdigest()[:16],
            "name": name,
            "category": " ".join(str(entry.get("taxonomyDescription") or "Mental health provider site").split()),
            "address": address,
            "city": city,
            "zip": zip_match.group(1),
            "phone": " ".join(str(entry.get("phone") or "").split()),
        })
    sites.sort(key=lambda site: (site["zip"], site["name"], site["id"]))
    if len(sites) < 50 or len({site["id"] for site in sites}) != len(sites):
        raise ValueError("Unexpected source size or duplicate site IDs; inspect official feed")
    OUTPUT.write_text(json.dumps({"retrievedAt": as_of.date().isoformat(), "sites": sites}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(sites)} Orange County MHP sites; no individual provider roster copied")


if __name__ == "__main__":
    main(sys.argv[1:])
