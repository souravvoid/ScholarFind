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

- React + TypeScript + Vite web client with discovery, details, profile, tracker, sources,
  and authentication pages.
- Firebase Firestore catalogue/source reads with static fallback data.
- Django REST Framework backend configured for PostgreSQL, including authentication,
  scholarship, student, saved-item, tracker, eligibility, and ingestion APIs.
- TypeScript and Python eligibility implementations.
- Frontend unit/component tests, backend tests, Playwright smoke tests, and GitHub Actions CI.

The client and backend are not fully integrated end to end: the client reads catalogue data
from Firestore, calls the backend for auth, and stores inspected profile/tracker state in
browser storage. See the [system architecture](docs/SYSTEM_ARCHITECTURE.md).

## Problem and approach

Scholarship opportunities and provider-defined criteria are distributed across different
sources. ScholarFind aims to help students discover opportunities, compare criteria, and
track their own application work, while leaving verification and application decisions with
official providers.

## Current limitations

- PostgreSQL-backed pytest runs need an available, migrated test database; the audit
  environment's pytest run encountered database setup/connection errors.
- Matching record ownership was corrected in the current worktree; the targeted regression
  suite passes, while the updated PostgreSQL CI workflow still awaits a hosted run.
- A Firestore-only catalogue entry may not resolve in the static-backed details page.
- Income eligibility is not modeled; some catalogue income conditions are currently
  represented as academic-score rules and therefore do not verify income.
- Some eligibility defaults and scale descriptions can misrepresent what has been verified.
- Successful live Google OAuth, deployed Firestore rules, production deployment, backups,
  monitoring, and performance have not been verified.
- Indian scholarship coverage and reuse terms are not established for many candidate sources.
- Eligibility output is advisory and must be confirmed with the official provider.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Firebase client SDK.
- **Backend:** Python, Django, Django REST Framework, PostgreSQL.
- **Testing:** Node test runner/tsx, Vitest, Python unittest/pytest, Playwright.
- **CI:** GitHub Actions.

## Repository map

```text
src/                  React client, services, tests
backend/              Django apps, API, models, migrations, tests
tests/e2e/            Playwright browser tests
docs/                 Project, engineering, data, testing, security, and demo documentation
firestore.rules       Checked-in Firestore access rules
```

## Prerequisites

- Node.js 22 and Bun (lockfile version is recorded in the CI workflow).
- Python compatible with `backend/requirements.txt`.
- PostgreSQL for database-backed backend behavior/tests.
- Chromium for Playwright.

## Local development

```bash
bun install --frozen-lockfile
python3 -m pip install -r backend/requirements.txt
npm run dev
```

For an end-to-end local run (Django API + Vite client together), create `backend/.env` from
`backend/.env.example`, point it at a disposable PostgreSQL database, then run:

```bash
cp backend/.env.example backend/.env   # edit POSTGRES_* / DATABASE_URL
./scripts/dev.sh                       # or: npm run dev:all
```

The script checks PostgreSQL, applies migrations, imports the bundled catalogue
(`seed_catalogue_bundle`), and starts the API on `:8000` plus the client on `:3000`. Override
with `BACKEND_PORT`, `FRONTEND_PORT`, or `SEED=0`. Without the API the client still renders,
but it shows the "Offline catalogue" banner because the proxy cannot reach `/api`.

See [development setup](docs/DEVELOPMENT_SETUP.md) for environment and backend caveats. Do not
use production credentials or real student information in local demos.

## Testing

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

`npm test` runs frontend unit, component, and backend unittest groups, and returns a failing
status if any group fails. Playwright requires Chromium. Backend pytest paths that exercise
PostgreSQL additionally require a disposable migrated test database.

See the [testing strategy](docs/TESTING_STRATEGY.md) and dated
[test report](docs/TEST_REPORT.md) for actual results and limitations.

## Demo

Use synthetic profiles and clearly marked fixtures only. Do not present synthetic records as
real scholarships or as verified funding information. Follow the [demo guide](docs/DEMO_GUIDE.md).

## Future improvements

Prioritized next steps include repairing the matching API ownership defect, catalogue/detail
consistency, PostgreSQL-backed test setup, client/API persistence integration, and eligibility
and data-quality coverage. See the [implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md).

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
