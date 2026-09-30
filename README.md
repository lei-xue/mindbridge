# MindBridge

MindBridge is a free directory of U.S. mental-health crisis hotlines and support resources. It helps people find the kind of support they need for themselves or someone they care about.

> **In immediate danger, call 911.** For U.S. crisis support, call or text **988** (Suicide & Crisis Lifeline, 24/7 and free). MindBridge is an information directory—not a substitute for professional care or emergency services.

## What it does

- Browse support resources and filter by keyword, audience, issue, category, and region.
- Share or revisit audience, issue, category, and region filters through the page URL. Keyword searches stay in local page state and are not added to the URL.
- Find local options through a single California form: filter a limited statewide licensed-facility snapshot and Orange County provider-site snapshot, see a limited San Diego County adult-clinic list, find the official Mental Health Plan access contact in any California county, and search the live LA County DMH Provider Directory by city or ZIP using a Cloudflare Worker when applicable. County contacts are referral entry points, not local clinic listings; the location datasets are incomplete and not a list of free or walk-in services.
- The County feed may return a first page with a continuation marker; MindBridge flags that more results exist and links to the full County directory. In a Pasadena live check, the County continuation repeated the same page, so MindBridge does not offer that unreliable “load more” action.
- Choose a county manually or click optional device location to suggest one using local Census boundaries. No coordinates are sent to MindBridge or saved; the browser location provider has its own practices. Search terms stay out of the URL and browser storage. Cloudflare processes explicit LA searches; LA County may log access details. Confirm eligibility, cost, hours, and appointments directly.
- Open a resource page for its description, hours, region, audience, issues, and links to call, text, or visit the provider's official website.
- Keep crisis options visible, including 988, Crisis Text Line, and The Trevor Project.

## Data and safety

Provider cards prioritize the name, public map address, and phone. Provider classifications, snapshot dates, attribution, and fuller limitations are available in closed, keyboard-operable details. For exact city/ZIP matches, the supplemental county referral is collapsed; county-only and no-match searches keep its access phone visible. A short cost/eligibility/availability reminder remains visible, as do adult-only labels and pre-submission LA transfer disclosures.

Resource records are maintained in [`src/data/resources.json`](src/data/resources.json). Listings are compiled from public information from SAMHSA, the 988 Suicide & Crisis Lifeline, and providers' official websites. The static directory data was last reviewed in **September 2026**; information and service availability can change, so confirm details with the provider before relying on them.

The single California search form starts with a **county dropdown** rather than requiring a ZIP: choose one of California's 58 counties to see its official Mental Health Plan access phone. Orange County sites and San Diego adult clinics only render after a visitor chooses a city (or explicitly asks to show all); county-level licensed-facility rows stay collapsed. City and ZIP search use visible segmented mode buttons; optional device location remains available in all three modes. This is a county referral entry point for Medi-Cal specialty mental-health services, **not** 58 counties of verified provider listings. ZIP hints come from the [2020 Census ZCTA-to-county relationship file](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt), supplemented by unique address observations from CDPH where the Census file has no ZCTA. ZCTAs approximate postal ZIP codes: 170 California-intersecting ZCTAs cross county lines in this source; the UI asks the visitor to choose instead of guessing. For unmapped ZIPs or cities, users can choose any county manually. County phone numbers come from [DHCS County Mental Health Plan Information](https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/), retrieved on the date embedded in `src/data/california-county-access.json`. For ZIPs mapped uniquely to Los Angeles County, submitting the form also fetches live results from the County DMH Provider Directory API. City-to-county hints based on the partial facility snapshots are not reliable enough to trigger an automatic network request: for cities and uncertain ZIPs, a visitor must choose LA County and click the separate live-search button. If the suggested county is wrong, the visitor can change it; this changes the county contact and filters locally listed facilities to the chosen county, but does not create provider data for that county. The County's API may log access information, and Cloudflare processes the request. MindBridge only requests device location after a visitor explicitly clicks; it does not intentionally retain the submitted city/ZIP or include it in the URL. County results are directory records, not MindBridge-verified referrals or guarantees of in-person service, eligibility, or current openings.

As of September 29, 2026, the approximate crosswalk has **1,819** California-intersecting ZIP/ZCTA keys. Only **150** distinct ZIPs have at least one direct site/facility record in the three dated location snapshots (state licensing, Orange County BHP sites, San Diego adult clinics); **1,669** mapped ZIPs have no direct snapshot record. This is not a measured share of all USPS California ZIPs, nor a count of LA County live results. For a mapped ZIP with no exact listing, the UI offers the county's official access line; Orange and San Diego can additionally expand county-wide site lists that are explicitly **not** proximity matches, with links to their full official directories. Ambiguous ZIPs require county selection; ZIPs absent from the approximation require users to confirm their California county manually. Neither path guarantees a local appointment or free service.

The separate statewide lookup uses 133 facilities from two public California Health and Human Services datasets: the [CDPH licensed healthcare facility listing](https://data.chhs.ca.gov/dataset/licensed-healthcare-facility-listing) (September 1, 2026; only open acute psychiatric hospitals and psychology clinics) and the [DHCS licensed MHRC/PHF listing](https://data.chhs.ca.gov/dataset/licensed-mental-health-rehabilitation-centers-mhrc-and-psychiatric-health-facilities-phf) (September 11, 2026; only records licensed with a non-expired listed date). The ZIP/city/county filter runs entirely in the browser. Two DHCS rows missing a county and four rows with conflicting duplicate IDs were excluded; closed/expired listings are excluded. When an exact ZIP has no listed facility, the app can offer collapsed, clearly labeled other county listings **only after a county is selected or unambiguously suggested**; this is not a proximity estimate. For Orange County it also links to the [official Behavioral Health Plan provider directory](https://bhpproviderdirectory.ochca.com/) for broader services. This is a dated, incomplete facility snapshot, not an outpatient-care directory, a list of free services, or real-time proof of a current license. Always confirm directly before visiting; an exact ZIP with zero listings does **not** mean no local support exists.

DHCS's [county mental health plan contact table](https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/) links to many county-plan websites. A separate snapshot, `src/data/california-county-sites.json`, includes **20** plan landing pages that returned HTTPS success on September 29, 2026; many DHCS links were HTTP-only, missing, unavailable, or stale, and were omitted. These are county-plan sites, **not** 20 complete provider directories. All 58 verified county phone contacts remain available even when no website link is shown. Website availability can change; call the plan if a link later breaks. The [Medi-Cal Managed Care Provider Listing](https://data.chhs.ca.gov/dataset/medi-cal-mc-provider-listing) is a different network from county specialty mental-health plans: its behavioral-health indicator includes many individual-provider and unrelated specialty rows and does not supply complete county MHP site coverage, so it was not imported as a substitute.

The [Orange County Behavioral Health Plan provider directory](https://bhpproviderdirectory.ochca.com/machine-readable-data) separately publishes machine-readable site data. MindBridge includes a dated, minimized snapshot of 99 **MHP (specialty mental-health plan)** sites retrieved on September 29, 2026; it excludes DMC/SUD-only sites and individual practitioner rosters. A ZIP with no statewide licensing-subset matches can still show official Orange County Behavioral Health Plan sites from the separate county source. For Orange County ZIPs without an exact site match, the UI offers a collapsed county-wide list of **98 physically Orange County sites** (one Orange BHP network site is physically in LA County and excluded from this fallback). Visitors can filter by a city they recognize; the preview is limited to 10 cards, with a link to the full directory. These are not nearby matches. The site snapshot is not live and does not verify availability, pricing, or eligibility. Visitors can open the official directory for current details. These 99 sites, the statewide 133 licensed facilities, and the curated 23 support resources are different datasets and must not be combined into one resource count.

[San Diego County BHS's adult outpatient clinic page](https://www.sandiegocounty.gov/content/sdc/bhs/Outpatient_behavioral_health_centers.html) publishes clinic names, street addresses, and phones by region. MindBridge includes a minimized snapshot of **20 physical clinic locations serving adults 18 and older**, retrieved September 29, 2026. The source also lists a contact-only program with no public street address, which was excluded rather than treated as a nearby clinic. San Diego ZIPs without an exact clinic match can expand a county-wide list and filter by a city they recognize (up to 10 preview cards, sorted by city—not distance or suitability). This is not the full county Behavioral Health Plan provider directory, youth service list, or confirmation of current walk-in hours, price, eligibility or availability. The County links to a separate [full behavioral health provider directory](https://www.optumsandiego.com/content/SanDiego/sandiego/en/community-resources/providerdirectory1.html) for broader/current searches. Do not combine the San Diego adult clinics, Orange County sites, statewide licensing snapshot, and curated support directory counts.

The footer's version is generated at frontend build time from the UTC build minute and the source commit's short SHA. It identifies the frontend artifact, not the separately deployed LA County Worker.

## Butte County adult outpatient subset

County selection now also offers **four** county-published adult outpatient centers in Chico, Gridley, Oroville, and Paradise. This is an ages-18-and-over subset, not Butte's complete provider directory. The four cards appear immediately after a county search; city filtering remains available. each card links to its official source and the section links to the full directory. `python3 scripts/build_butte_adult_clinics.py` refreshes from the county's adult-service pages and fails if their outpatient scope, address, or phone cannot be recognized. SEARCH teams, administrative offices, youth-only contacts, CalWORKs offices, and peer/drop-in programs are excluded. Paradise's adult number is distinct from its youth number. Published walk-in information is not imported as a guarantee. The coverage counts above describe the three earlier snapshots and do not include this new subset.

## Optional local county suggestion

`Use current location` requests browser permission only on click, then locally matches simplified [US Census TIGERweb county boundaries](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1). The boundary module is lazy-loaded, so ordinary browsing does not download it. `python3 scripts/build_county_boundaries.py` refreshes all 58 counties, failing if coverage changes. With poor accuracy, outside California, or within accuracy + 400 metres of a simplified edge, the app falls back to manual selection. A hint fills the county field and immediately displays local county contacts and available snapshot records (a bounded first-20 preview for Orange). Visitors can correct the county manually; no live API is automatically called. Coordinates are not saved or sent to MindBridge; the browser's own location provider may process location under its policies. Denial, timeout, unsupported browsers, and stale callbacks do not block manual search. This is not a distance or suitability ranking.

The home directory omits the three already-visible crisis cards by default, with an explicit include action; filtering and `Browse all resources` still expose them. County results share a single cost/eligibility/appointment reminder while keeping source-specific scope and dates.

## Static delivery and safety checks

`npm run build` prerenders Home, About, and every support-resource detail page into HTML using the same React components. The directory and call/text links are readable before JavaScript and remain usable if scripts fail. Interactive search controls stay hidden until the app mounts; no-JS users can still browse static detail pages. Critical inline styles preserve first-screen, 44px call/text 988 targets even if the external stylesheet fails. Cloudflare route rewrites and the local production preview serve the same static documents; `sitemap.xml` and `robots.txt` are generated from the real resource IDs. No runtime server or paid infrastructure is added.

Run `npm run build && npm run test:safety` to check the production artifact, including no-JS/script/CSS failure cases, crawlable metadata, source-check honesty, and automated axe WCAG A/AA scans. Passing automated scans is not a full WCAG conformance claim; screen-reader/manual and real weak-network timing tests are separate.

Individual source checks are recorded in `src/data/resource-checks.json` only after checking official information. Dates mean web-source checks, not test calls or live availability. Listings without an individual date remain explicitly unverified at that level; never copy the directory-wide review date into each record. Correction links use the public project email, warn against sending health information, and are not a crisis-response channel. English and Spanish interfaces are available through the header language switch. Spanish routes start at `/es`, with localized Home, About, resource descriptions, filters, California searches, error states, and metadata. The switch preserves the current page and shareable filters without cookies or stored language preferences. The official Spanish 988 link remains available; a Spanish interface does not establish that any listed provider offers services in Spanish. Official provider names, addresses, telephone numbers, links, and raw source classifications remain unchanged. Production hosting injects Cloudflare Web Analytics even though it is absent from the repository and some non-browser HTTP responses; About discloses its cookie-free page-view/performance statistics. Network safety tests allow only the site origin and the specifically identified Cloudflare beacon origin, while still requiring an empty cookie jar.

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

Refresh the optional county-plan landing-page snapshot with `node scripts/build_california_county_sites.mjs`. It reads the live DHCS contact table, follows only HTTPS links, checks the final destination with an HTTP HEAD request, strips analytics parameters, and omits inaccessible pages. It refuses to overwrite the snapshot if fewer than 15 unique county links are reachable. HEAD blocking can cause a working county website to be omitted; this is deliberately conservative. Review changes and test the outbound links before publishing. This snapshot is independent from the 58 phone contacts and does not provide provider-site listings.

For the Orange County site snapshot, download the complete site JSON from the official [machine-readable data page](https://bhpproviderdirectory.ochca.com/machine-readable-data) and run `python3 scripts/build_orange_provider_sites.py PATH_TO_OFFICIAL_JSON`. The script selects only MHP sites, excludes expired records, and removes individual providers before writing `src/data/orange-provider-sites.json`. Run tests and rebuild after refreshing.

For the San Diego County adult-clinic snapshot, run `node scripts/build_san_diego_adult_clinics.mjs`. It extracts names, physical addresses and listed phones from the six adult-clinic tables on the County BHS page. It deliberately excludes the contact-only row, requires the expected source structure, and fails closed on an unrecognized address rather than fabricating a location. Compare the output against the source, run browser tests and rebuild before publishing; do not represent this adult subset as the full county plan directory.

## Updating the support directory

Before changing a listing, verify its name, eligibility, hours, phone/text instructions, region, and official URL against the provider's own information. Update `DATA_LAST_REVIEWED` in [`src/data/meta.ts`](src/data/meta.ts) after completing a review. Keep crisis guidance clear and do not present the directory as medical advice or emergency care.
