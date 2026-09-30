# Product flow contract

Simplification must preserve a completed task and discoverable navigation, not just reduce element counts.

## Intent and result

- **Device location, from any mode:** the local boundary lookup establishes only a county. Show its official access contact and all applicable county snapshot records in one flat local table, labelled county-wide, not nearest matches. Do not pick an arbitrary preview, require a second city form, or start an external search. Synchronize the county field so the result can be corrected with the existing form.
- **Explicit manual county:** show the contact and all available physically-in-county records immediately in the same local table. An optional city filter defaults to All cities and never gates the initial results. Restore statewide licensing records with their actual classifications, dates and attribution; distinguish hospitals/rehabilitation facilities from outpatient care. No nested frames or Source & details drawers.
- **Explicit manual city/ZIP:** match records to that input, not to a guessed nearby area. A county referral is a clearly identified row, not a clinic. A mapped ZIP with no records gets the county contact; an unmapped input gets a short no-results message and one 211 contact. An ambiguous ZIP asks only for its source-supported candidate county. No unrelated county-wide fallback.
- **LA live lookup:** uniquely mapped LA ZIP submission may request the live directory after its visible transfer notice. City and uncertain ZIP requests require the separate explicit live-search action. Preserve API failure/partial-result disclosures.
- **Resource browsing:** retain all 23 curated records in their original cards, independently of local search. The table-format change applies only to local search results, not this browsing section. Each card has one visible Details link to its own full page, with a resource-specific accessible name. Do not hide the only clear navigation affordance to reduce clutter. Phone/text actions stay distinct from details; shared 988 actions remain in the top banner.

## State transitions

Location denial, timeout, unsupported browser, out-of-state position, poor accuracy, and boundary-load failure leave manual search available. Changing mode or editing input invalidates a pending location response. A subsequent manual submission replaces the location-only result rather than inheriting it. Starting location cancels a pending LA request.

## Verification

`tests/product-flow.production.mjs` reproduces location from all three modes in English and Spanish, asserts immediate county records with no second city form, then verifies a later exact city search. It clicks all 23 card Details links in each language, checks the actual route and full-page heading, and returns to the full card list. The directory is asserted to contain no table. Stuck-location regressions cover missing browser callbacks, stalled boundary downloads, synchronous provider errors, and late callbacks after the application deadline in both development and deployed builds. Snapshot tests compare rendered row counts to the stored records instead of accepting a preview. Location/privacy suites cover denied and stale callbacks; table and safety suites check shared-action counts, mobile horizontal scrolling confined to the table, keyboard operation, crisis access, and no-JS operation.
