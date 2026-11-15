# Development Setup

This guide covers local development from the repository root. It does not configure a
production service.

## Prerequisites

- Node.js 22 (see [`package.json`](../package.json)).
- Bun matching the version pinned in [CI](../.github/workflows/ci.yml), or a compatible
  package manager for local-only work.
- Python compatible with the Django requirements in [`backend/requirements.txt`](../backend/requirements.txt).
- PostgreSQL for database-backed Django/API testing.
- Chromium for Playwright E2E tests.

## Install

```bash
bun install --frozen-lockfile
python3 -m pip install -r backend/requirements.txt
```

For browser tests, install the Playwright browser once:

```bash
npx playwright install chromium
```

On CI Linux, use `npx playwright install --with-deps chromium`.

## Environment

Review the names and placeholders in [`.env.example`](../.env.example) and
[`backend/.env.example`](../backend/.env.example). Do not share or commit populated
environment files. Do not put server secrets in frontend `VITE_` variables. The values were
not inspected as part of this audit.

The frontend auth service defaults its API base URL to same-origin; a separately hosted API
requires an explicitly configured origin/proxy and corresponding server security settings.
Firebase client configuration is also required for live Firestore behavior.

## Run and validate

```bash
npm run dev
npm run lint
npm run test:frontend
npm run test:components
npm run test:backend
npm run test:e2e
npm run build
npm test
```

The backend tests that require persistence need a reachable disposable PostgreSQL database
and applied migrations. Do not point tests at production. See [test report](TEST_REPORT.md)
for what passed in the audit environment and what remained blocked.

## Database setup

The Django project uses PostgreSQL. Configure the database through the supported backend
environment settings in [`backend/.env.example`](../backend/.env.example), then from
`backend/` apply migrations and launch the development server:

```bash
python3 manage.py migrate
python3 manage.py runserver
```

These commands require a disposable local database; they were not run during this
documentation audit, and the environment template was not inspected for secret values.
