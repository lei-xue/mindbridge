#!/usr/bin/env python3
"""Import public clinic metadata only; requires openpyxl==3.1.5 in a venv.

Source: HCAI preliminary 2025 primary-care annual utilization workbook.
Do not export patient counts, staff names, or report preparer information.
"""
import argparse
import hashlib
import io
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path


import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://data.chhs.ca.gov/dataset/primary-care-clinic-annual-utilization-data"
DOWNLOAD = "https://data.chhs.ca.gov/dataset/445db6df-3987-4145-af34-0d7cc3c0e5eb/resource/96244225-eb39-4c21-a7e8-18cdd70b5b33/download/pcc25_util_data_prelim.xlsx"
REQUIRED = {
    "FAC_NO", "FAC_NAME", "FAC_STR_ADDR", "FAC_CITY", "FAC_ZIP", "FAC_PHONE",
    "COUNTY", "FAC_OPERATED_THIS_YR", "LICENSE_STATUS", "HEALTH_SERV_MENTAL_HEALTH",
}


def extract(content, counties):
    book = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    # Never read the NonResp sheet as evidence of reported services.
    rows = iter(book["Page 1-8"].values)
    header = next(rows)
    if not REQUIRED.issubset(header):
        raise ValueError(f"Missing expected source columns: {sorted(REQUIRED - set(header))}")
    tips = " ".join(str(value) for row in book["Tips"].values for value in row if value)
    if "May 4, 2026" not in tips or "2025" not in tips:
        raise ValueError("Workbook extract date/report year changed; review before importing")
    clinics = []
    seen = set()
    reviewed = 0
    for values in rows:
        row = dict(zip(header, values))
        facility_id = str(row.get("FAC_NO", ""))
        if not re.fullmatch(r"306\d{6}", facility_id):
            continue  # Workbook's report-layout header rows, not clinics.
        reviewed += 1
        if (row["HEALTH_SERV_MENTAL_HEALTH"] != "X"
                or row["FAC_OPERATED_THIS_YR"] != "Yes"
                or row["LICENSE_STATUS"] != "Open"):
            continue
        if facility_id in seen:
            raise ValueError(f"Duplicate eligible facility ID {facility_id}; review partial-year reports")
        seen.add(facility_id)
        fields = {key: str(row[column] or "").strip() for key, column in {
            "name": "FAC_NAME", "address": "FAC_STR_ADDR", "city": "FAC_CITY",
            "zip": "FAC_ZIP", "phone": "FAC_PHONE", "county": "COUNTY",
        }.items()}
        if any(not value for value in fields.values()):
            raise ValueError(f"Missing public clinic metadata for {facility_id}")
        if not re.fullmatch(r"\d{5}(?:-\d{4})?", fields["zip"]) or fields["county"] not in counties:
            raise ValueError(f"Invalid geographic metadata for {facility_id}")
        clinics.append({"id": facility_id, **fields})
    book.close()
    if not clinics or reviewed < 1000:
        raise ValueError("Incomplete or empty workbook; preserve the existing snapshot")
    clinics.sort(key=lambda clinic: (clinic["county"], clinic["name"], clinic["id"]))
    return clinics, reviewed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbook", type=Path, help="Optional locally downloaded official workbook")
    parser.add_argument("--output", type=Path, default=ROOT / "src/data/california-primary-care.json")
    args = parser.parse_args()
    if args.workbook:
        content = args.workbook.read_bytes()
    else:
        # The catalog's redirected public asset returns 403 to urllib here;
        # use the same ordinary curl download verified during source review.
        content = subprocess.run(["curl", "--fail", "--silent", "--show-error", "--location", "--max-time", "60", DOWNLOAD], check=True, capture_output=True).stdout
    counties = {plan["name"] for plan in json.loads((ROOT / "src/data/california-county-access.json").read_text())["countyPlans"]}
    clinics, reviewed = extract(content, counties)
    result = {
        "source": SOURCE,
        "download": DOWNLOAD,
        "sourceLabel": "HCAI · 2025",
        "reportYear": 2025,
        "sourceExtractedAt": "2026-05-04",
        "retrievedAt": datetime.now(timezone.utc).date().isoformat(),
        "sha256": hashlib.sha256(content).hexdigest(),
        "scope": "Primary care clinics reporting mental health services in 2025; open and operating in the source report. Not a current-availability or free-care directory.",
        "selection": {"sheet": "Page 1-8", "HEALTH_SERV_MENTAL_HEALTH": "X", "FAC_OPERATED_THIS_YR": "Yes", "LICENSE_STATUS": "Open"},
        "reviewedReportRows": reviewed,
        "clinicCount": len(clinics),
        "countyCount": len({clinic["county"] for clinic in clinics}),
        "clinics": clinics,
    }
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({key: result[key] for key in ("clinicCount", "countyCount", "sourceExtractedAt", "retrievedAt", "sha256")}, indent=2))


if __name__ == "__main__":
    main()
