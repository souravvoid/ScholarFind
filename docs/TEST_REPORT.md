# Test Report

Execution date: 2026-11-15. Local run; no live deployment was tested.

## Baseline checks from the documentation audit

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | Passed after regenerating the previously stale `bun.lock` against `package.json`. |
| `npm test` | Passed at that point: 45 frontend unit tests, 11 component tests, and 46 backend unittest tests. |
| `npm run lint` | Passed (`tsc --noEmit`). |
| `npm run build` | Passed. Vite emitted non-fatal config-loader and large-chunk warnings. |
| `CI=true npm run test:e2e` | Passed at that point: 10 Playwright Chromium tests. |
| `git diff --check` | Passed. |

The test aggregator was also exercised with a simulated failure for each child suite: it ran
all three groups and retained a non-zero overall status.

After the owner approved the full-polish scope, the focused matching API suite also passed:
`cd backend && python3 manage.py test --settings=matching.test_settings matching` (**4
tests**). The standard backend unittest suite passed again (**46 tests**) after the matching
schema migration.

## Current catalogue implementation validation

| Command | Result |
|---|---|
| `npm test` | Passed: 50 frontend unit/service tests, component suite, and 46 backend unittest tests. |
| `npm run lint` | Passed (`tsc --noEmit`). |
| `npm run build` | Passed with the non-fatal Vite config-loader and large-chunk warnings above. |
| `npx playwright test tests/e2e/landing.spec.ts` | Passed: 4 Chromium tests, using a mocked catalogue API response. |
| `cd backend && python3 manage.py test --settings=matching.test_settings matching` | Passed: 4 owner-isolation tests using SQLite. |
| `cd backend && python3 manage.py test --settings=scholarships.test_settings scholarships` | Passed: 5 catalogue API tests using SQLite. |
| `git diff --check` | Passed on the current worktree. |

The CI backend job has been updated to provision PostgreSQL and run pytest as well as
unittest. That hosted workflow has not yet run; the local PostgreSQL-blocked pytest result
below still applies to this machine.

## Additional backend runner result

An exploratory `cd backend && python3 -m pytest -q` run reported **46 passed, 29 errors,
99 warnings, and 38 subtests passed**. The errors were PostgreSQL database setup/connection
failures, so database-backed API paths were not verified by that run. This differs from
`npm run test:backend`, which invokes unittest discovery and passed 46 tests; the two results
must not be conflated.

## Environment and limitations

- The Playwright test server is local. The browser test run logged Firestore connection
  failures while the client attempted to reach Cloud Firestore; tests still passed using
  their test/demo paths. No Firestore data mutation was intended.
- No production API, production database, deployed Firestore rules, or Google OAuth flow was
  tested.
- The build warnings are recorded rather than hidden; they did not fail compilation.
- These results are point-in-time evidence, not a guarantee of later CI or deployment status.
