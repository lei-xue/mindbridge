# Metadata verification

Scope: page metadata only (head tags, sharing image, social/localized alternates,
theme colour). No commit, push or deploy was performed. Working tree is at
`13656ab` ("Accept canonical trailing slash in static header navigation checks")
plus the uncommitted changes below. All resources, locale routing, the pinned
header, crisis links, privacy behaviour (`no-referrer`, no cookies, no search
terms in the URL) and the existing favicon are preserved.

## What changed

- `src/i18n/meta.ts` is the single source of truth. `pageMetadata()` now also
  returns `ogType`, `siteName`, `localeAlternate`, `image` (absolute, localized
  1200x630 PNG), `imageAlt` (localized, descriptive), `imageWidth`,
  `imageHeight`, `imageType`, `twitterCard` and `themeColor`. `siteSchema()`
  centralises the minimal, truthful `WebSite` JSON-LD.
- `index.html` (dev entry / build template) carries the complete English tag
  set so `npm run dev` and the no-JS fallback are correct before any prerender.
- `scripts/prerender.mjs` now strips every managed tag from the template and
  rebuilds one canonical set per route from `pageMetadata()`, so a built page
  can never keep a stale or duplicated `og`/`twitter`/`hreflang`/JSON-LD tag.
  Sitemap, robots and `_redirects` behaviour is unchanged.
- `src/i18n/DocumentMeta.tsx` upserts every managed tag on SPA route changes and
  removes duplicates (meta, canonical, hreflang alternates and JSON-LD).
- `scripts/build-social-images.mjs` (new, `npm run social:images`) renders
  original project cards with Playwright loaded through `createRequire` of this
  project's `package.json`. Brand markup only (the favicon sprout/heart, the
  site palette); no third-party or downloaded art.
- `public/social/mindbridge-en-1200x630.png` and
  `public/social/mindbridge-es-1200x630.png` are the generated cards.

### Tags per route (both locales)

`title`, `meta[name=description]`, `link[rel=canonical]`, `meta[name=theme-color]`,
`og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale`,
`og:locale:alternate`, `og:image`, `og:image:type`, `og:image:width`,
`og:image:height`, `og:image:alt`, `twitter:card`, `twitter:title`,
`twitter:description`, `twitter:image`, `twitter:image:alt`, `hreflang`
`en`/`es`/`x-default`, and one `application/ld+json` script.

The previous `twitter:card` was `summary` with no image; a 1200x630 card is the
large format, so it is now `summary_large_image`.

## Safety copy

The site-level descriptions were rewritten so that "free" and "confidential"
describe the **crisis lines** (988 and peers), not every listed provider, and the
site is described as a directory that is not a medical provider. English and
Spanish:

- Home: "…directory of US mental health crisis lines and support resources.
  Crisis lines such as 988 offer free, confidential help 24/7. A directory, not
  a medical provider." / "…líneas como el 988 ofrecen ayuda gratuita y
  confidencial, 24/7. Es un directorio, no un proveedor médico."
- About: who runs it, data sources, privacy and corrections; ends "Not a medical
  provider." / "No es un proveedor médico."

Resource pages keep their own (already accurate) localized descriptions. JSON-LD
declares only `WebSite` with `name`, URL, `inLanguage` and the page description;
no ratings, offers or medical entities are invented.

## Measured verification

Run on this machine, Node v26.7.0, Playwright 1.63.0, headless Chromium. No
dependency versions were changed.

| Command | Result |
| --- | --- |
| `npm run social:images` | wrote both PNGs; `file` reports `PNG image data, 1200 x 630` |
| `npm run build` | passes; `Prerendered 50 English/Spanish pages` |
| `node --test tests/metadata.test.mjs` | 51 passed, 0 failed |
| `npm test` | 79 passed, 0 failed |
| `npm run lint` | clean (exit 0) |
| `npm run test:safety -- metadata.production.mjs` | 4 passed |
| `npm run test:safety` (full production suite) | 106 passed |

`tests/metadata.test.mjs` reads the prerendered `dist/` output for all 50 EN/ES
routes and asserts every managed tag is present exactly once with the right
localized value; the PNG is a real 1200x630 file; canonical/`og:url` match the
route; `hreflang` en/es/x-default point at the correct alternates; JSON-LD parses,
cannot break out of its script tag, and matches the locale. It reports a loud
skip (not a failure) if `dist/` is absent, so run `npm run build` first.

`tests/metadata.production.mjs` runs against the built preview: the cards are
served as 1200x630 PNGs; all routes serve complete duplicate-free HTML; a
client-side switch to `/es`, a click into `/es/resource/988-lifeline`,
back/forward and a reload each keep exactly one of every managed tag with the
localized values; and the hydrated `/es/about` description/title equal the
prerendered HTML. No cookies are set.

### Known non-metadata failure observed during the broad UI/spec run

A broad Playwright run reported `102 passed, 2 failed`. Both failures were
`tests/california-primary-care.production.mjs` (en and es) timing out clicking a
county search submit button while walking HCAI county records. This is unrelated
to head tags or locale metadata and looks flaky/parallel-load related; it should
be re-run before being reported as green or as a regression. It is recorded here
rather than hidden. The coordinator's first full rerun reached its 240-second
command deadline without a test assertion failure. A subsequent complete run
with two workers finished successfully: **106 passed (4.6 minutes)**. The
coordinator also independently reran the 79 Node tests, lint, production build,
and all four metadata browser tests; each passed.

## Remaining deployment verification (not performed here)

Nothing was deployed, so these must be checked against the hosted site after a
release:

1. `GET /social/mindbridge-en-1200x630.png` and the `-es-` file return `200`
   with `Content-Type: image/png` and 1200x630 dimensions from the CDN.
2. The live HTML for every route carries the localized `og:image`, `twitter:*`,
   `theme-color` and `hreflang` tags (confirm the CDN serves the prerendered
   files, not a cached root `index.html`, including the canonical trailing
   slash).
3. Crawler/card validators (e.g. a social sharing debugger) fetch and render the
   cards for `https://mindbridge.leixue.dev/` and `/es`.
4. Sitemap `xhtml:link` alternates still resolve and match the served routes.
