# Test Strategy — ScholarFind (2026-11-08)

Current state verified by reading suites; nothing invented. Rusty corners labeled.

## What exists (assertions verified)

| Suite | Runner | Covers | Misses |
|---|---|---|---|
| `src/utils/eligibilityEngine.test.ts` (5) | node:test/tsx | GPA tables, one eligible/fail case | field_of_study, language thresholds, matchScore, unknown-ruleType semantics |
| `src/services/databaseService.test.ts` (3) | node:test | date math only | Firestore read/seed/fallback, `triggerLiveSourceSync` |
| `src/utils/ingestion/ingestion.test.ts` | node:test | normalizers/validators/stubs | real sources (module is dead in prod) |
| `backend/tests/test_eligibility.py` (11) | unittest | strongest suite: outcomes, GPA, rules | divergence guard vs TS (see below) |
| `backend/tests/test_ingestion.py` (10) | unittest | 3 ABC adapters + pipeline | the 7 registry adapters that crash `run_job` (verified) |
| `backend/tests/test_backend.py` (4) | unittest | `collect()` on all 10 | **nothing** imports `main.py` — the API layer is 0% tested |
| `tests/e2e/landing.spec.ts` (4) | Playwright | hero/CTA/nav/detail smoke | explorer/tracker/auth/modals; asserts the "step 2" placeholder |

**P0 correctness risk:** no TS↔PY parity fixture, so divergent verdicts (UK/GER/ECTS/language/unknown-rule)
can't be caught by either suite. This is the single most valuable new test.

## Strategy (target, in build order)

1. **Golden parity table** — one fixture file (profile × rules → normalized score + outcome);
   same rows asserted in TS and Python suites (M2). Where they disagree, product decision +
   single source of truth, tests updated to the chosen truth.
2. **AuthContext unit tests** (M3) — save/unsave/stages/notes, delete-to-zero, demo fallback
   behavior, sign-out reset. Requires mocking Firebase SDK at module boundary (inject test
   config / mock `firebase.ts`).
3. **databaseService branches** — empty-collection→seed, error→fallback, sync validation
   (reject docs missing required fields).
4. **Backend `TestClient` suite** (M6) — all 5 routes incl. validation-failure cases and the
   7-broken-adapters reality (turn their failure into documented behavior or fix the adapters).
5. **E2E journeys** (M5+) — explorer (filter/sort/detail/save for DB-id), tracker (stage change,
   notes), auth (mocked), redirect guard; keeps `reuseExistingServer` off in CI.
6. **Firestore rules tests** (M1 acceptance) — emulator rules test: anonymous cannot write
   catalogue; owner-scoped writes pass; admin-script writes pass.

## Infra hygiene (fix with M-tests)

- Frontend unit tests must not initialize real Firebase (mock module, else offline CI fails).
- `npm test` should aggregate failures, not short-circuit (P3).
- tsconfig: drop ambient `"jest"` types; consider `strict: true` incrementally after fixes.
- `strict` keeps the existing node:test/tsx runtime — no runner change needed.

## Definition of done (per milestone)

`npm run lint` clean · unit suites green · `npm run build` green · `npx playwright test` green ·
no existing test weakened or deleted without a replacement assertion.
