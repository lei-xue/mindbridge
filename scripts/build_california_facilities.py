#!/usr/bin/env python3
"""Build a reviewable statewide snapshot from official California CSV downloads.

Usage: python3 scripts/build_california_facilities.py HEALTHCARE.csv DHCS.csv COUNTIES.csv
The output intentionally covers only named licensed facility categories, not all
mental-health services or walk-in clinics. Inputs come from the URLs in README.
"""
import csv
from collections import Counter
from datetime import date, datetime
import json
from pathlib import Path
import re
import sys

AS_OF = date(2026, 9, 29)
OUTPUT = Path(__file__).resolve().parent.parent / "src/data/california-facilities.json"


def rows(path):
    with open(path, encoding="utf-8-sig", newline="") as stream:
        yield from csv.DictReader(stream)


def zip5(value):
    match = re.fullmatch(r"(\d{5})(?:-\d{4})?", value.strip())
    return match.group(1) if match else ""


def cleaned(value):
    return " ".join((value or "").split())


def main(paths):
    if len(paths) != 3:
        raise SystemExit(__doc__)
    healthcare, licensed, counties = paths
    county_names = {int(item["COUNTY CODE"]): item["COUNTY"].strip().title() for item in rows(counties)}
    facilities = []

    for row in rows(healthcare):
        category = row["LICENSE_CATEGORY_DESC"].strip()
        if row["FACILITY_STATUS_DESC"].strip() != "Open" or category not in (
            "Acute Psychiatric Hospital", "Psychology Clinic"
        ):
            continue
        zipcode = zip5(row["DBA_ZIP_CODE"])
        if not zipcode or not cleaned(row["FACILITY_NAME"]) or not cleaned(row["DBA_CITY"]):
            continue
        facilities.append({
            "id": "cdph-" + row["OSHPD_ID"].strip(),
            "name": cleaned(row["FACILITY_NAME"]),
            "category": category,
            "address": cleaned(row["DBA_ADDRESS1"]),
            "city": cleaned(row["DBA_CITY"]).title(),
            "county": cleaned(row["COUNTY_NAME"]).title(),
            "zip": zipcode,
            "phone": "",
            "source": "CDPH",
        })

    dhcs_rows = list(rows(licensed))
    record_counts = Counter(re.sub(r"\s+", "", row["Record ID"]) for row in dhcs_rows)
    for row in dhcs_rows:
        record_id = re.sub(r"\s+", "", row["Record ID"])
        if not record_id or record_counts[record_id] != 1:
            continue  # Conflicting source IDs cannot be safely attributed.
        if row["Type of Application"].strip() != "Licensed" or row["Physical State"].strip() != "CA":
            continue
        expiry = datetime.strptime(row["Expiration Date"].strip(), "%m/%d/%Y").date()
        if expiry < AS_OF:
            continue
        zipcode = zip5(row["Physical Zip"])
        if not zipcode or not cleaned(row["Facility Name"]) or not cleaned(row["Physical City"]):
            continue
        kind = row["Service Type"].strip()
        if kind not in ("MHRC", "PHF"):
            continue
        county_code = row["County Code"].strip()
        if not county_code.isdecimal() or int(county_code) not in county_names:
            continue  # Source lacks one verified county; never infer one from a ZIP.
        facilities.append({
            "id": "dhcs-" + record_id,
            "name": cleaned(row["Facility Name"]),
            "category": {"MHRC": "Mental Health Rehabilitation Center", "PHF": "Psychiatric Health Facility"}[kind],
            "address": cleaned(row["Physical Address"]),
            "city": cleaned(row["Physical City"]).title(),
            "county": county_names[int(county_code)],
            "zip": zipcode,
            "phone": cleaned(row["Facility Phone"]),
            "source": "DHCS",
        })

    facilities.sort(key=lambda item: (item["county"], item["city"], item["name"], item["id"]))
    if len(facilities) < 100 or len({item["id"] for item in facilities}) != len(facilities):
        raise ValueError(f"Unexpected source size or duplicate IDs: {len(facilities)} rows, {len({item['id'] for item in facilities})} IDs; review CSVs")
    OUTPUT.write_text(json.dumps(facilities, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(facilities)} official facility records to {OUTPUT}")


if __name__ == "__main__":
    main(sys.argv[1:])
