# Contributing to ScholarFind

## Development Setup

### Prerequisites

- **Node.js 22 and Bun 1.4.2** (matching the CI workflow)
- **Python 3.13** (compatible with `backend/requirements.txt`)
- **PostgreSQL 16** for database-backed backend behavior and tests
- **Chromium** for Playwright E2E tests

### Local Development

```bash
# 1. Install frontend dependencies
bun install --frozen-lockfile

# 2. Install backend dependencies
python3 -m pip install -r backend/requirements.txt

# 3. Set up environment
cp backend/.env.example backend/.env
# Edit .env to configure DATABASE_URL and other Django settings

# 4. Apply migrations and seed the catalogue
cd backend && python3 manage.py migrate
cd backend && python3 manage.py seed_catalogue_bundle

# 5. Start the development servers
./scripts/dev.sh
# or: npm run dev:all
#   Vite:        http://127.0.0.1:3000
#   Gunicorn:    http://127.0.0.1:8000
#   Admin:       http://127.0.0.1:8000/admin/
```

### Code Style

- **Frontend:** Follow the conventions in `AGENTS.md`. Use Tailwind utilities; reuse classes defined in `src/index.css` (`arc-*`, font utilities) before adding new ones. Keep user-visible strings as plain JSX text (React auto-escapes). Mark decorative icons `aria-hidden`.
- **Backend:** Follow Django PEP 8 / DRF conventions. Use the `_number()` and `_string_list()` helpers in `serializers.py` for input normalization. Keep catalogue mutations on the server side only — the client is read-only.
- **Commits:** `type(scope): imperative summary` (see `git log`).

### Branching Expectations

- Work directly on `main` or feature branches off `main`.
- Small, focused PRs are preferred. Do not widen CORS or add client writes to catalogue data.
- Run `npm run lint` before committing to ensure 0 TypeScript errors.

### Testing Requirements

- Run the full test suite before submitting a PR:
  ```bash
  npm run lint
  npm test          # frontend + components + backend
  npm run test:e2e
  ```
- Backend pytest runs require a reachable, migrated PostgreSQL database.
- Playwright E2E tests must pass with 0 console errors across all 7 routes: `/`, `/explore`, `/login`, `/signup`, `/sources`, `/tracker`, `/profile`.

### Pull Request Expectations

- One agent owns one file at a time; parallelize only reviews/research, not writes.
- Require file:line evidence for every claim; label unverified claims as such.
- Never fabricate deadlines, amounts, or metrics.
- Do not widen CORS, add client writes to Firestore/scholarships/scholarship_sources, or weaken the `OfficialRedirectModal` gate.
- Ensure `npm run lint` is clean and relevant unit suites pass.

### Contribution Workflow

1. Fork the repository and create a feature branch.
2. Make your changes, following the conventions in `AGENTS.md`.
3. Run all verification commands: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
4. Commit with a clear message: `type(scope): imperative summary`.
5. Push and open a Pull Request against the `main` branch.
- The PR will be reviewed for adherence to project conventions, test coverage, and security rules.
- Do not merge a PR that introduces catalogue data from the browser, widens CORS, or removes the `OfficialRedirectModal` guard.
