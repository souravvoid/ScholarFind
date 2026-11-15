# Work Status — ScholarFind

Session log for design/engineering agents. Read this first in a new session.
Companion docs: `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/SYSTEM_ARCHITECTURE.md`,
`docs/DESIGN_BRIEF.md`, `docs/DESIGN_SYSTEM.md`, `docs/SITEMAP.md`, `docs/UX_AUDIT.md`,
`docs/UI_BACKLOG.md`, `docs/engineering/ROADMAP.md`.

## Current phase

**Page plan complete (Steps 0–9). Django/DRF migration, catalogue integration, and the
Django-backed auth slice are committed on `main`.** Firebase was removed from the client:
catalogue and source reads now go to `/api/v1/scholarships/` and
`/api/v1/scholarship-sources/` with a bundled 48-record offline fallback, and auth uses
Django token endpoints. Render + Neon deployment configuration and `scripts/dev.sh` are
checked in.

Next: move profile/saved/tracker state from `localStorage` onto the authenticated APIs, then
verify the PostgreSQL-backed pytest/CI run and a live deployment.

## Recent work (committed)

| When | What | Commit |
|---|---|---|
| 2026-11-15 | Restore `@testing-library/dom`; align esbuild with Vite 8 | `86ae2a6` |
| 2026-11-15 | Guard redirect `handleProceed`; validate image `src` protocol | `5b35b75` |
| 2026-11-15 | Remove unused Firebase client and dead code; catalogue service is API-only | `db008d0` |
| 2026-11-15 | One-command local run (`scripts/dev.sh`, `npm run dev:all`) | `453c01e` |
| 2026-11-15 | Catalogue backed by PostgreSQL records and images; bundled seed command | `0e8df7d` |
| 2026-11-15 | Pin profile identity and residence to India | `c2928d0` |
| 2026-11-15 | Render + Neon deployment configuration | `461ef68` |
| 2026-11-15 | Sentry-inspired design system applied | `d0aebc2` |
| 2026-11-09 | Django token auth wired into login/signup UI | `c647837` |
| 2026-11-08 | Arc-inspired landing/nav/footer + Playwright suite | `ce43c29` |
| 2026-11-08 | **M1 catalogue integrity**: read-only catalogue rules, no client seeding, read-shape validation, honest audit flow, redirect gate | `afb0fe2` |
| 2026-11-08 | Step 0 — router shell, tokens, ui primitives, lucide, self-hosted fonts | Step 0 commit |
| 2026-11-08 | Steps 1–9 — auth/state hardening, landing, explorer, detail, tracker, sources, profile, a11y, full verification | Step commits |
| 2026-11-09 | **M2 eligibility parity**: shared fixture `tests/fixtures/eligibility-parity.json`, weighted half-up score, `needs_review` UI | `d943ad2` |

## Verified local state (2026-11-15)

Re-run before quoting these; they are a point-in-time check, not a CI result.

| Check | Result |
|---|---|
| `npm run lint` (`tsc --noEmit`) | clean |
| `npm run test:frontend` (tsx/node) | 51 tests, 0 failures |
| `npm run test:components` (Vitest) | 11 tests in 2 files, passed |
| `npm run test:backend` (`unittest`) | 46 tests, OK |
| `npm run build` | succeeded; warns that the main chunk is >500 kB |
| `npm run test:e2e` | 10 Playwright tests passed (landing spec mocks `/api/v1/scholarships/**`) |

PostgreSQL-backed `pytest` (`cd backend && python -m pytest -q`) needs a reachable, migrated
database. CI provisions PostgreSQL 16 for it; the local environment may not.

## In progress

1. **Profile/saved/tracker persistence integration** — the SPA still writes
   `scholarfind_profile` and `scholarfind_saved` to `localStorage`; authenticated
   `student-profiles`, `saved-scholarships`, and `application-tracker-entries` APIs exist.
2. **Documentation reconciliation** — older notes under `docs/architecture/`,
   `docs/audit/`, and `docs/engineering/` still describe the pre-Django/Firestore state.
3. **PostgreSQL CI verification** — the workflow is checked in; confirm a green hosted run.

## Blocked / awaiting decisions

| Item | Needs |
|---|---|
| Live Google OAuth verification | Client ID/secret configured through a secret manager; endpoints return 503 without them |
| Render deployment verification | Hosted service, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and database connection confirmed |
| Catalogue licensing / Indian coverage | Provider permissions and reuse terms |
| B-15 default explorer filters | Design decision (risk of empty first paint) |
| B-16 URL routing | Shipped as react-router routes; confirm remaining backlog entries are closed |

## Rules reminder

- DoD: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` green.
- Never delete/weaken tests; never fabricate stats/metrics; no `dangerouslySetInnerHTML`;
  external links only through `OfficialRedirectModal`.
- Catalogue writes only via Django admin or `seed_catalogue_bundle`; the browser is read-only.
- Regenerate the bundled fixture from TS (`npx tsx scripts/export-catalogue-bundle.ts`) rather
  than editing `backend/scholarships/fixtures/bundled_catalogue.json` by hand.
- `tests/e2e/landing.spec.ts` asserts the landing/profile flow — update together with B-09.
