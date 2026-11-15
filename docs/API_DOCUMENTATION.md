# API Documentation

Last audited: 2026-11-15. This documents the Django API surface present in source; it does not
assert that a deployed server is reachable. Route registration is in
[`backend/config/urls.py`](../backend/config/urls.py); request/response behavior is defined
in the linked views and serializers.

## Router-backed endpoints

The following router endpoints are registered under `/api/v1/`; detail lookup uses the
viewset's configured key (scholarships use their canonical slug; most others use a primary key).

| Capability | Registered implementation | Access / notes |
|---|---|---|
| Catalogue and ingestion records | `/api/v1/scholarship-providers/`, `/api/v1/scholarship-sources/`, `/api/v1/scholarships/`, `/api/v1/eligibility-rules/`, `/api/v1/required-documents/`, `/api/v1/ingestion-jobs/` | `ScholarshipProvider`, `ScholarshipSource`, `Scholarship`, `ScholarshipEligibilityRule`, `RequiredDocument`, `IngestionJob`; scholarship and source reads are public/read-only. Scholarship list/detail use typed serializers; scholarship detail is retrieved by slug. |
| User and student profiles | `/api/v1/user-profiles/`, `/api/v1/student-profiles/` | `UserProfile`, `StudentProfile`; authenticated and user-scoped. |
| Saved scholarships | `/api/v1/saved-scholarships/` | `SavedScholarship`; authenticated owner-scoped CRUD; duplicate user/scholarship pairs are rejected. |
| Application tracking | `/api/v1/application-tracker-entries/` | `ApplicationTrackerEntry`; authenticated owner-scoped CRUD. |
| Matching review/work experience | `/api/v1/manual-review-flags/`, `/api/v1/work-experience-records/` | `ManualReviewFlag`, `WorkExperienceRecord`; authenticated and owner-scoped. `student`, review state, and verification fields are assigned server-side; requests need an existing `StudentProfile` (400 otherwise). |

## Explicit endpoints

| Method and path | Purpose / access |
|---|---|
| `GET /api/v1/health/` | Health endpoint. |
| `GET /api/v1/sources/` | Public source metadata. |
| `POST /api/v1/evaluate/`, `/api/v1/eligibility/`, `/api/v1/eligibility/evaluate/` | Eligibility evaluation. Supports request-supplied or DB-backed rules; the user's stored profile is not loaded for evaluation. |
| `POST /api/v1/admin/ingest/<source_id>/` | Staff-only ingestion trigger. |
| `/api/auth/register/`, `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/me/`, `/api/auth/token/`, `/api/auth/csrf/` | Email/password authentication and CSRF/token support. |
| `/api/auth/google/login/`, `/api/auth/google/callback/`, `/api/auth/google/session/`, `/api/auth/google/logout/` | Google OAuth; requires credentials and provider configuration. A successful configured flow was not verified. |

## Frontend integration

The frontend uses Django for paginated catalogue and source-registry reads, slug-based
scholarship detail, and email/password authentication. Bundled catalogue/source metadata is
used only when the API cannot be reached; API empty results, HTTP errors, and detail 404s are
not converted into successful static responses. Profile, saved-item, and tracker data remain
browser-local; they are not yet integrated with the corresponding authenticated APIs.

## Errors and validation

Serializers perform request validation and view permissions apply per endpoint. Scholarship
summary/detail, canonical-slug lookup, and rule-payload behavior have SQLite-backed API tests.
The production PostgreSQL service and hosted CI workflow were not available for verification.
Never use this document as evidence that production endpoints are available.

## Source references

- [`backend/config/urls.py`](../backend/config/urls.py)
- [`backend/accounts/models.py`](../backend/accounts/models.py)
- [`backend/accounts/serializers.py`](../backend/accounts/serializers.py)
- [`backend/accounts/views.py`](../backend/accounts/views.py)
- [`backend/scholarships/models.py`](../backend/scholarships/models.py)
- [`backend/scholarships/views.py`](../backend/scholarships/views.py)
- [`backend/students/models.py`](../backend/students/models.py)
- [`backend/students/views.py`](../backend/students/views.py)
- [`backend/matching/models.py`](../backend/matching/models.py)
- [`backend/saved/views.py`](../backend/saved/views.py)
- [`backend/saved/models.py`](../backend/saved/models.py)
- [`backend/tracking/views.py`](../backend/tracking/views.py)
- [`backend/tracking/models.py`](../backend/tracking/models.py)
