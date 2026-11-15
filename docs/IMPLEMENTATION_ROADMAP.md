# Implementation Roadmap

Last audited: 2026-11-15. The project owner has authorized full project polish; this is the
implementation sequence for that scope.

The project owner subsequently authorized full project polish and selected Django/PostgreSQL
as the target data authority. The architecture decision is recorded in
[ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md); this changes the roadmap direction
from proposal to authorized work, but does not mean migration is complete.

## Priority order

| Priority | Work | Why first | Acceptance evidence |
|---|---|---|---|
| P0 | Fix matching model/view ownership mismatch. | **Resolved in the current worktree:** models now reference the `StudentProfile` resolved by views, with a migration and targeted owner-isolation tests. | Targeted suite passes 4 tests; PostgreSQL CI awaits a hosted run. |
| P0 | Resolve catalogue authority and explorer/detail mismatch. | Records discovered from one store may not have a resolvable detail record. | **Initial slice implemented:** catalogue, source, landing, tracker, and detail reads use the Django API; details resolve by slug, and network-only offline fallback is explicit. Frontend service and detail-flow tests pass. |
| P0 | Remove misleading profile defaults and clarify local persistence. | Example inputs can be mistaken for actual user answers. | Empty new profile; missing-information state is tested; UI states whether persistence is local. |
| P1 | Establish reproducible PostgreSQL test environment in CI. | Current pytest persistence suite errors without DB. | Fresh DB migrations and full pytest suite pass in CI. |
| P1 | Integrate profile, saved items, and tracker with Django APIs. | Duplicate state in browser and Django has no demonstrated synchronization; Django/PostgreSQL is the approved target. | One authoritative path, API contract, reload/cross-device tests, ownership tests. |
| P1 | Maintain TS/Python eligibility golden cases. | Separate engines can drift. | Shared fixtures cover every supported rule and match outcome/explanation. |
| P1 | Add provider source review and licensing record per scholarship. | Portal availability does not imply republication rights or current dates. | Manual validation checklist with source, date, status, and reuse permission. |
| P2 | Add Firestore emulator and external-link negative tests. | Live rules and redirects are not verified. | Emulator denies unowned writes/catalogue writes; redirect tests enforce HTTPS/allowlist. |
| P2 | Define deployment, backup, monitoring and rollback. | No production operations evidence exists. | Staging runbook and recovery/alert verification. |
| P3 | Expand accessibility and performance testing. | Current smoke checks are not a full audit or benchmark. | Agreed WCAG scope and reproducible local performance report. |

## Completed in the current worktree

- Matching model ownership is aligned with the `StudentProfile` resolved by the views. A
  migration and owner-isolation regression tests were added; the focused suite passes 4 tests.
  The new PostgreSQL CI job still awaits a hosted run.
- Public scholarship/source catalogue reads now use Django API endpoints. Summary/detail
  serializers expose validated rule data; detail lookup is slug-based, and missing deadlines
  remain unknown. The frontend maps API records, paginates results, and falls back to bundled
  metadata only for network failures. Empty responses, HTTP errors, and detail 404s remain
  visible. Focused API/service tests and the mocked landing/detail E2E pass.
- Landing, explorer, tracker, sources, and detail surfaces now consume the same canonical
  catalogue; data-driven external source links use the confirmation gate. Profile, saved-item,
  and tracker persistence are still browser-local and remain on the roadmap.
- Removed the client-side Firestore catalogue persistence helper and startup connectivity
  probe. Catalogue writes remain on the server-side ingestion path.

## Scenarios and estimates

See the person-day ranges and dependencies in [project status](PROJECT_STATUS.md). External
data ingestion requires separate source-by-source verification and reuse approval.

## Parallelization and demo exclusions

Remaining work includes profile/saved/tracker API integration, synthetic demo journey coverage,
and source/license research. Database integration depends on an available PostgreSQL test
environment; data ingestion depends on source permission and verification.

For a local academic demonstration, production deployment, automated multi-provider
scraping/refresh, large-scale performance work, and full monitoring/backup operations are not
prerequisites. They remain necessary considerations before a public production launch.
