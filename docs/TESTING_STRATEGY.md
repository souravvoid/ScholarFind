# Testing Strategy

Last audited: 2026-11-15. The repository retains an earlier
[engineering test strategy](engineering/TEST_STRATEGY.md); this document is the current
command and coverage summary.

## Test layers

| Layer | Command | Current role | Important gap |
|---|---|---|---|
| Frontend unit | `npm run test:frontend` | Node test runner for eligibility, services, and ingestion utilities. | Firestore/auth API behavior is mostly mocked; not a live-service test. |
| Frontend components | `npm run test:components` | Vitest + jsdom component behavior. | Does not establish live API or all user journeys. |
| Backend unit/integration via unittest | `npm run test:backend` | `unittest discover -s backend/tests -v`. | Current passing run does not establish that PostgreSQL-backed paths are available in CI. |
| Django/pytest | `cd backend && python3 -m pytest -q` | Alternative database-oriented backend suite. | In the audit environment, PostgreSQL connection/setup errors occurred; see [test report](TEST_REPORT.md). |
| Browser | `npm run test:e2e` | Playwright Chromium smoke tests for routes, auth form behavior, landing and mobile shell. | No full persisted save/tracker journey or successful live auth was verified. |
| Static/type check | `npm run lint` | TypeScript check (`tsc --noEmit`). | Not a runtime test. |
| Production build | `npm run build` | Vite production compilation. | Build success is not deployment readiness. |

## Test requirements for future changes

- Cover registration/login validation, ownership and cross-user isolation.
- Cover profile updates and persisted state across reloads when API integration is added.
- Cover catalogue search/filter, detail lookup for Firestore-only records, save/unsave, and
  tracker state changes.
- Keep shared TypeScript/Python eligibility fixtures and test explanations as well as outcomes.
- Test migration consistency and relational constraints against a disposable local PostgreSQL
  instance.
- Use Firestore emulator rules tests for owner access and denied catalogue writes.
- Keep redirects constrained to approved HTTPS provider destinations and test negative cases.
- Add API contract tests for validation, permissions, error responses, and duplicate handling.
- Do not run destructive tests against production or real student data.

## Reliability

`npm test` invokes every frontend unit, component, and backend unittest suite and reports
failure if any group fails. GitHub Actions separates frontend and backend jobs and includes
lint, build, and Playwright. See [`package.json`](../package.json) and
[`ci.yml`](../.github/workflows/ci.yml).
