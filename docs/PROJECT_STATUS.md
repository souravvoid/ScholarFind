# Project Status and Readiness Scorecard

Audit date: 2026-11-15. Reported “about 40% complete” is an owner estimate, not a measured
engineering result. The estimate below is a transparent reviewer judgment, not a statement
of production readiness.

The feature matrix includes the first approved implementation slice. Weighted totals below
are the pre-implementation baseline, not a remeasurement of the current worktree.

The project owner has approved the **full project polish** scope and selected
Django/PostgreSQL as the target system of record for catalogue and user data. Initial
catalogue and matching slices are implemented in the current worktree; authenticated user-data
migration and production PostgreSQL verification remain outstanding. Live Google OAuth
verification is deferred until credentials are configured securely. See
[architecture decisions](ARCHITECTURE_DECISIONS.md).

## Feature matrix

| Area | Status | Evidence and remaining work |
|---|---|---|
| Routed landing, explorer, tracker, sources, detail, auth pages | **COMPLETE** for page/routing presence | Routes in [`src/App.tsx`](../src/App.tsx); mobile/route smoke tests exist. Feature presence does not imply backend persistence. |
| Desktop/mobile navigation | **COMPLETE** for tested shell journeys | [`tests/e2e/shell.spec.ts`](../tests/e2e/shell.spec.ts) covers route, overflow, and drawer behavior. Full accessibility audit remains. |
| Student dashboard | **NOT IMPLEMENTED** as a distinct dashboard route | The inspected route map has landing, explorer, tracker, sources, detail, and auth pages, but no dedicated student dashboard. |
| Authentication UI/API | **PARTIALLY COMPLETE** | Email/password API handlers and frontend calls exist; E2E covers page links and local mismatch validation, not successful live login. Google OAuth configuration is unverified. |
| Student profile | **PARTIALLY COMPLETE** | UI and authenticated backend profile API exist; SPA stores profile locally instead of using that API. |
| Catalogue/search/filter | **PARTIALLY COMPLETE** | Public Django API reads now drive the landing page, explorer, tracker, and sources page. Profile/saved/tracker persistence is still local. |
| Scholarship detail | **PARTIALLY COMPLETE** | Detail is fetched by canonical slug; loading, 404, server-error, and network-only offline fallback states are implemented and covered by service/E2E tests. |
| Eligibility explanation | **PARTIALLY COMPLETE** | TS and Python deterministic evaluators exist; dual implementations require parity maintenance. Backend evaluation does not load the user's stored profile. |
| Eligibility criteria coverage | **PARTIALLY COMPLETE** | GPA, degree, field, citizenship, English and work-experience rules exist in the TS engine. Income is not modeled; some catalogue income requirements are represented as GPA rules. ECTS, waiver defaults, and some failure explanations need review. |
| Save/unsave | **PARTIALLY COMPLETE** | Backend owner-scoped API exists; inspected client persistence is browser-local. |
| Application tracker | **PARTIALLY COMPLETE** | UI and backend CRUD exist; client data is local and full persistent journey is not E2E-tested. |
| Error, loading, and empty states | **PARTIALLY COMPLETE** | Catalogue/detail/source states distinguish offline fallback, HTTP errors, empty results, and detail 404; broader cross-journey acceptance remains. |
| External provider navigation | **PARTIALLY COMPLETE** | Application and data-driven source links use an HTTPS/domain confirmation gate; allowlist policy and deployed behavior remain unverified. |
| Django API authentication and authorization | **PARTIALLY COMPLETE** | Endpoints and permission classes exist; DB-backed runtime errors and successful OAuth prevent claiming end-to-end verification. |
| Request validation and API error handling | **PARTIALLY COMPLETE** | DRF serializers and validation exist, but response/error contracts and database-backed negative cases are not comprehensively verified. |
| Backend logging | **NEEDS REVIEW** | Framework logging is present, but sensitive-data redaction and production log/alert configuration were not verified. |
| API documentation | **PARTIALLY COMPLETE** | Catalogue summary/detail and rule payloads have SQLite-backed API tests; other response contracts and PostgreSQL runtime behavior remain unverified. |
| Scholarship ingestion | **PARTIALLY COMPLETE** | Staff trigger and collectors exist; all sources/collectors and data reuse rights are not verified. |
| PostgreSQL schema/migrations | **PARTIALLY COMPLETE** | Django models and migrations exist; a new migration aligns matching record relations to `StudentProfile`. The local pytest run still failed during database setup; the updated CI database job has not yet run. |
| Firestore access control | **PARTIALLY COMPLETE** | Checked-in rules are default-deny and owner-scoped; deployed state and emulator tests are unverified. |
| Test/CI coverage | **PARTIALLY COMPLETE** | Frontend service/unit, component, Django API, backend unittest, and landing/detail Playwright checks pass locally. Hosted PostgreSQL CI, live services, and several user workflows remain unverified. |
| Deployment, backups, monitoring | **NOT IMPLEMENTED / NEEDS REVIEW** | No deployment target or operational evidence was found. |
| Indian data coverage/licensing | **NEEDS REVIEW** | NSP pages are useful manual leads; open-data feeds and reuse terms remain unresolved. |

## Transparent completion estimate

Owner-reported 40% was not used as the result. The following weighted rubric is an
approximate assessment of the code and tests, where category scores are judgment calls based
on the matrix above:

| Workstream | Weight | Implemented estimate | Evidence-verified estimate | Production-ready estimate |
|---|---:|---:|---:|---:|
| Frontend user journeys | 30% | 65% | 55% | 50% |
| Backend APIs and persistence | 25% | 55% | 30% | 25% |
| Eligibility and data quality | 15% | 50% | 65% | 25% |
| Tests and quality gates | 20% | 55% | 65% | 35% |
| Operations and documentation | 10% | 25% | 20% | 10% |
| **Weighted total** | **100%** | **54%** | **49%** | **34%** |

Formula: sum of each category's `weight × category estimate`, divided by 100. The
implemented score measures code presence, verified score measures checked behavior/evidence,
and production score measures operational readiness. They are not interchangeable, and
should be recalculated after agreed acceptance criteria and an instrumented review.

## Readiness scorecard

Effort ranges below are approximate person-days and overlap; they are not additive. Cross-cutting
test/database work is shared between categories.

| Category | Observed state | Remaining work / priority | Effort | Dependencies | Completion criteria |
|---|---|---|---:|---|---|
| Functional completeness | Main discovery/profile/tracker surfaces exist; some data paths differ. | Close the core journey defects. **High** | 3–5 | API/data ownership decision (approved) | Synthetic user completes discovery → details → match → save → tracker with expected states. |
| Backend quality | APIs/models exist; matching defect and PostgreSQL test failures remain. | Fix relations and harden validation/permissions. **High** | 4–7 | Disposable PostgreSQL CI | CRUD, validation, and cross-user denial pass in database-backed tests. |
| Frontend quality | Routed responsive UI and tests exist; some state is local-only. | Integrate API state and test errors/loading/empty states. **High** | 5–8 | Backend contracts | Reloaded synthetic account retains expected profile/saved/tracker state. |
| Database | Models/migrations exist across PostgreSQL and Firestore. | Consolidate authoritative store; review constraints/indexes. **High** | 2–4 | PostgreSQL test environment | Fresh migrations work and selected schema constraints are covered by tests. |
| Data quality | Some public sources exist; Indian coverage/licensing unresolved. | Verify sources/cycle/permissions; do not import without approval. **High** | 4–8 | Provider/source permission | Every published real record has evidence, freshness, reuse status, and manual review. |
| Security | Source rules and API permissions exist; deployed state/negative tests unverified. | Emulator/API checks, OAuth/secret/CORS/log review. **High** | 3–6 | Staging/test credentials configured privately | Negative access tests pass; no production assumptions are made from source-only checks. |
| Testing | Frontend/backend unittest and E2E pass; pytest persistence errors without DB. | Add reproducible PostgreSQL and contract test coverage. **High** | 4–7 | Disposable DB service | CI passes unit, API, migration, and browser suites from a clean checkout. |
| Performance | No controlled benchmark was performed. | Define local dataset and measure only after correctness. **Medium** | 2–4 | Stable API/database baseline | Reproducible benchmark reports method, dataset, and results. |
| Documentation | Current readiness package exists; older documents need reconciliation. | Maintain current links and update docs with implementation. **Medium** | 1–3 | Code decisions | No contradictory implementation claims; current setup/tests verified. |
| Deployment readiness | Hosting, backups, monitoring, rollback unverified. | Build secure staging and operational procedures. **Low for demo; high before launch** | 4–8 | Hosting choice and private secrets | Staging smoke, backup/restore check, alert, and rollback documented. |
| Academic demo readiness | Local UI and smoke suite usable; live API needs DB/OAuth setup. | Finish a stable synthetic-data walkthrough. **High** | 2–3 | Choose local API-backed versus fallback demo | Demo guide works from a clean local setup without real user/provider data. |
| GitHub presentation | README, CI, docs exist; remote configured. | Keep CI/docs current and review release policy. **Medium** | 1–2 | Authorized PR/release process | Required checks pass; claims, licensing, and contribution docs are accurate. |

## Implementation options

Effort estimates are engineering person-days, excluding waits for external provider permissions
or cloud account access.

| Scope | Estimated effort | Main deliverables / dependencies |
|---|---:|---|
| **A — Minimum academic demo** | **5–8 person-days** | Fix detail/catalogue mismatch and profile defaults; curate clearly labelled synthetic scenarios; establish disposable local DB or mock-backed demo boundaries; add journey tests and demo runbook. Depends on choosing local-only versus API-backed demo. |
| **B — Backend engineering depth** | **12–20 person-days** | Repair matching ownership defect; PostgreSQL test setup/CI; API request/response/permission coverage; integrate profile/save/tracker API paths; database constraints and ingestion validation/provenance. Depends on DB environment and API/data ownership decision. |
| **C — Full project polish** | **25–40 person-days** | Scope B plus reviewed Indian source partnerships/licensing, controlled data refresh, parity/quality suite, accessible UX polish, staging deployment, secrets, backups, monitoring, security verification, full docs and demo packaging. Depends on hosting choice and permission to reuse public data. |

## Git and inspection boundary

The implementation and documentation changes are local worktree changes. No commit, fetch,
push, or remote publication was performed. Remote URL credentials are intentionally not
reproduced. Online repository freshness was not independently checked.

## Work not performed

Application source code, tests, and documentation were changed. No production configuration,
database records, deployed services, or public scholarship records were changed. Manual browser
review and live OAuth/API verification were not performed; the E2E run used a mocked catalogue
API fixture.
