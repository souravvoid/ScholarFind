# Changelog

Notable changes, newest first. This is a curated summary, not a complete reconstruction of
repository history; see `git log` for every commit.

## 2026-11-15 — Django catalogue, auth, deployment, dependency fixes

- **Catalogue on PostgreSQL:** scholarship records and hero images are stored in Django and
  served through `/api/v1/scholarships/`; `seed_catalogue_bundle` imports a 48-record fixture
  generated from the TypeScript source (`0e8df7d`).
- **Firebase removed from the client:** deleted the unused Firebase client and dead code.
  `catalogueService` now reads the paginated API, validates payloads, and falls back to the
  bundled catalogue only when the API is unreachable; empty results, HTTP errors, and detail
  404s are not masked (`db008d0`, `0e8df7d`).
- **Auth:** Django token endpoints wired into the login/signup UI; tokens validated on boot
  and cleared when revoked (`c647837`).
- **Profile identity:** citizenship and residence pinned to India for the supported cohort
  (`c2928d0`).
- **Deployment:** Render web service + PostgreSQL database configuration, `build.sh`, health
  check, and a one-command local runner (`461ef68`, `453c01e`).
- **Security:** guarded the redirect `handleProceed` path and validated image `src` protocol
  before rendering (`5b35b75`).
- **Dependencies:** restored `@testing-library/dom` and aligned esbuild with Vite 8
  (`86ae2a6`, `3400c16`).
- **Documentation:** reconciled README, AGENTS, system architecture, database design, API
  reference, development setup, known issues, and work status with the current code.
- **Verification (local, 2026-11-15):** `npm run lint` clean; 51 frontend unit tests; 11 Vitest
  component tests; 46 backend unittest tests; 10 Playwright tests; production build succeeds
  with a >500 kB chunk warning.

## 2026-11-09 — Auth slice and eligibility parity

- Django register/login/logout/me endpoints plus token-based React auth pages (`c647837`).
- TypeScript and Python eligibility engines aligned through a shared fixture and weighted
  half-up scoring (`d943ad2`, `tests/fixtures/eligibility-parity.json`).

## 2026-11-08 — Design system and page-by-page rebuild

- Applied the Sentry-inspired design system: routed shell, shared `ui/` primitives, lucide
  icons, self-hosted fonts, responsive navigation, and page-level rebuilds for landing,
  explorer, detail, tracker, sources, and profile (`d0aebc2` and Step 0–9 commits).
- M1 catalogue integrity: read-only catalogue rules, no client-side seeding, read-shape
  validation, honest audit flow, and the external-link redirect gate (`afb0fe2`).
- Added Playwright shell/landing/auth smoke tests and accessibility fixes.
- Removed fake stats, testimonial theater, and the fake resume-email flow.

## Earlier

- Django/DRF backend introduced and FastAPI endpoints ported; legacy FastAPI modules remain
  for reference (see [`backend/MIGRATION_REPORT.md`](../backend/MIGRATION_REPORT.md)).
- Initial React/Vite client, static catalogue, eligibility engine, profile builder, tracker,
  and sources page. See `git log` for the full sequence.
