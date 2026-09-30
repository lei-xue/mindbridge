# MindBridge UI review — resource directory redesign

## Method and limitation

This review is text- and measurement-based only. No browser screenshot or vision
tool was available, so visual judgments rest on DOM structure, computed-style and
bounding-box measurements taken via Playwright, plus code inspection of
HomePage, ResourceCard, FilterBar, Header, ResourceDetailPage, AboutPage,
index.css and lib/ui.ts. Spacing, hierarchy, alignment and density were checked
through code and rendered measurements. This does not establish subjective visual
acceptance; the published screenshots are provided for the user's assessment.

## Findings (audit)

Layout rhythm: the previous flat border-b list had no card boundary, so 23
resources read as one undifferentiated wall; the first-pass 3-column grid
(max-w-6xl, gap-5) fixes density and is retained.

Hierarchy: the first-pass card was sound but actions floated against the card
bottom edge with no separation (`pt-1` only), and the FREE badge could be
pushed/wrapped by long Spanish names. Details link alignment varied per card
because it followed the call/text buttons with no anchor.

Duplicated decoration: none found; the GentleSprout/SproutSpeech appear once
per section heading and cause no layout problems — preserved untouched.

Responsive rows: grid rows equalize height via h-full + mt-auto; verified
programmatically that same-row cards share y and height at 768/1024/1440/1920.

Translations/wrapping: ES descriptions are longer; verified every description
renders unclipped (scrollHeight <= clientHeight, no line-clamp, overflow
visible) in both locales at all six widths.

Target sizes: call/text buttons use btnBase min-h-11 (44px); the Details link
already had min-h-11; test asserts >=44px for every anchor in every card.

Keyboard/focus: all interactive elements use the shared focusRing token; no
changes needed.

No-results state: dashed panel with sprout is consistent; preserved.

Consistency: detail page reuses the same btnCall/btnText/btnSecondary tokens,
so card and detail actions match. FilterBar keyword search was cramped in one
of five equal columns; giving it 2 of 6 columns on desktop keeps it usable
(measured: keyword width > 1.8x select width at >=1024).

Local search results stay tables; crisis banner/988/911, free labels, language
routing, county/city/ZIP provider logic and the 12s geolocation watchdog are
untouched. No data, copy, dependency or config changes.

## Design choices (implemented)

- Card: rounded-xl border sage-200, p-5 (20px), shadow-sm with hover:shadow-md
  transition for a calm affordance, h-full flex column.
- Title: leading-snug; FREE badge gets shrink-0 + mt-0.5 so it never wraps or
  compresses the title in Spanish.
- Description: grow so the action row pins to the bottom of equal-height cards;
  no clamping, no fixed height, no hidden overflow.
- Actions: separated by a subtle top border (border-sage-100 pt-3),
  items-center, Details link anchored right with ml-auto for consistent
  alignment across cards with/without phone/text buttons.
- Grid: 1 / 2 / 3 columns at base / sm(640) / lg(1024); container max-w-6xl.
- FilterBar: lg:grid-cols-6 with the keyword input spanning 2 columns.

## Measured results

- npm run lint: pass. npm run build: pass (50 prerendered EN/ES pages).
- npm run test:safety -- tests/resource-card-layout.production.mjs --workers=3:
  12/12 passed (EN+ES x 320/390/768/1024/1440/1920) against the production
  build. Asserts 23 cards, no tables in #directory, grid column counts 1/1/2/3/3/3,
  20px card padding, zero horizontal overflow, unclipped descriptions,
  no webkit-line-clamp, overflow visible, all link targets >=44px, exact EN and
  ES (with EN fallback) name/description text, one Details link per card,
  equal y/height across the first grid row, desktop keyword filter width.
- npm run test:ui -- tests/resource-card-layout.spec.mjs --workers=3: 12/12
  passed against the dev server via the spec wrapper importing the same
  production test file.

## Unresolved

None known. Full regression suite and publication are left to the coordinator.
