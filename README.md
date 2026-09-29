# MindBridge

MindBridge is a free directory of U.S. mental-health crisis hotlines and support resources. It helps people find the kind of support they need for themselves or someone they care about.

> **In immediate danger, call 911.** For U.S. crisis support, call or text **988** (Suicide & Crisis Lifeline, 24/7 and free). MindBridge is an information directory—not a substitute for professional care or emergency services.

## What it does

- Browse support resources and filter by keyword, audience, issue, category, and region.
- Share or revisit audience, issue, category, and region filters through the page URL. Keyword searches stay in local page state and are not added to the URL.
- Find local options through the 211 directory pathway, search a limited statewide snapshot of California licensed mental-health facilities by ZIP/city/county, or search the live Los Angeles County DMH Provider Directory by city or ZIP using a small Cloudflare Worker. These listings are not walk-in clinics independently verified by MindBridge; the statewide snapshot does not cover all providers.
- The County feed may return a first page with a continuation marker; MindBridge flags that more results exist and links to the full County directory. In a Pasadena live check, the County continuation repeated the same page, so MindBridge does not offer that unreliable “load more” action.
- Use manual area search only: no GPS, no search term in the page URL, and no MindBridge database or browser-storage persistence. Cloudflare processes the request; LA County may log access information such as IP or browser details. Confirm service, eligibility, appointment requirements, and current availability directly with each provider.
- Open a resource page for its description, hours, region, audience, issues, and links to call, text, or visit the provider's official website.
- Keep crisis options visible, including 988, Crisis Text Line, and The Trevor Project.

## Data and safety

Resource records are maintained in [`src/data/resources.json`](src/data/resources.json). Listings are compiled from public information from SAMHSA, the 988 Suicide & Crisis Lifeline, and providers' official websites. The static directory data was last reviewed in **September 2026**; information and service availability can change, so confirm details with the provider before relying on them.

The single California search form filters the statewide and Orange County snapshots locally and offers an official county Mental Health Plan access phone for each of California's **58 counties**. This is a county referral entry point for Medi-Cal specialty mental-health services, **not** 58 counties of verified provider listings. ZIP hints come from the [2020 Census ZCTA-to-county relationship file](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt), supplemented by unique address observations from CDPH where the Census file has no ZCTA. ZCTAs approximate postal ZIP codes: 170 California-intersecting ZCTAs cross county lines in this source; the UI asks the visitor to choose instead of guessing. For unmapped ZIPs or cities, users can choose any county manually. County phone numbers come from [DHCS County Mental Health Plan Information](https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/), retrieved on the date embedded in `src/data/california-county-access.json`. For ZIPs mapped uniquely to Los Angeles County, or cities that occur only in Los Angeles County within the snapshot, the same submit also fetches live results from the County DMH Provider Directory API. The County's API may log access information, and Cloudflare processes the request. MindBridge does not request GPS or intentionally retain the submitted city/ZIP or include it in the URL. County results are directory records, not MindBridge-verified referrals or guarantees of in-person service, eligibility, or current openings.

The separate statewide lookup uses 133 facilities from two public California Health and Human Services datasets: the [CDPH licensed healthcare facility listing](https://data.chhs.ca.gov/dataset/licensed-healthcare-facility-listing) (September 1, 2026; only open acute psychiatric hospitals and psychology clinics) and the [DHCS licensed MHRC/PHF listing](https://data.chhs.ca.gov/dataset/licensed-mental-health-rehabilitation-centers-mhrc-and-psychiatric-health-facilities-phf) (September 11, 2026; only records licensed with a non-expired listed date). The ZIP/city/county filter runs entirely in the browser. Two DHCS rows missing a county and four rows with conflicting duplicate IDs were excluded; closed/expired listings are excluded. When an exact ZIP has no listed facility, the app can offer collapsed, clearly labeled other county listings **only after a county is selected or unambiguously suggested**; this is not a proximity estimate. For Orange County it also links to the [official Behavioral Health Plan provider directory](https://bhpproviderdirectory.ochca.com/) for broader services. This is a dated, incomplete facility snapshot, not an outpatient-care directory, a list of free services, or real-time proof of a current license. Always confirm directly before visiting; an exact ZIP with zero listings does **not** mean no local support exists.

The [Orange County Behavioral Health Plan provider directory](https://bhpproviderdirectory.ochca.com/machine-readable-data) separately publishes machine-readable site data. MindBridge includes a dated, minimized snapshot of 99 **MHP (specialty mental-health plan)** sites retrieved on September 29, 2026; it excludes DMC/SUD-only sites and individual practitioner rosters. A ZIP with no statewide licensing-subset matches can still show official Orange County Behavioral Health Plan sites from the separate county source. The site snapshot is not live and does not verify availability, pricing, or eligibility. Visitors can open the official directory for current details. These 99 sites, the statewide 133 licensed facilities, and the curated 23 support resources are different datasets and must not be combined into one resource count.

The footer's version is generated at frontend build time from the UTC build minute and the source commit's short SHA. It identifies the frontend artifact, not the separately deployed LA County Worker.

## Tech stack

- React and TypeScript
- Vite and React Router
- Tailwind CSS
- Node.js test runner, Playwright, Oxlint, and Wrangler (Cloudflare Workers)

## Run locally

Install dependencies once:

```bash
npm ci
```

Start the Worker in one terminal:

```bash
npm run worker:dev
```

Start the Vite app in a second terminal:

```bash
npm run dev
```

The local Vite proxy sends `/api/la-county/locations` to the Worker at `127.0.0.1:8787`. The live search will not work if the Worker is not running.

## Deploying the directory Worker

Deployment is separate from pushing the static app. It requires authorization to the Cloudflare account that will host the Worker; do not put credentials in the repository or chat.

1. Verify the Cloudflare account is on the Workers Free tier, authorize Wrangler for script/route changes, then run `npm run worker:deploy`. Do not enable a paid plan.
2. The checked-in route attaches the Worker to `https://mindbridge.leixue.dev/api/la-county/locations`, on the existing `leixue.dev` zone. The production origin is the only allowed browser origin; `npm run worker:dev` overrides it for local Vite testing. The browser-origin check is not authentication, and the Free tier's request cap is not a per-user rate limiter.
3. The static site defaults to this same-origin `/api/la-county/locations` path, so no frontend rebuild or `VITE_LA_COUNTY_API_URL` is required. Verify the live endpoint and browser search after deployment. No API key is used by the County endpoint.

Cloudflare deployment is a separate step from pushing this repository; verify the live route after every deployment.

## Checks

```bash
npx playwright install chromium
npm test
npm run test:ui
npm run lint
npm run build
```

## Updating the statewide facility snapshot

Download the current CSV resources from the two California datasets linked above (CDPH healthcare facility listing and DHCS licensed MHRC/PHF listing), plus the [DHCS county code CSV](https://data.chhs.ca.gov/dataset/licensed-mental-health-rehabilitation-centers-mhrc-and-psychiatric-health-facilities-phf). Review source dates, headers, ambiguous records, and licensing criteria before refreshing. Run:

```bash
python3 scripts/build_california_facilities.py PATH_TO_CDPH.csv PATH_TO_DHCS.csv PATH_TO_COUNTIES.csv
npm test && npm run test:ui && npm run build
```

The script deliberately excludes records without a verified county or with conflicting identifiers. It also writes `src/data/california-zip-counties.json` from ZIP/county pairs in the public CDPH healthcare-facility file, skipping ambiguous pairs. This is incomplete ZIP coverage and must never be treated as a complete county boundary source. When changing source snapshots, update the dates in `CaliforniaFacilitySearch.tsx`, the script's `AS_OF` date, and the disclosure above. Source data is not fetched from visitors' browsers.

Refresh the county access lookup by downloading the [Census relationship file](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt) and running `node scripts/build_california_county_access.mjs PATH_TO_CENSUS_FILE`. The script checks the live DHCS county contact table and refuses to write unless every one of the 58 California counties has a listed phone. Re-run this after updating the CDPH ZIP snapshot; never treat a ZCTA as a postal-address-level county guarantee. No visitor ZIP is sent to Census or DHCS.

For the Orange County site snapshot, download the complete site JSON from the official [machine-readable data page](https://bhpproviderdirectory.ochca.com/machine-readable-data) and run `python3 scripts/build_orange_provider_sites.py PATH_TO_OFFICIAL_JSON`. The script selects only MHP sites, excludes expired records, and removes individual providers before writing `src/data/orange-provider-sites.json`. Run tests and rebuild after refreshing.

## Updating the support directory

Before changing a listing, verify its name, eligibility, hours, phone/text instructions, region, and official URL against the provider's own information. Update `DATA_LAST_REVIEWED` in [`src/data/meta.ts`](src/data/meta.ts) after completing a review. Keep crisis guidance clear and do not present the directory as medical advice or emergency care.
