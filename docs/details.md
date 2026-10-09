# MindBridge: details

## Data sources

- **Support directory** (`src/data/resources.json`): SAMHSA, the 988 Lifeline and providers' official websites. Last reviewed September 2026.
- **California county/ZIP search:** CDPH licensed facility listing, DHCS MHRC/PHF listing, DHCS county mental-health plan contacts, HCAI primary-care clinic reports, and county snapshots (Orange, San Diego, Butte). All are dated public snapshots.
- **LA County live search:** the County's public location feed, through a Cloudflare Worker.
- **County suggestion:** Census ZIP/county relationship files, used locally in the browser.

## Deploy

- **Site:** Cloudflare Pages project `mindbridge`, built from GitHub → https://mindbridge.leixue.dev/
- **LA County Worker:** `npm run worker:deploy` (route `mindbridge.leixue.dev/api/la-county/locations`). Deploy it separately from the site. Its `ALLOWED_ORIGINS` var is set in `workers/la-county-directory/wrangler.jsonc`.
- **Optional:** `VITE_LA_COUNTY_API_URL` points the app at another Worker URL (default `/api/la-county/locations`; `npm run dev` proxies it to the local Worker on port 8787).

## Update the data

| Data | Command |
|---|---|
| Statewide facilities | `python3 scripts/build_california_facilities.py CDPH.csv DHCS.csv COUNTIES.csv` |
| County access phones | `node scripts/build_california_county_access.mjs CENSUS_FILE` |
| County plan websites | `node scripts/build_california_county_sites.mjs` |
| Primary-care clinics | `python scripts/build_california_primary_care.py` |
| Orange County sites | `python3 scripts/build_orange_provider_sites.py OFFICIAL.json` |
| San Diego adult clinics | `node scripts/build_san_diego_adult_clinics.mjs` |

After any update: review the changes, run `npm test && npm run build`, and update the "last reviewed" date in `src/data/meta.ts`.

## Safety

MindBridge is an information directory, not medical advice or emergency care. Keep crisis options (911, 988) clear on every page.
