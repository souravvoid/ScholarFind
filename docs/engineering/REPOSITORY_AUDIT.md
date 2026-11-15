# Repository Audit — ScholarFind

Status: IMPLEMENTED (Django/DRF + PostgreSQL + React/Vite). Last verified 2026-11-15.

## 1. Repository structure

```
ScholarFind/
├── backend/                      Django project (Python)
│   ├── config/                   settings, urls, wsgi/asgi, views, throttles
│   ├── accounts/                 auth + UserProfile
│   ├── students/                 StudentProfile
│   ├── scholarships/             Scholarship + sources/providers/rules/documents/jobs
│   ├── matching/                 ManualReviewFlag, WorkExperienceRecord
│   ├── saved/                    SavedScholarship
│   ├── tracking/                 ApplicationTrackerEntry
│   ├── ingestion/                adapters + pipeline + registry
│   ├── eligibility.py            rule records (dataclasses)
│   ├── eligibility_service.py    DeterministicEligibilityEngine
│   ├── models.py                 legacy SQLite models (NOT used by Django app)
│   ├── schemas.py                legacy Pydantic schemas
│   ├── main.py                   legacy FastAPI app (disconnected)
│   ├── manage.py
│   └── tests/                    pytest integration tests
├── src/                          React 19 + Vite + Tailwind v4 client
│   ├── components/               UI components (ui/* primitives)
│   ├── pages/                    route-level pages
│   ├── services/                 catalogueService (API client + offline fallback)
│   ├── context/                  AuthContext
│   ├── types/                    TS types
│   └── data/                     bundled catalogue (offline fallback)
├── scripts/                      dev.sh, export-catalogue-bundle.ts
├── docs/                         documentation
├── tests/e2e/                    Playwright specs
├── package.json, vite.config.ts, tsconfig.json
└── render.yaml                   Render deployment blueprint
```

## 2. Technology stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind v4, react-router, lucide-react |
| Backend | Python 3.12/3.15, Django 5.x, Django REST Framework, drf throttling |
| Database | PostgreSQL (port 5433 local) |
| Auth | DRF Token + Django session + Google OAuth 2.0 (manual flow) |
| Ingestion | Custom adapters (CSC UK, DAAD DE, Fulbright US) + pipeline |
| Eligibility | Deterministic Python engine (`eligibility_service.py`) |
| Deploy | Render (web) + Neon/Postgres, Gunicorn, WhiteNoise |
| Tests | pytest + Django TestCase, node:test, Playwright (Chromium) |

## 3. Backend architecture

Modular monolith: one Django project, multiple apps, single process.

Apps and responsibilities:

| App | Purpose |
|---|---|
| `accounts` | Registration, login, logout, current user, Google OAuth, `UserProfile` |
| `students` | `StudentProfile` (academic profile) |
| `scholarships` | `Scholarship`, `ScholarshipProvider`, `ScholarshipSource`, `ScholarshipEligibilityRule`, `RequiredDocument`, `IngestionJob` |
| `matching` | `ManualReviewFlag`, `WorkExperienceRecord` |
| `saved` | `SavedScholarship` (user↔scholarship with status) |
| `tracking` | `ApplicationTrackerEntry` |
| `ingestion` | Adapters, pipeline, registry, admin ingest endpoint |

Business logic lives in `eligibility_service.py` (pure function, no DB) and `eligibility.py` (dataclasses). Views are thin: validate → call service → serialize.

## 4. Frontend architecture

- React Router routes (see `docs/SITEMAP.md`).
- `AuthContext` holds auth state + token in localStorage.
- `catalogueService` fetches `/api/v1/scholarships/` with pagination; falls back to bundled records on network/5xx errors.
- `ScholarshipExplorer` filters/sorts client-side over the loaded page set.
- Profile builder pins citizenship/residence to India.

## 5. Database architecture

PostgreSQL relational schema, 13 tables (see `docs/database/ER_DIAGRAM.md`). Foreign keys with cascade deletes. Unique constraints on (`user`,`scholarship`) for saved/tracker. Indexes on `slug`, `title`, `application_deadline`.

## 6. Important dependencies

See `backend/requirements.txt` and `package.json`. Key: Django, djangorestframework, psycopg2, django-cors-headers, whitenoise, gunicorn, requests, pytest, pytest-django.

## 7. Missing functionality

- User-scoped persistence for profile/saved/tracker is partly via DRF viewsets but frontend still uses localStorage for some flows (NOT IMPLEMENTED end-to-end).
- No background task runner (Celery/RQ) — ingestion is synchronous.
- No email verification / password reset.
- No admin UI beyond Django admin.

## 8. Technical debt

- `backend/models.py`, `backend/schemas.py`, `backend/main.py` are legacy FastAPI/SQLAlchemy artifacts kept for reference. Not imported by Django.
- `backend/eligibility.py` and `eligibility_service.py` are at backend root, not inside an app.
- Denormalized comma-separated fields (`destination_countries`, `study_levels`, `fields_of_study`, `coverage_types`, `funding_nature`) instead of M2M.
- No check constraints on floats beyond validators.

## 9. Security observations

- CORS is `*` + credentials in dev (to be tightened).
- Firestore rules (legacy) allow public writes to catalogue collections — critical defect being fixed.
- External URLs gated by `OfficialRedirectModal` (to get https-only + allowlist).
- Auth uses DRF tokens over HTTPS in prod; CSRF cookie for session auth.
- Throttling on auth/evaluate endpoints.

## 10. Deployment readiness

Render blueprint present. Local dev script works. Production requires `DATABASE_URL`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`. Not yet deployed (no credentials/approval).

## 11. Evidence / file references

- `backend/config/settings.py`, `backend/config/urls.py`
- `backend/accounts/*`, `backend/students/*`, `backend/scholarships/*`
- `backend/matching/*`, `backend/saved/*`, `backend/tracking/*`
- `backend/ingestion/*`
- `backend/eligibility_service.py`
- `src/services/catalogueService.ts`, `src/context/AuthContext.tsx`
- `scripts/dev.sh`, `render.yaml`
- `backend/tests/`, `tests/e2e/`
- Git commits: `d0aebc2`, `461ef68`, `c2928d0`, `0e8df7d`, `453c01e`
