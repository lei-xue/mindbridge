# Product flow contract

Simplification must preserve a completed task and discoverable navigation, not just reduce element counts.

## Intent and result

- **Device location, from any mode:** the local boundary lookup establishes only a county. Return that county's official access contact immediately. Do not claim proximity, pick arbitrary clinics, ask for a second city, or start an external search. Synchronize the county field so the result can be corrected.
- **Explicit manual county:** return the county access contact. Optional county-wide browsing is a separate user choice: Orange and San Diego require an explicit city or Any city selection; statewide licensing data remains folded and is not presented as an outpatient directory. This is not location-driven browsing.
- **Explicit manual city/ZIP:** match records to that input, not to a guessed nearby area. Keep county referral secondary if records exist. A mapped ZIP with no records gets the county contact; an unmapped input gets a short no-results message and one 211 contact. An ambiguous ZIP asks only for its source-supported candidate county. No unrelated county-wide fallback.
- **LA live lookup:** uniquely mapped LA ZIP submission may request the live directory after its visible transfer notice. City and uncertain ZIP requests require the separate explicit live-search action. Preserve API failure/partial-result disclosures.
- **Resource browsing:** retain all 23 curated records independently of local search. Each card has one visible Details link to its own full page, with a resource-specific accessible name. Do not hide the only clear navigation affordance to reduce clutter. Phone/text actions stay distinct from details; shared 988 actions remain in the top banner.

## State transitions

Location denial, timeout, unsupported browser, out-of-state position, poor accuracy, and boundary-load failure leave manual search available. Changing mode or editing input invalidates a pending location response. A subsequent manual submission replaces the location-only result rather than inheriting it. Starting location cancels a pending LA request.

## Verification

`tests/product-flow.production.mjs` reproduces location from all three modes in English and Spanish, asserts no provider previews or second city form, then verifies a later manual city search. It also clicks every one of the 23 Details links in each language, checks the actual route and full-page heading, and returns to the full list. Existing location/privacy suites cover denied and stale callbacks; YAGNI and safety suites preserve shared-action counts, narrow layouts, crisis access, and no-JS operation.
