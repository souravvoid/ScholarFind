# Development Setup

This guide covers local development from the repository root. It does not configure a
production service.

## Prerequisites

- Node.js 22 (see [`package.json`](../package.json)).
- Bun 1.4.2, matching [CI](../.github/workflows/ci.yml), or a compatible package manager for
  local-only work.
- Python compatible with [`backend/requirements.txt`](../backend/requirements.txt); CI uses
  Python 3.13.
- PostgreSQL 16 for database-backed Django behavior and tests.
- Chromium for Playwright E2E tests.

## Install

```bash
bun install --frozen-lockfile
python3 -m pip install -r backend/requirements.txt
```

For browser tests, install the Chromium browser once:

```bash
npx playwright install chromium
```

On CI Linux, use `npx playwright install --with-deps chromium`.

## Environment

Two templates are checked in; copy and edit them locally. Do not commit populated environment
files or put server secrets in `VITE_` variables.

| File | Purpose | Key variables |
|---|---|---|
| [`.env.example`](../.env.example) → `.env` | Frontend | `VITE_API_BASE_URL` (empty = same-origin), `VITE_API_PROXY_TARGET` (default `http://127.0.0.1:8000`) |
| [`backend/.env.example`](../backend/.env.example) → `backend/.env` | Django API | `DJANGO_ENV`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL` or `POSTGRES_*`, Google OAuth credentials, DRF throttle rates |

No Firebase configuration is required: the client has no Firebase SDK dependency. Leave the
Google OAuth variables blank to keep those endpoints disabled (they return 503); email/password
authentication works without them.

The frontend auth service defaults its API base URL to same-origin. Keep the Vite `/api` proxy
in development so auth works without widening CORS.

## One-command local run

```bash
cp backend/.env.example backend/.env   # point POSTGRES_* or DATABASE_URL at a disposable DB
./scripts/dev.sh                       # or: npm run dev:all
```

The script:

1. checks Node, Python, Django, and client dependencies;
2. fails early with an actionable message if PostgreSQL is unreachable;
3. applies migrations;
4. imports the bundled catalogue with `seed_catalogue_bundle` (idempotent; skip with `SEED=0`);
5. starts the Django API on `:8000` and Vite on `:3000`.

Override ports with `BACKEND_PORT` and `FRONTEND_PORT`. Without a reachable API, the client
still renders but shows the "Offline catalogue" banner.

## Manual run

```bash
# terminal 1
cd backend && python3 manage.py migrate && python3 manage.py seed_catalogue_bundle
cd backend && python3 manage.py runserver 0.0.0.0:8000

# terminal 2
npm run dev
```

The bundled fixture is generated from the TypeScript source, never hand-edited:

```bash
npx tsx scripts/export-catalogue-bundle.ts   # writes backend/scholarships/fixtures/bundled_catalogue.json
cd backend && python3 manage.py seed_catalogue_bundle
```

## Run and validate

```bash
npm run lint            # tsc --noEmit
npm run test:frontend   # tsx/node unit tests
npm run test:components # Vitest component tests
npm run test:backend    # Django unittest discovery
npm run test:e2e        # Playwright (Chromium)
npm run build
npm test                # frontend + components + backend
```

Point-in-time result on 2026-11-15: lint clean, 51 frontend unit tests, 11 component tests,
46 backend unittest tests, 10 Playwright tests, and a successful production build. Re-run to
confirm; these are local results, not a hosted CI result.

`cd backend && python -m pytest -q` exercises PostgreSQL-backed tests and needs a reachable,
migrated database. Do not point tests at production. See [test report](TEST_REPORT.md) for
what passed and what remained blocked.

## Database setup

The Django project uses PostgreSQL. Configure it through `backend/.env` (see
`backend/.env.example`), then from `backend/` apply migrations:

```bash
python3 manage.py migrate
python3 manage.py seed_catalogue_bundle
```

The seeded catalogue currently contains 48 records plus their rules, documents, and providers.
Use a disposable local database; the committed templates contain placeholders only.
