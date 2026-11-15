# Test Report — ScholarFind

Last run: 2026-11-15, branch `feature/django-mvp-deployment`.

## Environment
- Python 3.15, Django dev settings, PostgreSQL on 127.0.0.1:5433.
- Node 22, Vite 8, Playwright Chromium.

## Results

| Suite | Command | Result |
|---|---|---|
| Frontend unit | `npm run test:frontend` | 51 pass, 0 fail |
| Component | `npm run test:components` | 11 pass, 0 fail |
| Backend pytest | `python -m pytest` | 78 pass, 0 fail (38 subtests) |
| E2E Playwright | `npx playwright test` | 10 pass, 0 fail |
| Type check | `npm run lint` | pass |
| Build | `npm run build` | pass |

## Catalogue-specific tests
- `backend/tests/test_catalogue_bundle.py`: 3 pass (import + linking + API serialization).
- `src/services/catalogueService.test.ts`: includes new hero/coverage/funding mapping test.

## Manual browser verification
- `/explore`: thumbnails decode (Unsplash 1200×800, Google 512×279).
- India filter button returns 39 records.
- Detail page hero renders.
- No "Offline catalogue" banner while API is up.

## Known gaps
- Backend tests require a live migrated PostgreSQL; not run in CI here.
- No load/performance tests.
- No security penetration tests.
- Google OAuth not exercised (no client secret configured locally).
