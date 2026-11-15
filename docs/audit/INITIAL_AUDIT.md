# ScholarFind Initial Audit

Audit date: 2026-11-15

## Scope and evidence

This is a repository and local-test audit only. No source code was changed as part of
the audit. The worktree was clean at the start, on branch
`agents/full-stack-testing-success` at commit `9cc10b7`. The project owner reports that
the frontend is deployed and the backend is not; no public deployment URL was supplied
or independently probed. No credentials or local environment values were inspected.

Evidence comes from the current source, Django migrations, CI configuration, repository
deployment-file search, and the commands listed under [Verification](#verification).
Existing documentation was used as context but not treated as proof where source or a
fresh test run was available.

## Current architecture

- **Frontend:** React, TypeScript, Vite, Tailwind. It contains routed landing, explore,
  tracker, sources, scholarship detail, login/signup, and profile-builder UI
  (`src/App.tsx`).
- **Backend:** Django + Django REST Framework, exposed through `backend/config/wsgi.py`
  and `backend/config/urls.py`. Apps include accounts, students, scholarships, matching,
  saved, and tracking. PostgreSQL is the configured ORM database
  (`backend/config/settings.py`).
- **Legacy backend code:** `backend/main.py` still contains an optional FastAPI app and
  wildcard CORS configuration. It is not the Django WSGI entry point and FastAPI is not
  listed in `backend/requirements.txt`; treat it as legacy and do not deploy it.
- **Frontend/backend connection:** Auth and catalogue services call Django paths. Both
  use `VITE_API_BASE_URL`, which defaults to an empty string. Vite proxies `/api` to
  localhost:8000 only in development/preview (`vite.config.ts`). The frontend-only
  production host therefore needs an explicit API origin or a same-origin backend
  proxy.
- **Other data stores:** Firebase is still configured in the frontend and Firestore
  rules remain in the repository. The frontend's inspected profile and saved/tracker
  state is persisted in browser `localStorage`; no synchronization to the Django APIs
  was found in `src/context/AuthContext.tsx`.
- **Deployment:** No Render descriptor, Procfile, Dockerfile, build script, `pyproject.toml`,
  or `uv.lock` was found. The frontend has Vite scripts; the backend requirements do not
  include Gunicorn or a `DATABASE_URL` parser.

## Functional status

| Feature | Status | Evidence and gap |
|---|---|---|
| Routed frontend pages and responsive shell | COMPLETE | Landing, explore, tracker, sources, detail, auth, and fallback routes exist; the full persistent end-to-end workflow is assessed separately below. |
| Email/password registration and login | PARTIALLY COMPLETE | Django endpoints and frontend requests exist (`backend/config/urls.py`; `src/services/authService.ts`). Existing E2E checks form links and local validation, not a successful backend login. |
| Logout and token validation | PARTIALLY COMPLETE | The frontend validates a stored token and can revoke it through Django (`src/context/AuthContext.tsx`; `backend/accounts/views.py`). Runtime behavior against a deployed API is unverified. |
| Google sign-in | BLOCKED | OAuth handlers exist, but credentials are optional and live OAuth was not tested (`backend/config/settings.py`; `backend/accounts/views.py`). |
| Student profile CRUD | PARTIALLY COMPLETE | An authenticated, user-scoped Django `StudentProfileViewSet` exists. The SPA `updateProfile` only updates local React state, which is persisted to `localStorage`; it does not call that API. |
| Scholarship discovery/search/details | PARTIALLY COMPLETE | Public, read-only Django catalogue endpoints and SPA list/detail requests exist. Bundled records are available when the list request fails, but a detail HTTP 404 is treated as not-found and does not use the bundled detail fallback (`src/services/catalogueService.ts`). There is no backend deployment per owner report. |
| Eligibility explanation | PARTIALLY COMPLETE | Deterministic TypeScript and Python engines and API endpoints exist. The Django evaluation endpoint builds its profile from the request body and allows anonymous requests; it does not load the authenticated user's stored profile (`backend/accounts/views.py`). Cross-engine semantics still need ongoing parity verification. |
| Save/unsave scholarship | PARTIALLY COMPLETE | An authenticated, owner-scoped Django API and unique user/scholarship constraint exist. The SPA save/unsave methods update local state only (`src/context/AuthContext.tsx`; `backend/saved/`). |
| Application tracking | PARTIALLY COMPLETE | An authenticated, owner-scoped Django tracker API and model exist. The SPA tracker updates browser-local state only (`src/context/AuthContext.tsx`; `backend/tracking/`). |
| Scholarship catalogue ingestion | PARTIALLY COMPLETE | Staff-only ingestion API, adapters, and persistence service exist (`backend/ingestion/`; `backend/scholarships/services.py`). Source licensing, freshness, and the complete collector behavior remain to be verified. |
| PostgreSQL persistence | PARTIALLY COMPLETE | Django models and migrations exist, but the local PostgreSQL server was unreachable and no deployed database was verified. |
| Frontend/backend end-to-end journey | BLOCKED | No deployed backend was verified; browser tests logged refused connections to the local backend proxy. Existing browser tests do not establish persistent account/profile/save/tracker behavior. |
| Render/Neon deployment setup | NOT IMPLEMENTED | No Render service configuration, production WSGI server dependency, `DATABASE_URL` support, or checked-in build/start procedure was found. |
| Production health, CORS, and persistence verification | NEEDS VERIFICATION | No deployed API/database endpoint was available for health, browser-origin, migration, or persistence checks. |

## Database and data-model findings

The schema is a real Django relational model rather than a greenfield schema: `StudentProfile`
and `UserProfile` each have a one-to-one user relation; scholarships reference providers
and sources; eligibility rules and required documents are one-to-many children; saved items
and tracker entries reference both a user and scholarship; matching records reference student
profiles and scholarships. Migrations exist under each app.

Items that need design or verification before calling the database design complete:

1. `destination_countries`, `study_levels`, and `fields_of_study` are text fields in
   `Scholarship`; `faculty_tags`, target-degree/region/country lists, and completed
   documents are also stored as text. `application_instructions` uses JSON. The schema
   therefore has denormalized/list-like fields rather than normalized category or join
   tables.
2. Both `UserProfile` and `StudentProfile` hold some identity/location data. The intended
   ownership boundary and duplicate-field policy are undocumented.
3. Saved-scholarship and tracker models overlap in status/user/scholarship data. Decide
   whether they represent distinct concepts or duplicate application state.
4. Models define provider/source foreign keys and user/scholarship uniqueness. GPA bounds
   are represented by validators in the model, but the inspected model does not declare a
   database `CheckConstraint`; serializer-level validation alone is not a database
   invariant.
5. Scholarship eligibility rule payload is a `TextField`, parsed as JSON by the
   evaluator. Malformed stored values are silently replaced with an empty object in that
   code path; ingestion and validation behavior should be reviewed before relying on it.
6. Foreign-key deletion policies include cascading from provider/source to scholarships.
   The data-retention consequences for deleting a source/provider need explicit review.
7. Indexes and query plans have not been comprehensively inventoried. Migrations were
   checked for model drift, but migration application against PostgreSQL could not be
   verified.
8. No `Institution` or `ScholarshipCategory` model was found. Add such entities only if
   approved requirements need them, not to make the schema appear more complex.

Existing database documentation includes `docs/DATABASE_DESIGN.md` and
`docs/DATA_DICTIONARY.md`. The requested `docs/database/ER_DIAGRAM.md`,
`SCHEMA_DESIGN.md`, `NORMALIZATION.md`, and `INDEXING_AND_QUERY_DESIGN.md` do not exist.
Normalization, functional dependencies, actual SQL/query plans, and the Mermaid ER diagram
therefore remain undocumented to the requested level.

## Deployment blockers and security review

### Blocking the reported frontend-only deployment

1. With an empty `VITE_API_BASE_URL`, production API calls resolve against the frontend's
   own origin. The Vite proxy in `vite.config.ts` is a development/preview server feature,
   not a deployed backend.
2. The catalogue list now falls back on HTTP and invalid responses, so the bundled records
   can render even when the API returns 404. That does not make the backend functional:
   signup/login still require the API; profile, save, and tracker operations are local-only;
   and a detail-page API 404 currently renders as a missing record rather than using the
   bundled detail data.
3. Django has no configured CORS middleware or allowed-origin setting. A separate Render
   API and existing frontend host needs an explicit, reviewed cross-origin policy or a
   same-origin proxy. Do not copy the wildcard CORS setup in the legacy FastAPI module.

### Production readiness and security concerns

- Django production mode requires `DJANGO_SECRET_KEY` and disallows `DEBUG=True`, and it
  enables HTTPS/security-cookie settings. `ALLOWED_HOSTS` defaults to localhost and must
  be configured for a public host.
- Database configuration currently uses separate `POSTGRES_*` environment variables,
  not `DATABASE_URL`. Render/Neon connection-string handling, TLS options, and connection
  lifecycle settings are not implemented or tested.
- `backend/requirements.txt` pins Django/DRF and testing dependencies but omits a
  production WSGI server such as Gunicorn. No static-file serving/deployment configuration
  such as WhiteNoise was found.
- Django REST's global default permission is `AllowAny`; individual write/data viewsets
  must continue to override it. The inspected student, saved, and tracker viewsets scope
  querysets to the authenticated user; catalogue viewsets are read-only.
- DRF tokens are stored in browser `localStorage` by the SPA. Review token lifetime,
  XSS exposure, revocation policy, and whether a secure cookie/session architecture is
  preferable before production use.
- Google OAuth requires environment configuration and needs deployed redirect URI,
  cookie, CSRF, and cross-origin behavior verified.
- The legacy `backend/main.py` contains a FastAPI wildcard-origin/credentials CORS setup.
  It is not the configured Django WSGI application, but leaving two backend entrypoints
  can cause accidental deployment of the wrong service.
- The checked-in `.env.example` contains placeholders rather than live credentials. No
  secret values were read. No conclusion about production secret-manager configuration
  can be made from repository contents.
- Logging, retention, backup/recovery, alerting, rate-limit cache behavior, and incident
  response are not verified for a live deployment.

## Documentation and delivery gaps

- Existing project, API, database, deployment, test, and demo documentation exists, but
  some older architecture notes predate the Django migration. Prefer source and recent
  test evidence, and reconcile stale notes as implementation changes.
- Requested artifacts absent at audit time: `docs/system-design/HLD.md`,
  `docs/system-design/LLD.md`, the `docs/database/` design set, the `docs/testing/`
  acceptance set, and `docs/demo/PROFESSOR_DEMO_GUIDE.md`.
- Existing `docs/DEMO_GUIDE.md`, `docs/TESTING_STRATEGY.md`, and `docs/TEST_REPORT.md`
  provide partial related material but do not by themselves prove the complete deployed
  workflow.
- No three-profile synthetic demo verification against a deployed PostgreSQL-backed
  application was performed.

## Verification

Executed locally on 2026-11-15:

| Command | Result |
|---|---|
| `npm test` | PASS: frontend/service tests 50/50, component tests 11/11, backend unittest suite 46/46. |
| `npm run lint` | PASS (`tsc --noEmit`). |
| `npm run build` | PASS; Vite reported non-fatal config-loader and bundle-size warnings. |
| `npx playwright test` | PASS: 10 Chromium tests. The run logged `/api` proxy connection refusals to `127.0.0.1:8000`; it did not verify a live backend. |
| `cd backend && python3 manage.py check` | PASS: no issues identified. |
| `cd backend && python3 manage.py makemigrations --check --dry-run` | PASS: no model changes detected; emitted a warning that migration-history consistency could not be checked because PostgreSQL at `127.0.0.1:5432` refused the connection. |
| `cd backend && python3 -m pytest -q` | BLOCKED: 46 passed, 29 setup errors, and 38 subtests passed; API/auth database-backed tests could not connect to PostgreSQL at `127.0.0.1:5432`. This is not a pass for those 29 cases. |
| Repository deployment-file search | No Render descriptor, Procfile, Dockerfile, Compose file, `pyproject.toml`, `uv.lock`, or backend build script found. |

No live frontend/backend/database, migration application, CORS, authentication, persistence,
backup, or deployment behavior was tested.

## Prioritized MVP gaps

1. **P0 — Host and connect Django/PostgreSQL.** Configure a production backend entrypoint,
   PostgreSQL connection, secret environment, allowed hosts, and a narrow frontend/API
   origin policy. Verify health and migrations on a disposable/staging database first.
2. **P0 — Connect core frontend user data to Django.** Wire profile, saved-scholarship,
   and tracker read/write paths to owner-scoped APIs, including load/error/empty states.
   Avoid an unreviewed dual-store sync.
3. **P1 — Close frontend-only failure paths.** Configure `VITE_API_BASE_URL` for the
   deployed backend; decide and test detail-page fallback, and test auth failure clearly.
4. **P1 — Verify PostgreSQL test suite.** Provide a disposable CI/local PostgreSQL service,
   run migrations, and require the database-backed Django/API tests to pass.
5. **P1 — Finalize data model invariants.** Decide normalization and duplicate profile/
   tracker representations; add DB constraints only where justified and migrate safely.
6. **P2 — Complete evidence-based HLD, LLD, DBMS, and professor demo docs.** Document only
   implemented behavior; label proposed work separately and include real test evidence.

## Audit conclusion

The codebase already contains substantial React and Django/DRF implementation, relational
models/migrations, automated tests, and source documentation. It is **not yet a complete,
deployed full-stack MVP**: the owner-reported deployment currently has no backend, the
frontend does not persist profile/save/tracker state through its Django APIs, and
PostgreSQL-backed test/deployment behavior remains unverified. The next safe step is to
approve a bounded P0 implementation slice after reviewing these findings; this audit did
not make backend or frontend implementation changes.
