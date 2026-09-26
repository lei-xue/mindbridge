# MindBridge

MindBridge is a free directory of U.S. mental-health crisis hotlines and support resources. It helps people find the kind of support they need for themselves or someone they care about.

> **In immediate danger, call 911.** For U.S. crisis support, call or text **988** (Suicide & Crisis Lifeline, 24/7 and free). MindBridge is an information directory—not a substitute for professional care or emergency services.

## What it does

- Browse support resources and filter by keyword, audience, issue, category, and region.
- Share or revisit audience, issue, category, and region filters through the page URL. Keyword searches stay in local page state and are not added to the URL.
- Find local options via the official 211 directory pathway and, for Los Angeles County, the county DMH Provider Directory. These are external directories, not individual facilities verified by MindBridge; MindBridge does not request GPS, and any location details shared externally are subject to those sites' privacy practices.
- Open a resource page for its description, hours, region, audience, issues, and links to call, text, or visit the provider's official website.
- Keep crisis options visible, including 988, Crisis Text Line, and The Trevor Project.

## Data and safety

Resource records are maintained in [`src/data/resources.json`](src/data/resources.json). Listings are compiled from public information from SAMHSA, the 988 Suicide & Crisis Lifeline, and providers' official websites. The directory data was last reviewed in **September 2026**; information and service availability can change, so confirm details with the provider before relying on them.

## Tech stack

- React and TypeScript
- Vite and React Router
- Tailwind CSS
- Node.js test runner, Playwright, and Oxlint

## Run locally

```bash
npm ci
npm run dev
```

Vite prints the local development URL in the terminal.

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
