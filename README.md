# MindBridge

MindBridge is a free directory of U.S. mental-health crisis hotlines and support resources. It helps people find the kind of support they need for themselves or someone they care about.

> **In immediate danger, call 911.** For U.S. crisis support, call or text **988** (Suicide & Crisis Lifeline, 24/7 and free). MindBridge is an information directory—not a substitute for professional care or emergency services.

## What it does

- Browse support resources and filter by keyword, audience, issue, category, and region.
- Share or revisit audience, issue, category, and region filters through the page URL. Keyword searches stay in local page state and are not added to the URL.
- Find local options through the 211 directory pathway and search the live Los Angeles County DMH Provider Directory by city or ZIP using a small Cloudflare Worker. These are County directory listings—not individual facilities verified by MindBridge—and may include provider locations or programs rather than walk-in clinics.
- The County feed may return a first page with a continuation marker; MindBridge flags that more results exist and links to the full County directory. In a Pasadena live check, the County continuation repeated the same page, so MindBridge does not offer that unreliable “load more” action.
- Use manual area search only: no GPS, no search term in the page URL, and no MindBridge database or browser-storage persistence. Cloudflare processes the request; LA County may log access information such as IP or browser details. Confirm service, eligibility, appointment requirements, and current availability directly with each provider.
- Open a resource page for its description, hours, region, audience, issues, and links to call, text, or visit the provider's official website.
- Keep crisis options visible, including 988, Crisis Text Line, and The Trevor Project.

## Data and safety

Resource records are maintained in [`src/data/resources.json`](src/data/resources.json). Listings are compiled from public information from SAMHSA, the 988 Suicide & Crisis Lifeline, and providers' official websites. The static directory data was last reviewed in **September 2026**; information and service availability can change, so confirm details with the provider before relying on them.

Los Angeles County search results are fetched live from the County DMH Provider Directory API. The County's API may log access information, and Cloudflare processes the request. MindBridge does not request GPS or intentionally retain the submitted city/ZIP. County results are directory records, not MindBridge-verified referrals or guarantees of in-person service, eligibility, or current openings.

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

1. An account owner or authorized operator runs `npx wrangler login`, then `npm run worker:deploy`.
2. In the Worker settings, set `ALLOWED_ORIGINS` to the exact origin of the public MindBridge website (for example, `https://mindbridge.example`, with no path). The checked-in local value is only for development. This browser-origin check is not authentication; configure appropriate Cloudflare rate limiting before exposing a public Worker endpoint.
3. Configure the static site's build variable `VITE_LA_COUNTY_API_URL` to `https://<deployed-worker-host>/api/la-county/locations`, then rebuild and deploy the static app. Alternatively, bind the Worker to the app's same-origin `/api/la-county/locations` route and leave that build variable unset.
4. Verify the live endpoint and search from the deployed site. No API key is used by the County endpoint.

This repository change prepares the code and local workflow only; it does not authorize or perform a Cloudflare deployment.

## Checks

```bash
npx playwright install chromium
npm test
npm run test:ui
npm run lint
npm run build
```

## Updating the directory

Before changing a listing, verify its name, eligibility, hours, phone/text instructions, region, and official URL against the provider's own information. Update `DATA_LAST_REVIEWED` in [`src/data/meta.ts`](src/data/meta.ts) after completing a review. Keep crisis guidance clear and do not present the directory as medical advice or emergency care.
