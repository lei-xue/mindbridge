# MindBridge v0.0.2 — bounded LA live-result cache

## Approved scope

Cache only the existing explicitly submitted LA County DMH live search. Keep County/ZIP modes, dated local facility/HCAI snapshots, county access contacts, five-row client paging, all 23 curated resource cards, both English and Spanish routes, and the local single-attempt location watchdog intact. No source snapshots or Worker configuration/code changed. Package and lockfile release metadata are `0.0.2`; dependency versions are unchanged.

## Implementation

- Pure `createLaCountyCache` plus a singleton API wrapper: exact endpoint/search-type/submitted-value key, five-minute freshness, 20-entry LRU, deep-copy isolation, scheduled expiry plus access-time expiry/backwards-clock checks.
- Memory belongs only to the current document. No inputs/results/coordinates written to browser storage, URLs or analytics; reload clears the cache. Current visible results can remain after a failed refresh, separately from expired module entries.
- Cache only schema-valid successes, including genuine empty responses. Reject errors, invalid nested records and aborted responses; check cancellation after the loader finishes, even if the loader ignores the signal.
- Keep POST/body/signal and the Worker's `Cache-Control: no-store`. Client fetch time is separate from source `lastUpdated` dates and never advances on a cache hit.
- Refresh bypasses cache. Failed refresh/expired re-fetch preserves the exact matching visible snapshot, original fetch time and partial-result warning; mark it stale and offer forced Retry for the last submitted query, never a new draft. Different queries never borrow rows.
- Quiet EN/ES fetched-time, cache and stale messages. The pre-submit disclosure says new requests transfer via Cloudflare/LA County, which may log IP/browser details; repeats **can** reuse a five-minute in-tab copy, not guaranteed hits after eviction or forced refresh.

## UI review and measured correction

| Before | After | Why |
| --- | --- | --- |
| Completed identical LA search sends another POST | Reuse fresh successful in-tab response with original timestamp | Avoid redundant downloads without persistent health-query storage |
| Failed refresh clears source rows/time | Keep matching rows/time, show stale failure and forced Retry | Do not confuse unavailable with a successful empty directory |
| Native `disabled` refresh button loses keyboard focus after a rendering frame | `aria-disabled`/`aria-busy`, guarded action, same DOM node | Preserve keyboard position while blocking busy activation; no focus-restoration code steals voluntary focus |
| Cached-use message survives a failed refresh | Hide it while loading/stale; keep original fetch time | Do not imply an expired or failed-refresh snapshot is a fresh cache hit |

The independent cache-browser run first found six focus failures across EN/ES and 320/390/1440px. A minimal Chromium probe reproduced native-disabled blur after two animation frames, while ARIA-disabled preserved the same node's focus. The K3 correction was independently applied and rerun; final suite is green. Busy duplicate activation and voluntarily moving focus away are covered.

## Real verification

Coordinator executed after the K3 writers stopped:

- Clean lockfile install: `npm ci --prefer-offline --no-audit` succeeded.
- `npm test`: **104 passed, 0 failed**, including **20** cache units (expiry timer, exact keys, force, LRU, both copy directions, nested malformed records, error-vs-empty, and ignored cancellation/no warming).
- `npm run lint`: clean, no warnings.
- `npm run build`: TypeScript/Vite/prerender succeeded; **50** localized static pages. Existing >500 kB entry-chunk advisory remains; code splitting was not this cache milestone's scope.
- `npm run test:ui -- --workers=3`: **108 passed**.
- `npm run test:safety -- --workers=3`: **118 passed**, including **12** independent cache-browser cases. These executed-suite totals overlap some existing shared test definitions and are not summed as unique tests.
- `git diff --check`: clean. `git diff --name-only -- src/data workers`: empty.

### Synthetic vs real backend evidence

The original production replay used explicit synthetic interception and found **1 extra POST** on completed repeat. Synthetic fixtures are labelled `SYNTHETIC`; postal inputs are selected dynamically from the published crosswalk, not user data, and are never logged or hard-coded in new fixtures. Synthetic regressions cover failed refresh/time retention, draft-safe forced Retry, TTL, late ignored-abort response, error/empty distinction, reload, storage, width/touch targets, focus and busy guards.

Separately, an **unmocked browser** used the repository's unchanged local Worker (`npm run worker:dev -- --local`) and Vite at the already configured local origin, talking to the official LA upstream:

- Public city API query returned **10 source records**, `hasMore: true`; completed repeat reused the original fetch time; forced refresh bypassed. **2 total POSTs** for initial/repeat/force, both responses `no-store`. This first-page count is not a complete directory total.
- Actual form UI with a dynamically selected official-crosswalk input returned a genuine **0-record** upstream success; repeat added **0 POSTs**, force added **1**, original cache-hit time remained unchanged, and both responses were HTTP 200 / `no-store`. An empty source subset is not proof that no nearby care exists.
- localStorage/sessionStorage remained empty. No device permission or coordinates were used. Temporary verification servers were stopped. No backend allowlist was broadened and nothing was deployed by Wrangler.

## Delivery boundary

The repair branch is `fix/mindbridge-live-cache`; compare its exact pushed SHA and built footer before publishing. This acceptance record does **not** claim production deployment from a branch push. The existing production route was last observed as v0.0.1 / `7732ad32`; its custom-host Worker path is separate from the frontend build. Branch-preview API behavior is not assumed to match that custom-host route.

Business implementation and focused corrections came from exact-route **Kimi K3** workers/reviewers (`kimi-k3`, Ark route billed `custom`); coordinator owned independent tests, integration and release metadata. Physical-phone and manual screen-reader validation were not performed; responsive geometry and keyboard flows were browser-automated.
