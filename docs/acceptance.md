# Acceptance record

Reviewed runtime revision: [`ac40fc7`](https://github.com/lei-xue/mindbridge/commit/ac40fc7272e92c5b4f6cdfebe6898d626e250bd5). Recorded September 30, 2026 (America/Los_Angeles). This is a historical acceptance record, not a hard-coded current deployment version; documentation-only commits can trigger a new Pages build and footer SHA.

**Live:** [English](https://mindbridge.leixue.dev/) · [Español](https://mindbridge.leixue.dev/es)

## Accepted scope

- County and ZIP are the only independent California search modes. Manual county results retain an optional filter of cities actually present in those records.
- Each location click makes one browser positioning attempt: `enableHighAccuracy: false`, native `timeout: 6000`, `maximumAge: 60000`. An application deadline of 8 seconds covers positioning and the lazy county-boundary download. Request tokens and wall-time guards reject expired or superseded responses; manual editing stays available.
- Location yields county-wide records, not nearest-clinic rankings. Coordinates are matched locally and are not sent to the LA directory Worker. Browser/OS location providers have their own practices.
- Search and location buttons occupy separate rows. Failure produces one short message, with no automatic or high-accuracy retry loop.
- Local tables retain all loaded records through pagination, at most five rows per page including the county referral. All 23 original support cards and their Details routes remain separate from the local table.
- English/Spanish behavior, crisis access, static/no-JS fallback, and automated accessibility checks remain supported. Historical provider reports do not establish current availability, eligibility, pricing or free care.

## Independent model reviews

Both reviewers received the same task-scoped source, diff and actual coordinator test output in separate read-only, tool-free sessions. They did not personally navigate the site or visually inspect screenshots. Session usage records were checked for the exact models; no Flash or provider fallback was used.

| Reviewer | Exact model | Original verdict | Follow-up |
| --- | --- | --- | --- |
| Kimi K3 | `kimi-k3` | PASS; no acceptance blocker | Coordinator checked the findings and the stated limitations. |
| GLM-5.3 | `glm-5.3` (not Flash) | CONDITIONAL PASS | Required live runs of three local-only location/search specs. Coordinator supplied the additional production evidence below; this is not a second GLM review. |

## Actual verification results

1. Fresh existing production suite: **94 passed** against the deployed site.
2. Direct live run of `location-retry.spec.mjs`, `location-immediate.spec.mjs` and `search-redesign.spec.mjs`: **12 passed, 1 failed**. The original failure is not concealed or reported as a green run.
3. Investigation isolated the failure to the local-only `location-immediate` assertion that every non-GET request must be absent. Production hosting injects the already-disclosed Cloudflare Web Analytics beacon, which makes same-origin `/cdn-cgi/rum` POST requests. That assertion does not distinguish analytics from location transfer.
4. Additional production-specific checks: **8 passed**. They checked English and Spanish county results and preserved records; captured real analytics writes; allowed only the exact same-origin RUM endpoint; checked all observed request URLs and POST bodies for the simulated device coordinates/location fields; and verified the About disclosure. Layout checks covered 320, 390 and 1440 CSS pixels in both languages, with no City button, vertically separated search/location controls, at least 44px control heights and no page-level horizontal overflow.
5. The reviewed live footer matched `ac40fc7`. The single-attempt/options tests and existing missing-callback, stalled-boundary and late-callback tests passed. The additional checks were run as an external acceptance harness; they do **not** claim that the repository's default production configuration now automatically runs every local-only spec.

The GLM evidence condition was met by coordinator follow-up. No blocking functional defect was confirmed. Keep the original conditional verdict distinct from that follow-up conclusion.

## Remaining limits and maintenance

- All automated positioning cases use simulated coordinates or controlled callbacks. One reviewer described a production positioning case as real authorized geolocation; source readback confirmed that description was inaccurate. These checks do not establish physical GPS speed or native permission-prompt behavior on a visitor's device.
- An 8-second application deadline is not a guarantee of an exactly timed display while the browser event loop is suspended, nor a promise of successful positioning. A webpage cannot dismiss the OS/browser permission prompt.
- Automated WCAG scans do not establish full screen-reader conformance; the pending-location announcement deserves manual assistive-technology testing.
- Unreachable legacy City branches/translation strings are nonblocking cleanup work, not grounds to remove records or redesign the accepted interface.
- Future production privacy tests should explicitly inspect the disclosed RUM payload and reject unknown endpoints or coordinates. Do not broadly exempt analytics, arbitrary POSTs or API requests merely to make a local-only assertion pass.
- Source refreshes and true-device/weak-network checks remain ongoing maintenance, not a claim that all California providers or appointments are covered.
