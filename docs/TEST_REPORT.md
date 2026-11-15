# Test Report

Execution date: 2026-11-15. Local run; no live deployment was tested. Commands were run from
the repository root after the Django catalogue/auth work landed.

## Current local results

| Command | Result |
|---|---|
| `npm run lint` (`tsc --noEmit`) | Passed, no diagnostics. |
| `npm run test:frontend` (tsx/node) | Passed: **51 tests**, 0 failures. |
| `npm run test:components` (Vitest) | Passed: **11 tests** in 2 files. |
| `npm run test:backend` (`unittest discover`) | Passed: **46 tests**, OK. |
| `npm run test:e2e` (Playwright, Chromium) | Passed: **10 tests** in 8.3s. |
| `npm run build` | Passed. Vite warns that the main JS chunk is 563 kB (>500 kB); non-fatal. |
| `npm test` aggregator | Not re-run in this pass; it invokes the three suites above and returns non-zero if any fails. |

Notes:

- The landing E2E spec intercepts `/api/v1/scholarships/**` with a fixture, so browser smoke
  tests do not require a running API or database.
- The frontend unit suite is HTTP-mocked; it validates mapping, pagination, offline fallback,
  and error/404 behavior rather than a live service.
- The backend unittest suite runs app API tests under SQLite test settings and does not
  exercise PostgreSQL-specific behavior.

## Not run in this pass

- `cd backend && python3 -m pytest -q` — requires a reachable, migrated PostgreSQL database.
  CI provisions PostgreSQL 16 for this job, but no hosted run was confirmed here.
- Live Google OAuth, the Render deployment, production database operations, backups, and
  monitoring — no credentials or deployed services were used.

An earlier audit run recorded `46 passed, 29 errors` for pytest because of PostgreSQL
setup/connection failures. That result must not be conflated with the unittest suite above;
the two runners use different settings.

## Earlier baseline (documentation audit)

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | Passed after regenerating the previously stale `bun.lock`. |
| `npm run lint` | Passed. |
| `npm run build` | Passed with config-loader and large-chunk warnings. |
| `CI=true npm run test:e2e` | Passed: 10 Chromium tests. |
| `git diff --check` | Passed. |

The aggregator was also exercised with a simulated failure per child suite; it ran all three
groups and retained a non-zero overall status.

## Environment and limitations

- These results are point-in-time evidence, not a guarantee of later CI or deployment status.
- No production API, production database, or Google OAuth flow was tested.
- Build warnings are recorded rather than hidden; they did not fail compilation.
