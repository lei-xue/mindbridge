# UI/UX review — Emil round (feat/emil-uiux-production)

Scope: restrained polish of the current tested flows per the coordinator-checked
three-project plan. No data JSONs, routes, metadata contracts, languages, privacy
behavior, or crisis CTA structure were changed. Version bumped 0.0.0 -> 0.0.1
(package.json + package-lock.json together).

## Before | After | Why

| Before | After | Why |
| --- | --- | --- |
| Global `scroll-behavior: smooth` in `src/index.css` applied even with reduced motion enabled; only the skip-link JS path checked the preference | Added `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto } }`; verified compiled into `dist/assets/index-*.css` | WCAG 2.3.3; vestibular-sensitive users get instant anchor jumps everywhere, not just on the skip link |
| Footer build stamp showed only UTC build time and short SHA (`<time> · <sha>`) | Stamp now injects the package version too: `v0.0.1 · <UTC minute> · <8-char SHA>`, built in `vite.config.ts` from `package.json`; nothing hardcoded; localization (`Version:` / `Versión:`) preserved | A visible artifact identity needs the release version, not just time/SHA; keeps the existing single-source version in package.json + lockfile |
| Desktop (sm+) California search actions ("Find support options" / "Use current location") spanned the full content width (1120px measured at 1440) | Action group limited to `sm:max-w-sm`; buttons remain stacked on separate rows (explicit user preference, not side by side); mobile stays full-width | Oversized desktop primary actions read as a stretched mobile page; limiting width improves hierarchy without touching the tested submit/location logic |
| Crisis banner 24/7 hours text could break mid-phrase when the banner wraps at narrow widths | `whitespace-nowrap` on the hours span only; banner still wraps as a whole between items | Crisis information must never fragment; change is minimal and does not duplicate or restructure the CTA |
| Footer Playwright contract asserted `Version: <time> · <sha>` | Updated regex to `Version: vX.Y.Z · <time> · <sha>` to match the valid new contract | Test reflects the intended new identity format; not weakened — it is stricter |

Verified unchanged (source + tests): 23 resource cards and details, County/ZIP-only
search with city filter inside county results, <=5 rows/page including county
contacts, single low-accuracy location attempt with 6s native / 8s app deadlines and
no auto-retry, sticky measured header offset, sprout left of bubble, EN/ES routes
and prerendered metadata (50 pages), watchdog/privacy worker tests. No decorative
animations, overscroll suppression, zoom disabling, or focus hiding added.

## Test commands and actual results (this branch, 2026-10-03)

- `npm run lint` (oxlint): exit 0, no findings.
- `npm run build` (`tsc -b && vite build && node scripts/prerender.mjs`): exit 0;
  prerendered 50 English/Spanish pages; reduced-motion rule confirmed present in
  compiled CSS; footer shows `v0.0.1 · 2026-10-03T18:32Z · 2b208915` in EN and ES.
- `npm test` (node --test tests/**/*.test.mjs): 84 passed, 0 failed, including the
  new `tests/uiux-contracts.test.mjs` (version/lockfile sync, reduced-motion guard,
  skip-link guard, crisis hours nowrap, stacked width-limited actions) and the
  full metadata suite against the fresh dist build.

UI style basis: official Emil Kowalski skills upstream
https://github.com/emilkowalski/skills, pinned at e8a175de22ae1e49370fc144c1f3bb9aeedf988d (MIT).

## Verification status (coordinator-measured, 2026-10-03)

- UI automated gate PASSED subject to final review (not a global security
  certification): 108 Playwright tests pass, including 4 new EN/ES 320/390
  200%-text tests (`tests/uiux-zoom.spec.mjs`) and the updated footer regex.
- Broad local browser + axe scan passed (three-project run): 106 states total
  at 320/390/1440 across all supported routes of all three projects, including
  this project's 46 localized detail pages, plus root at 200% text zoom —
  no page overflow, no JS exceptions, no unnamed buttons, unique h1, no
  serious/critical axe findings. First broad run exposed a text overflow that
  was fixed and re-run clean.
- CharityCheck (cross-project comparison only): its local-search pagination
  traversal initially raced React commits; waiting for the exact page caption
  verified all 500 records across 42 pages. MindBridge retains its separate
  five-row pagination contract, exercised by its 108-test suite.

## Pending (not claimed as done)

- Physical-device (real phone) and manual screen-reader review: pending —
  the above is automated local evidence, not real hardware or subjective
  visual sign-off.
- Online new version: unpublished. Deploy/publish is a separate authorized
  gate; final live checks are pending.
