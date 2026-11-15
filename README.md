# ScholarFind

ScholarFind is a scholarship discovery and eligibility-support application. Students can
browse opportunities, review criteria and provider sources, explore an advisory match, and
track application work. ScholarFind is independent: it is not a government or provider
portal, does not submit applications, and does not make official eligibility decisions.

> **Project status:** Academic/demo-oriented, not production-ready. Catalogue coverage,
> persistence, backend operations, and data reuse permissions have important limitations.
> Last reviewed: 2026-11-15.
> See the [project status](docs/PROJECT_STATUS.md) and [known issues](docs/KNOWN_ISSUES.md).

## What is implemented

- React 19 + TypeScript + Vite 8 web client with routed discovery, scholarship detail,
  profile wizard, tracker, sources, and login/signup pages (react-router 7, Tailwind v4,
  lucide-react icons).
- Catalogue and source reads from the Django REST API (`/api/v1/scholarships/`,
  `/api/v1/scholarship-sources/`) with client-side response validation and a bundled
  48-record offline fallback (`src/data/scholarshipsData.ts`).
- Django 6 + Django REST Framework backend configured for PostgreSQL 16, covering token
  authentication, scholarships, students, saved items, application tracking, eligibility,
  and ingestion, plus Django admin.
- A management command (`seed_catalogue_bundle`) imports the exported catalogue fixture so
  the API and the offline fallback expose the same records.
- TypeScript and Python eligibility implementations kept aligned by a shared fixture.
- Frontend unit/component tests, backend unittest and pytest suites, Playwright smoke tests,
  and GitHub Actions CI.

The client reads catalogue, source, and auth data from the Django API. Profile, saved, and
tracker state is still held in browser storage rather than the corresponding authenticated
APIs, so it does not sync across devices. See the
[system architecture](docs/SYSTEM_ARCHITECTURE.md).

## Problem and approach

Scholarship opportunities and provider-defined criteria are distributed across different
sources. ScholarFind aims to help students discover opportunities, compare criteria, and
track their own application work, while leaving verification and application decisions with
official providers.

## Current limitations

- PostgreSQL-backed `pytest` runs need an available, migrated test database; CI provisions
  PostgreSQL 16, but a reachable database is still required for local pytest runs.
- When the API is unreachable, the offline fallback shows the bundled 48-record catalogue,
  which may be stale; a slug absent from the bundle resolves to not-found.
- Profile, saved, and tracker data live in browser storage, so accounts do not sync data
  across devices despite the existence of authenticated APIs.
- Income eligibility is not modeled; some catalogue income conditions are currently
  represented as academic-score rules and therefore do not verify income.
- Profile defaults (institution, GPA, target term) are illustrative sample values; users can
  mistake them for verified answers.
- Successful live Google OAuth, the Render deployment, production PostgreSQL operations,
  backups, monitoring, and performance have not been verified.
- Indian scholarship coverage and reuse terms are not established for many candidate sources.
- Eligibility output is advisory and must be confirmed with the official provider.

## Technology

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, react-router 7, lucide-react.
- **Backend:** Python, Django 6, Django REST Framework, PostgreSQL (gunicorn + WhiteNoise in
  production).
- **Testing:** Node test runner/tsx, Vitest, Python unittest/pytest, Playwright.
- **CI:** GitHub Actions (frontend job plus a PostgreSQL-backed Django job).

## Repository map

```text
src/                  React client, services, tests
backend/              Django apps, API, models, migrations, fixtures, tests
scripts/              dev.sh (API + client) and catalogue export tooling
tests/e2e/            Playwright browser tests
docs/                 Project, engineering, data, testing, security, and demo documentation
firestore.rules       Legacy Firebase rules; the client no longer bundles a Firebase SDK
```

`backend/main.py`, `backend/models.py`, and `backend/schemas.py` are legacy FastAPI/SQLAlchemy
artifacts kept for reference; the Django project does not import them.

## Prerequisites

- Node.js 22 and Bun 1.4.2 (matching the CI workflow).
- Python compatible with `backend/requirements.txt` (CI uses 3.13).
- PostgreSQL 16 for database-backed backend behavior and tests.
- Chromium for Playwright.

## Local development

```bash
bun install --frozen-lockfile
python3 -m pip install -r backend/requirements.txt
npm run dev          # client only; shows the offline fallback without an API
```

For an end-to-end local run (Django API + Vite client together), create `backend/.env` from
`backend/.env.example`, point it at a disposable PostgreSQL database, then run:

```bash
cp backend/.env.example backend/.edit  # edit POSTGRES_* / DATABASE_URL
./scripts/dev.sh                       # or: npm run dev:all
```

The script checks PostgreSQL, applies migrations, imports the bundled catalogue
(`seed_catalogue_bundle`), and starts the API on `:8000` plus the client on `:3000`. Override
with `BACKEND_PORT`, `FRONTEND_PORT`, or `SEED=0`. Without the API the client still renders,
but it shows the "Offline catalogue" banner because the proxy cannot reach `/api`.

The bundled catalogue fixture is generated from the TypeScript source, never hand-edited:

```bash
npx tsx scripts/export-catalogue-bundle.ts
cd backend && python3 manage.py seed_catalogue_bundle
```

See [development setup](docs/DEVELOPMENT_SETUP.md) for environment and backend caveats. Do not
use production credentials or real student information in local demos.

## Testing

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

`npm test` runs the frontend unit (`test:frontend`), Vitest component (`test:components`), and
backend unittest (`test:backend`) groups, and returns a failing status if any group fails.
Playwright requires Chromium; the landing spec intercepts `/api/v1/scholarships/**` with a
fixture so smoke tests do not need a running API. Backend pytest paths that exercise
PostgreSQL additionally require a disposable migrated test database.

See the [testing strategy](docs/TESTING_STRATEGY.md) and dated
[test report](docs/TEST_REPORT.md) for actual results and limitations.

## Demo

Use synthetic profiles and clearly marked fixtures only. Do not present synthetic records as
real scholarships or as verified funding information. Follow the [demo guide](docs/DEMO_GUIDE.md).

## Future improvements

Prioritized next steps include moving profile/saved/tracker state onto the authenticated APIs,
a reproducible PostgreSQL test setup, cohort and eligibility data-quality coverage, and
verified deployment operations. See the [implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md).

## Documentation

Start at the [documentation index](docs/DOCUMENTATION_INDEX.md), including the
[architecture](docs/SYSTEM_ARCHITECTURE.md), [API reference](docs/API_DOCUMENTATION.md),
[database design](docs/DATABASE_DESIGN.md), [data and licensing notes](docs/DATA_SOURCES_AND_LICENSING.md),
[security review notes](docs/SECURITY_REVIEW.md), and
[implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md).

## Screenshots

No screenshots are included in this repository documentation pass; add only genuine captures
from a reviewed local/staging build.

## Contributions and license

See the [contribution guide](docs/CONTRIBUTION_GUIDE.md). Team contributions are recorded in
repository history; no individual contribution breakdown was prepared in this audit. No
project license was established by the audit; do not assume permission to redistribute the
code or data.
