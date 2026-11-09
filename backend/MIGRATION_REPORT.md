# Migration Report: FastAPI → Django + DRF

Verified on 2026-11-09 against PostgreSQL 18.3, Django 6.1.3, DRF 3.18.3.

## 1. What was migrated

| Original FastAPI surface | Django implementation | Status |
|---|---|---|
| `GET /api/v1/health` | `config.views.health` | Preserved (same JSON shape, includes DB catalogue count) |
| `GET /api/v1/sources` | `config.views.sources` | Preserved (all 10 registry sources) |
| `POST /api/v1/admin/ingest/{source_id}` | `ingestion.views.admin_ingest` | Preserved + now persists to PostgreSQL |
| `POST /api/v1/evaluate` | `accounts.views.evaluate_compat` | Preserved (body-supplied rules, no DB lookup) |
| Google OAuth login/callback | `accounts.views.google_login/google_callback` | Implemented (needs real credentials to exercise) |
| Session auth | Django sessions | Implemented |
| SQLAlchemy models | Six Django apps | Migrated |
| Deterministic eligibility engine | `eligibility_service.py` | Migrated, parity-tested against the original |

Additional DRF endpoints (new, not in FastAPI):

- `/api/v1/scholarships/` — paginated search envelope (`page`, `page_size`,
  `total_count`, `results`) with `query`, `destination`, `degree_level` filters.
- `/api/v1/eligibility/` and `/api/v1/eligibility/evaluate/` — DB-aware
  evaluation (uses stored rules when `rules` is omitted).
- `/api/v1/student-profiles/`, `/api/v1/user-profiles/`,
  `/api/v1/saved-scholarships/`, `/api/v1/application-tracker-entries/`,
  `/api/v1/manual-review-flags/`, `/api/v1/work-experience-records/` —
  authenticated, per-user viewsets.
- `/api/v1/scholarship-providers/`, `scholarship-sources/`,
  `eligibility-rules/`, `required-documents/`, `ingestion-jobs/` — read-only.
- `/api/auth/token/` — DRF token auth.
- `/api/auth/google/session/`, `/api/auth/google/logout/`.

## 2. Project layout

```
backend/
    manage.py
    config/            settings, root URLs, health/sources views
    accounts/          UserProfile, OAuth, evaluation, token auth
    students/          StudentProfile + GPA normalization
    scholarships/      catalogue models, services, population command
    matching/          ManualReviewFlag, WorkExperienceRecord
    saved/             SavedScholarship (user-owned)
    tracking/          ApplicationTrackerEntry (user-owned)
    ingestion/         adapters, pipeline, registry, admin endpoint
    eligibility_service.py   migrated deterministic engine
    tests/             legacy unit tests + migrated/pytest suites
    requirements.txt
    pytest.ini
    .env.example
```

## 3. Database

- Engine: PostgreSQL 18.3.
- **Dedicated database:** `scholarfind_django` (owner `scholarfind`).
- The pre-existing `scholarfind` database on this host contains unrelated
  Prisma tables (`Application`, `Student`, `Disbursement`, …) with live rows.
  It was **not** modified or dropped. Django does not use it.
- Env overrides: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `POSTGRES_HOST`, `POSTGRES_PORT` (see `backend/.env.example`).
- `rest_framework.authtoken` is installed, so token auth has real tables.

## 4. Data population

The original FastAPI service kept adapter output in **memory**
(`IngestionStorageRepository`); there was no FastAPI database to copy. The
adapter registry is therefore the source of truth.

`python3 manage.py populate_scholarships` runs all 10 verified adapters through
the ingestion pipeline and idempotently upserts into PostgreSQL:

```
src_csc_uk: success fetched=2 created=2 updated=0 errors=0
... (10 sources)
Population complete: created=11 updated=0 catalogue_total=11 sources=10
```

A second run reports `created=0 updated=11`, proving idempotency. Persisted
counts: 11 scholarships, 10 sources, 10 providers, 29 eligibility rules,
47 required documents.

Persistence lives in `scholarships/services.py` and is shared by the management
command and the admin ingestion endpoint. Unknown adapter rule types are stored
as `manual_review` with the original type preserved in `rule_payload`.

## 5. Verification performed

| Check | Command | Result |
|---|---|---|
| Django system check | `python3 manage.py check` | No issues |
| Migration drift | `python3 manage.py makemigrations --check --dry-run` | No changes detected |
| Apply migrations | `python3 manage.py migrate` | All applied |
| Population | `python3 manage.py populate_scholarships` | 11 records, idempotent |
| Pytest (all) | `cd backend && python3 -m pytest -q` | **64 passed** |
| Legacy unittest | `npm run test:backend` | **44 passed** |
| API smoke | `manage.py shell` Django client | health/sources/scholarships/evaluate OK |

Integration tests (PostgreSQL) cover: health, sources, catalogue pagination and
filters, read-only enforcement, both evaluation contracts, token auth, profile
creation with GPA normalization, saved-scholarship privacy/uniqueness,
ingestion authorization + persistence, and OAuth unconfigured paths.

Eligibility tests cover all grading scales, all four outcomes, language
test/waiver paths, degree and field mismatches, work experience, and outcome
parity with the original FastAPI engine.

## 6. Known gaps / remaining work

1. **Live Google OAuth** cannot be exercised without
   `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`; unconfigured paths
   return HTTP 503 and are tested.
2. **CORS** for a browser frontend is not configured. Add `django-cors-headers`
   with an explicit origin allowlist before wiring the React app to this API.
3. **Production hardening** still needed: real `DJANGO_SECRET_KEY`, `DEBUG=False`,
   `SECURE_*` settings, static file serving.
4. The seven lightweight collectors are wrapped by
   `ingestion/registry.py::CollectorAdapter`; their award/deadline data is
   indicative and should be verified against each provider.
5. Frontend still talks to Firebase directly; cut-over is a separate effort.

## 7. Prioritized task list

Status reflects work completed in this session.

### P1 — Critical correctness and security (done unless noted)

| # | Task | Effort | Dependencies | Changes | Tests |
|---|---|---|---|---|---|
| 1.1 | Fix admin ingestion endpoint (`adapter_instance`, DB persistence, staff-only) | 2 h | — | `ingestion/views.py`, `ingestion/registry.py`, `scholarships/services.py` | staff/non-staff, unknown source, persistence |
| 1.2 | Replace stub `/api/v1/health`, `/sources`, `/evaluate` | 2 h | — | `config/views.py`, `config/urls.py`, `accounts/views.py` | contract assertions |
| 1.3 | Add missing viewsets serializers + auth scoping | 2 h | — | `saved/`, `tracking/`, `matching/`, `students/`, `accounts/serializers.py` | auth, privacy, uniqueness |
| 1.4 | Remove duplicate `SavedScholarship` / `ApplicationTrackerEntry` models | 1 h | — | `scholarships/models.py`, `scholarships/migrations/0001_initial.py` | `makemigrations --check` |
| 1.5 | Dedicated working PostgreSQL database + token auth tables | 1 h | PG running | `config/settings.py`, `.env.example` | migrate, smoke |
| 1.6 | Prevent public catalogue writes | 1 h | — | `scholarships/views.py` | 405 on POST |
| 1.7 | Resolve production hosting DB/CORS | 3 h | 1.5 | `settings.py` | deployment smoke — **open** |

### P2 — Eligibility engine coverage (done)

| # | Task | Effort | Dependencies | Changes | Tests |
|---|---|---|---|---|---|
| 2.1 | Port eligibility unit tests to `eligibility_service` | 2 h | — | `tests/test_eligibility_service.py` | scales, outcomes, language, degree, field |
| 2.2 | Parity test vs original engine | 1 h | 2.1 | same | outcome/count/percentage parity |

### P3 — Database-backed integration tests (done)

| # | Task | Effort | Dependencies | Changes | Tests |
|---|---|---|---|---|---|
| 3.1 | pytest-django configuration | 0.5 h | — | `pytest.ini`, `tests/test_api_integration.py` | collection |
| 3.2 | Endpoint integration suite on PostgreSQL | 3 h | 1.x, 3.1 | same | 20+ API tests |
| 3.3 | Keep `npm run test:backend` green | 1 h | 3.2 | import bootstrap in test module | 44 unittest pass |

### P4 — Data population (done)

| # | Task | Effort | Dependencies | Changes | Tests |
|---|---|---|---|---|---|
| 4.1 | Persistence service mapping normalized records → ORM | 3 h | 1.4 | `scholarships/services.py` | idempotency via command |
| 4.2 | `populate_scholarships` command (all 10 sources) | 2 h | 4.1 | `scholarships/management/commands/` | run twice, counts stable |
| 4.3 | Adapter wrapper for lightweight collectors | 2 h | — | `ingestion/registry.py` | all 10 sources execute |

### P5 — Verification and documentation (done)

| # | Task | Effort | Dependencies | Changes | Tests |
|---|---|---|---|---|---|
| 5.1 | Run system check, migration drift, full test suites | 1 h | 1–4 | — | recorded above |
| 5.2 | Update migration report and env example | 1 h | 5.1 | this file, `.env.example`, `requirements.txt` | docs review |
| 5.3 | Frontend lint/build regression check | 1 h | — | none | `npm run lint`, `npm run build` — **open** |

### P6 — OAuth completion (partially blocked)

| # | Task | Effort | Dependencies | Changes | Tests |
|---|---|---|---|---|---|
| 6.1 | OAuth login/callback with `state` validation | 3 h | — | `accounts/views.py` | unconfigured/missing-code paths |
| 6.2 | Session and logout endpoints | 1 h | 6.1 | `accounts/views.py`, `config/urls.py` | anonymous session, logout |
| 6.3 | Live credential verification | 1 h | real Google client | none | manual — **blocked** |

## 8. Commands

```bash
# Start the project-local PostgreSQL cluster
pg_ctl -D ~/.scholarfind_pgdata \
  -o "-k /tmp/opencode/pgsock" -l ~/.scholarfind_pgdata/server.log start

cd backend
python3 manage.py check
python3 manage.py migrate
python3 manage.py populate_scholarships
python3 manage.py runserver 0.0.0.0:8000

# Tests
python3 -m pytest -q                 # 64 passed
cd .. && npm run test:backend        # 44 passed
```
