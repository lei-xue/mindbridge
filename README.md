# MindBridge

MindBridge is a free directory of U.S. mental-health crisis hotlines and support resources. It helps people find the kind of support they need for themselves or someone they care about.

**Live:** [English](https://mindbridge.leixue.dev/) · [Español](https://mindbridge.leixue.dev/es)

**Repository:** [lei-xue/mindbridge](https://github.com/lei-xue/mindbridge) · [Acceptance record](docs/acceptance.md)

> **In immediate danger, call 911.** For U.S. crisis support, call or text **988** (Suicide & Crisis Lifeline, 24/7 and free). MindBridge is an information directory—not a substitute for professional care or emergency services.

## What it does

- Browse support resources and filter by keyword, audience, issue, category, and region.
- Share or revisit audience, issue, category, and region filters through the page URL. Keyword searches stay in local page state and are not added to the URL.
- Find California options through **County or ZIP** search: dated state licensing records, HCAI primary-care mental-health reports, connected county outpatient-site snapshots, and official Mental Health Plan access contacts for all 58 counties. Eligible ZIP searches can also query the live LA County DMH directory through a Cloudflare Worker. City is only an optional filter of existing manual county results, not an independent search mode. County contacts are referral entry points, not clinics; the datasets are incomplete and do not guarantee free or walk-in care.
- The County feed may return a first page with a continuation marker; MindBridge flags that more results exist and links to the full County directory. In a Pasadena live check, the County continuation repeated the same page, so MindBridge does not offer that unreliable “load more” action.
- Choose a county manually or click optional device location to suggest one using local Census boundaries. No coordinates are sent to MindBridge or saved; the browser location provider has its own practices. Search terms stay out of the URL and browser storage. Cloudflare processes explicit LA searches; LA County may log access details. Confirm eligibility, cost, hours, and appointments directly.
- Open a resource page for its description, hours, region, audience, issues, and links to call, text, or visit the provider's official website.
- Keep crisis options visible, including 988, Crisis Text Line, and The Trevor Project.

The whole top area stays pinned while scrolling: the 988 crisis strip, MindBridge brand, navigation and language switch move as one sticky stack. It retains its normal layout space rather than covering initial content. Its measured height supplies the scroll offset for anchors and the keyboard skip link, including when responsive wrapping or language changes alter that height.

## Data and safety

Only the local search results use a flat table. The 23 curated support resources below retain their original cards and individual Details links. Local rows show name, actual service/facility type, public map address, phone, source and snapshot date together; there are no nested disclosures or silently truncated previews. At the user's request, local results are paginated at five rows per page, including the county referral row. Bottom navigation shows Previous/Next, bounded page buttons, the visible range and total of loaded records. All matching loaded records remain reachable; new submissions and city/county choices reset to page one. This client-side paging does not retrieve additional upstream LA County pages or replace its partial-result warning. The county access contact is labelled as a referral row, not a clinic. Support-resource cards retain their descriptions, direct contact actions and individual Details links; full hours, audience and issue information remain on their detail pages. On narrow screens only the table scrolls horizontally, including by keyboard; the page itself does not overflow. Eligibility/availability reminders, adult-only labels and pre-submission LA transfer disclosures remain visible.

Resource records are maintained in [`src/data/resources.json`](src/data/resources.json). Listings are compiled from public information from SAMHSA, the 988 Suicide & Crisis Lifeline, and providers' official websites. The static directory data was last reviewed in **September 2026**; information and service availability can change, so confirm details with the provider before relying on them.

The single California search form starts with a **county dropdown** rather than requiring a ZIP: choose one of California's 58 counties to see its official Mental Health Plan access phone and every applicable record from the connected snapshots. Licensing records are restored with their actual facility types; Orange, San Diego and Butte outpatient records remain distinguishable through service and attribution columns. Manual county searches default to All cities and offer one optional city filter; results never wait for that filter. City names are available only as an optional filter of existing county results; independent City input is removed. County and ZIP search use visible segmented mode buttons; optional device location remains available in both modes. This is a county referral entry point for Medi-Cal specialty mental-health services, **not** 58 counties of verified provider listings. ZIP hints come from the [2020 Census ZCTA-to-county relationship file](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt), supplemented by unique address observations from CDPH where the Census file has no ZCTA. ZCTAs approximate postal ZIP codes: 170 California-intersecting ZCTAs cross county lines in this source; the UI asks the visitor to choose instead of guessing. Unmapped ZIPs have no mandatory second input; a separate County-mode search remains available. County phone numbers come from [DHCS County Mental Health Plan Information](https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/), retrieved on the date embedded in `src/data/california-county-access.json`. For ZIPs mapped uniquely to Los Angeles County, submitting the form also fetches live results from the County DMH Provider Directory API. For uncertain ZIPs, a visitor must choose LA County and click the separate live-search button. If a county suggestion is wrong, the visitor can switch to County mode and submit the correct county using the existing form. A new submission replaces the previous query instead of presenting the old query as a result from the newly selected county. Ambiguous ZIPs offer only their source-supported candidate counties. The County's API may log access information, and Cloudflare processes the request. MindBridge only requests device location after a visitor explicitly clicks; it does not intentionally retain the submitted city/ZIP or include it in the URL. County results are directory records, not MindBridge-verified referrals or guarantees of in-person service, eligibility, or current openings.

As of September 30, 2026, the approximate crosswalk has **1,819** California-intersecting ZIP/ZCTA keys. The connected dated site snapshots (state licensing, Orange County BHP sites, San Diego and Butte adult clinics, and HCAI primary-care mental-health reports) contain direct location records in **494** distinct ZIPs; **1,325** mapped ZIPs have no direct snapshot record. The HCAI addition increased direct snapshot ZIP coverage from 153 to 494 (341 additional ZIPs). Counts are distinct ZIPs, not unique providers; sources can describe the same site. This is not a measured share of all USPS California ZIPs, nor a count of LA County live results. For a mapped ZIP with no exact listing, the UI offers the county's official access line, not unrelated county-wide facility cards. Ambiguous ZIPs ask only for one of the candidate counties. An unmapped ZIP gets a short directory-specific no-results message and a 211 contact, with no second county form. A separate County-mode search remains available. Neither path guarantees a local appointment or free service.

The separate statewide lookup uses 133 facilities from two public California Health and Human Services datasets: the [CDPH licensed healthcare facility listing](https://data.chhs.ca.gov/dataset/licensed-healthcare-facility-listing) (September 1, 2026; only open acute psychiatric hospitals and psychology clinics) and the [DHCS licensed MHRC/PHF listing](https://data.chhs.ca.gov/dataset/licensed-mental-health-rehabilitation-centers-mhrc-and-psychiatric-health-facilities-phf) (September 11, 2026; only records licensed with a non-expired listed date). County/ZIP matching and optional county-result city filtering run entirely in the browser. Two DHCS rows missing a county and four rows with conflicting duplicate IDs were excluded; closed/expired listings are excluded. An exact ZIP with no listed facility does not trigger an unrelated county-wide facility list. County-wide browsing is a separate, explicit County-mode search, not a proximity estimate. For Orange County it also links to the [official Behavioral Health Plan provider directory](https://bhpproviderdirectory.ochca.com/) for broader services. This is a dated, incomplete facility snapshot, not an outpatient-care directory, a list of free services, or real-time proof of a current license. Always confirm directly before visiting; an exact ZIP with zero listings does **not** mean no local support exists.

DHCS's [county mental health plan contact table](https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/) links to many county-plan websites. A separate snapshot, `src/data/california-county-sites.json`, includes **20** plan landing pages that returned HTTPS success on September 29, 2026; many DHCS links were HTTP-only, missing, unavailable, or stale, and were omitted. These are county-plan sites, **not** 20 complete provider directories. All 58 verified county phone contacts remain available even when no website link is shown. Website availability can change; call the plan if a link later breaks. The [Medi-Cal Managed Care Provider Listing](https://data.chhs.ca.gov/dataset/medi-cal-mc-provider-listing) is a different network from county specialty mental-health plans: its behavioral-health indicator includes many individual-provider and unrelated specialty rows and does not supply complete county MHP site coverage, so it was not imported as a substitute.

The [Orange County Behavioral Health Plan provider directory](https://bhpproviderdirectory.ochca.com/machine-readable-data) separately publishes machine-readable site data. MindBridge includes a dated, minimized snapshot of 99 **MHP (specialty mental-health plan)** sites retrieved on September 29, 2026; it excludes DMC/SUD-only sites and individual practitioner rosters. A ZIP with no statewide licensing-subset matches can still show official Orange County Behavioral Health Plan sites from the separate county source. For ZIPs without an exact site match, no county-wide provider list is appended. Explicit County-mode searches show all physically Orange County sites immediately, with an optional city filter. This is not a distance search. The site snapshot is not live and does not verify availability, pricing, or eligibility. Visitors can open the official directory for current details. These 99 sites, the statewide 133 licensed facilities, and the curated 23 support resources are different datasets and must not be combined into one resource count.

[San Diego County BHS's adult outpatient clinic page](https://www.sandiegocounty.gov/content/sdc/bhs/Outpatient_behavioral_health_centers.html) publishes clinic names, street addresses, and phones by region. MindBridge includes a minimized snapshot of **20 physical clinic locations serving adults 18 and older**, retrieved September 29, 2026. The source also lists a contact-only program with no public street address, which was excluded rather than treated as a nearby clinic. San Diego ZIPs without an exact clinic match show no county-wide clinic fallback; city filtering remains available in an explicit County-mode search. This is not the full county Behavioral Health Plan provider directory, youth service list, or confirmation of current walk-in hours, price, eligibility or availability. The County links to a separate [full behavioral health provider directory](https://www.optumsandiego.com/content/SanDiego/sandiego/en/community-resources/providerdirectory1.html) for broader/current searches. Do not combine the San Diego adult clinics, Orange County sites, statewide licensing snapshot, and curated support directory counts.

The footer's version is generated at frontend build time from the `package.json` version, the UTC build minute, and the source commit's short SHA (e.g. `v0.0.2 · <UTC time> · <SHA>`). It identifies the frontend artifact, not the separately deployed LA County Worker.

## Live LA result cache

The live LA lookup reuses schema-valid successful results for **five minutes**, with at most **20** entries in current-tab memory. No search inputs, results or device coordinates are persisted by this cache. Repeats keep the original retrieval time; Refresh bypasses the cache. If refresh fails, the matching visible snapshot remains with an explicit stale/error message and a forced Retry for the submitted query, not an unsent draft. Empty successful responses are distinct from errors, aborted requests never warm the cache, and reload clears it. Expired cache entries are removed; an already displayed snapshot can remain for an honestly labelled failure fallback. Dated local listings and county contacts are not cached API results and keep their original source boundaries. See [v0.0.2 cache acceptance](docs/cache-acceptance-v0.0.2.md) for independent unit, browser and real-upstream evidence; a repair-branch push is not a production deployment.

## Butte County adult outpatient subset

County selection now also offers **four** county-published adult outpatient centers in Chico, Gridley, Oroville, and Paradise. This is an ages-18-and-over subset, not Butte's complete provider directory. All four rows appear immediately after a county search; optional city filtering remains available. Each row links directly to its official source. `python3 scripts/build_butte_adult_clinics.py` refreshes from the county's adult-service pages and fails if their outpatient scope, address, or phone cannot be recognized. SEARCH teams, administrative offices, youth-only contacts, CalWORKs offices, and peer/drop-in programs are excluded. Paradise's adult number is distinct from its youth number. Published walk-in information is not imported as a guarantee. Current ZIP coverage counts above include this subset.

## Statewide primary-care mental-health reports

`src/data/california-primary-care.json` adds **603 HCAI primary care clinic records across 48 counties**, with public name, street address, city, postal ZIP/ZIP+4, telephone and county only. The [official preliminary 2025 annual utilization workbook](https://data.chhs.ca.gov/dataset/primary-care-clinic-annual-utilization-data), extracted May 4, 2026 and downloaded September 30, 2026, explicitly reports `HEALTH_SERV_MENTAL_HEALTH = X`. Import requires `FAC_OPERATED_THIS_YR = Yes` and `LICENSE_STATUS = Open` in the same source report, excludes nonrespondents, and fails on missing metadata or conflicting eligible facility IDs. These flags describe the historical report, **not current licensing, appointments, cost, eligibility or free care**. Search rows show the report year and extraction date, and link to HCAI. County and exact five-digit ZIP searches include them, with case-insensitive filtering of existing cities in manual county results. Source ZIP+4 remains literal for display; a five-digit search compares its postal base. HCAI's explicit site county augments ZIP candidates without removing cross-county selection safeguards. Multiple sources may describe the same clinic; dataset totals are not an aggregate unique-provider count.

To refresh, use Python in a venv with `openpyxl==3.1.5` and `curl` installed:

```bash
python scripts/build_california_primary_care.py
# Or import a previously downloaded official workbook:
python scripts/build_california_primary_care.py --workbook PATH_TO_OFFICIAL_WORKBOOK.xlsx
npm test && npm run test:ui && npm run build && npm run test:safety
```

The script records the source URL, report year, source extraction date, UTC retrieval date and original workbook SHA-256. It fails before writing when the schema/year/date or completeness guard changes. The workbook includes preparer/staff names and patient-utilization statistics: **none of these are exported**. Browser tests traverse all pages of every covered county in English and Spanish, compare all 603 IDs, and check literal addresses, phones, map queries, source attribution, historical service labels, ZIP+4 matching and local-only query handling. The 58 county-plan access contacts and 23 resource cards remain separate and intact.

## Optional local county suggestion

`Use current location` requests browser permission only on click, then locally matches simplified [US Census TIGERweb county boundaries](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1). The boundary module is lazy-loaded, so ordinary browsing does not download it. `python3 scripts/build_county_boundaries.py` refreshes all 58 counties, failing if coverage changes. With poor accuracy, outside California, or within accuracy + 400 metres of a simplified edge, the app falls back to manual selection. A hint fills the county field and immediately shows the contact and all connected county records in the same local table, labelled county-wide rather than nearest matches. It does not guess a city or ZIP, append an arbitrary preview, require a second city form, or call a live API. A later explicit manual County/ZIP search remains a separate action. Visitors can correct the county manually. Coordinates are not saved or sent to MindBridge; the browser's own location provider may process location under its policies. Denial, timeout, unsupported browsers, and stale callbacks do not block manual search. A separate 8-second application deadline covers the entire location flow, including unanswered browser permission/position callbacks and a stalled boundary-module download. Native positioning has a 6-second timeout. Wall-time checks reject callbacks beyond the deadline, even if the timer was deferred. One attempt per click: no automatic retries or high-accuracy escalation; failures leave one short message, and success goes straight to county results without a redundant status paragraph. Expiry releases the loading control, offers manual search or an explicit retry, and invalidates late responses. Synchronous browser-provider errors likewise release loading; timers are cleared on completion, manual input/mode changes and unmount. This is not a distance or suitability ranking.

The home directory retains all 23 resources, each with one explicit Details link to its full page. Shared 988 call/text actions appear only in the top banner; the local search shows a single 211 action only when there is no matched county contact. The [product flow contract](docs/product-flows.md) separates location, manual county browsing, ZIP lookup, and full resource details.

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

The frontend is the Cloudflare Pages project **`mindbridge`**, published at **https://mindbridge.leixue.dev/** through its GitHub integration. A push can trigger a build, but verify the commit's Cloudflare Pages check and the live footer SHA before declaring publication successful. The backend is a separate Cloudflare Worker, **`mindbridge-la-county-directory`**, bound to **`/api/la-county/locations`** on the same domain; its `workers.dev` endpoint is disabled. Browser geolocation and county-boundary matching do not call that Worker. The browser/OS location provider has its own privacy practices, and a first lookup also needs the lazy boundary module download.

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
