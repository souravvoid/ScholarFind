# Backend Framework Evaluation — ScholarFind

## Executive Summary

**Recommended: Option 1 — Django + Django REST Framework + PostgreSQL**

The existing FastAPI implementation is functional and well-structured, but **Django + Django REST Framework offers clear advantages** for ScholarFind's specific requirements. The migration cost is moderate but the long-term benefits in admin, authentication, and maintenance outweigh the transition effort.

## 1. Comparative Analysis

### A. Django

| Factor | Assessment | Details |
|--------|-----------|---------|
| **Development Speed** | ⭐⭐⭐⭐ | Admin interface out-of-the-box; ORM is expressive; built-in auth reduces custom work |
| **Security** | ⭐⭐⭐⭐⭐ | Mature security patterns; permission system; CSRF protection built-in; proven at scale |
| **Maintainability** | ⭐⭐⭐⭐⭐ | Single framework philosophy; one team handles all concerns; excellent docs |
| **Authentication Complexity** | ⭐⭐⭐⭐⭐ | Django Auth ecosystem; Google OAuth via `allauth` or simple backends; session-based is simpler than JWT |
| **Admin Dashboard** | ⭐⭐⭐⭐⭐ | Automatic admin UI; manage scholarship records, users, ingestion pipelines without custom UI |
| **Testing** | ⭐⭐⭐⭐ | `pytest` integration; `pytest-django`; test client; ORM makes fixture creation easy |
| **Deployment Complexity** | ⭐⭐⭐⭐ | `manage.py runserver`; `gunicorn`; `whitenoise` for static files; one-process deployment |
| **Performance for Expected Workload** | ⭐⭐⭐⭐ | More than adequate for scholarship discovery app; cache framework; CDN for static files |
| **Ease of Development for Student Team** | ⭐⭐⭐⭐⭐ | One framework for everything; less context-switching; built-in admin is a huge productivity boost |

### B. FastAPI (Current Implementation)

| Factor | Assessment | Details |
|--------|-----------|---------|
| **Development Speed** | ⭐⭐⭐⭐ | Fast to write endpoints; Pydantic validation reduces boilerplate |
| **Security** | ⭐⭐⭐⭐ | Modern security; OAuth2/PKCE support; but need to build admin, auth flows from scratch |
| **Maintainability** | ⭐⭐⭐⭐ | Single language (Python); good type safety; but need to build all supporting infrastructure |
| **Authentication Complexity** | ⭐⭐⭐ | OAuth2/PKCE works; but need to build token refresh, session management, user profiles |
| **Admin Dashboard** | ⭐⭐ | Need to build custom admin; scholarship records, user management, ingestion tracking |
| **Testing** | ⭐⭐⭐⭐ | `pytest` integration; `httpx` test client; good type support |
| **Deployment Complexity** | ⭐⭐⭐ | `uvicorn` + `gunicorn`; more moving parts; separate static file serving |
| **Performance for Expected Workload** | ⭐⭐⭐⭐ | More than adequate; async endpoints help, but project doesn't need async heavily |
| **Ease of Development for Student Team** | ⭐⭐⭐ | Multiple frameworks to keep in mind (FastAPI + Pydantic + SQLAlchemy + Alembic); more context-switching |

### C. Three Practical Architectures

| Architecture | Rating | Key Pros | Key Cons |
|-------------|--------|----------|----------|
| **Option 1: Django + Django REST Framework + PostgreSQL** | ⭐⭐⭐⭐⭐ | - Automatic admin UI<br>- Built-in auth + permissions<br>- ORM with rich queries<br>- One framework for everything<br>- Migrations built-in<br>- Excellent for student teams | - ORM can be less performant than raw SQL for complex queries<br>- Async support added in Django 3.1+ (still evolving)<br>- Slightly heavier than minimal FastAPI setup |
| **Option 2: FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL** | ⭐⭐⭐ | - Async support natively<br>- Modern Python experience<br>- Automatic OpenAPI docs<br>- Fine-grained control<br>- Good for API-first projects | - Need to build admin from scratch<br>- Auth flows need custom implementation<br>- Migrations via Alembic (extra setup)<br>- More frameworks to maintain<br>- Admin dashboard = significant development time |
| **Option 3: Django + FastAPI split** | ⭐⭐⭐ | - Django admin for data management<br>- FastAPI for specific API needs<br>- Can leverage strengths of both | - Two frameworks to maintain<br>- Authentication coordination complexity<br>- Database connection management across services<br>- Deployment complexity increases<br>- Not recommended unless genuine technical requirement exists |

## 2. Detailed Comparison

### A. Authentication & Authorization

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Built-in auth system** | ✅ Yes — User model, groups, permissions, password management | ❌ None — must implement or use OAuth2 library |
| **Google OAuth integration** | ✅ Easy via `allauth` or custom backend | ✅ Possible with OAuth2/PKCE, more setup required |
| **Session vs JWT** | ✅ Session-based (default) — simpler for web apps | ✅ JWT-first — more suitable for SPA/mobile apps |
| **Permission system** | ✅ Built-in granular permissions | ❌ Must build or use third-party library |
| **Password management** | ✅ Built-in (hashing, reset, policy) | ❌ Must implement or integrate |
| **Complexity for this project** | Low — Google Sign-In is the primary auth method | Medium — need to implement OAuth2 flow, token management |

### B. Admin Dashboard

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Automatic admin UI** | ✅ Yes — instantly manage models | ❌ None — must build custom |
| **Scholarship record management** | ✅ One-line register in admin | ❌ Build custom UI (forms, lists, filters, actions) |
| **User management** | ✅ Built-in | ❌ Must build |
| **Ingestion pipeline status** | ✅ Register adapter models, view status | ❌ Build custom UI |
| **Time to functional admin** | ⏱ Minutes | ⏱ Weeks |

### C. Database Migrations

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Migration system** | ✅ `manage.py makemigrate` + `migrate` — built-in, Django ORM | ❌ `alembic` — separate tool, separate config |
| **Schema evolution** | ✅ Versioned, squashable, reversible | ⏱ Requires Alembic setup and maintenance |
| **Data backfills** | ✅ Django shell + ORM queries | ⏱ Custom SQL or ORM scripts |
| **Zero-downtime renames** | ✅ `AlterField` + `RenameField` support | ⏱ Alembic custom migrations |

### C. API Development

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Built-in API layer** | ✅ Django REST Framework (included in eval) | ✅ Native — automatic request validation, serialization |
| **Serializer speed** | ⏱ Slightly more verbose than Pydantic | ✅ Pydantic is concise and validated |
| **OpenAPI docs** | ✅ DRF built-in (slightly different format) | ✅ Automatic — FastAPI's flagship feature |
| **Validation** | ✅ Built-in field validation | ✅ Pydantic — type-safe, concise |
| **Custom auth in endpoints** | ✅ `APIView` + permission classes | ✅ `Depends` + security utilities |
| **Time to API endpoint** | ⏱ 15-30 min with DRF | ⏱ 5-10 min with FastAPI |

### D. Testing

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Test client** | ✅ `pytest` + `pytest-django` test client | ✅ `pytest` + `httpx` test client |
| **ORM fixtures** | ✅ `model_bakery`, `factory-boy`, or Django fixtures | ⏱ Custom fixtures or SQLAlchemy models |
| **Database isolation** | ✅ `transaction.testcase` or `override_settings` | ✅ `pytest` transaction management |
| **Speed** | ⏱ Slightly slower (DB setup overhead) | ✅ Faster (no Django setup required) |
| **Coverage** | ✅ Comprehensive tests possible | ✅ Comprehensive tests possible |

### D. Performance

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Request latency** | ⏱ 10-50ms typical | ⏱ 5-20ms typical |
| **Throughput** | ⏱ 1000+ req/s easily adequate | ⏱ 2000+ req/s easily adequate |
| **Async support** | ✅ Django 3.1+ (sync by default, async optional) | ✅ Native async |
| **Background tasks** | ✅ `celery`, `django-q` | ✅ `celery`, `httpx` async |
| **Caching** | ✅ `django-cache`, `locmem`, `redis` | ✅ `redis`, `memcached`, third-party |
| **Project workload needs** | Scholorship app: ~10-100 req/s, no real-time requirements | More than adequate either way |

### E. Project Structure & Maintainability

| Aspect | Django | FastAPI |
|--------|--------|---------|
| **Number of frameworks** | 1 (Django includes everything) | 3+ (FastAPI + Pydantic + SQLAlchemy + Alembic) |
| **Learning curve** | Moderate — one one framework | Moderate — multiple concepts |
| **Onboarding new devs** | ✅ One framework, excellent docs | ❌ Multiple frameworks, docs spread out |
| **Code organization** | ✅ App-based structure | ✅ Route-based + models + schemas |
| **Long-term maintenance** | ✅ Single framework evolves together | ❌ Multiple frameworks may diverge |

## 3. Recommendation: Option 1 — Django + Django REST Framework

### Why Django Is the Clear Advantage

1. **Admin dashboard is decisive** — ScholarFind needs to manage scholarship records, user profiles, ingestion pipeline status, and application tracking. Django admin provides this immediately; FastAPI would require building from scratch (2-3 weeks of development).

2. **Authentication simplicity** — The project uses Google Sign-In. Django's auth ecosystem handles this effortlessly via `allauth` or a custom backend. FastAPI requires implementing OAuth2/PKCE from scratch, including token refresh, session management, and user profile handling.

3. **Single framework advantage** — The project already has significant complexity (10 ingestion adapters, eligibility engine, Firebase integration). Using one framework reduces context-switching and cognitive load for the student team.

4. **Built-in security** — Django provides CSRF protection, XSS mitigation, SQL injection prevention (via ORM), clickjacking protection, and more out-of-the-box. FastAPI requires conscious security decisions for each.

5. **Migrations are seamless** — Django's migration system is battle-tested and requires no separate tooling. FastAPI + SQLAlchemy + Alembic adds an extra tool and config file to maintain.

6. **One team can build the full stack** — From API to admin to database migrations, one person can work across the entire stack without switching framework contexts.

### Migration Cost

If migrating from FastAPI to Django:

| Cost Item | Estimate |
|-----------|----------|
| **API endpoint conversion** | 2-3 days — DRF serializers vs FastAPI endpoints |
| **Auth migration** | 2-3 days — Google OAuth setup + Django auth integration |
| **Admin UI** | 1 week — build custom forms/views OR use Django admin (1 day to configure) |
| **Migration scripts** | 2-3 days — Alembic → Django migrations |
| **URL routing** | 1 day — FastAPI paths → DRF paths |
| **Total estimated effort** | **1-2 weeks** |

### Migration Path

1. **Phase 1** (1 week): Set up Django project, configure PostgreSQL, install Django REST Framework
2. **Phase 2** (3-4 days): Migrate existing FastAPI endpoints to DRF viewsets/serializers
3. **Phase 3** (2-3 days): Set up Google OAuth via `allauth` or custom backend
4. **Phase 4** (2-3 days): Migrate Alembic migrations to Django migrations
5. **Phase 5** (3-4 days): Build or configure admin interface for scholarship/sholarship source management
6. **Phase 6** (1 week): Update frontend API calls from FastAPI URLs to DRF URLs; test thoroughly
7. **Phase 7** (1 week): Run parallel tests; switch production deployment; deprecate FastAPI

**Total migration time: ~3-4 weeks** of developer effort.

### Why Not FastAPI?

FastAPI is an excellent choice for API-first projects, greenfield startups, or when async endpoints are required. However:

- ScholarFind is **CRUD-heavy with admin needs** — Django excels here
- The project already has **10 ingestion adapters** and an **eligibility engine** — Django's ORM handles relational data well
- **Student team** benefits from reduced framework context-switching
- **No async requirements** — the project doesn't use WebSockets, real-time features, or heavy async I/O
- **Admin dashboard is a requirement** — Django provides this for free; FastAPI would require ~1 week minimum of development

### Counterarguments Considered & Rejected

| Counterargument | Rebuttal |
|----------------|----------|
| "FastAPI has better type safety" | Django ORM + type hints + mypy provides equivalent safety; Pydantic is great but not a reason to abandon Django's other advantages |
| "FastAPI is more modern" | Django 5.0 (current) is modern; the "newness" of a framework doesn't outweigh productivity gains for this project type |
| "Async is needed for scalability" | Project's expected workload (~10-100 req/s) doesn't require async; Django's sync performance is more than adequate |
| "We might need async later" | Can add `async_to_sync` or keep async endpoints in a separate FastAPI service (Option 3) without full migration |

## 4. Migration Plan (If Choosing Django)

### Pre-Migration Checklist

- [ ] Confirm PostgreSQL is available and configured
- [ ] Backup existing FastAPI database data
- [ ] Install Django and Django REST Framework
- [ ] Set up virtual environment
- [ ] Review existing FastAPI models/schemas for Django ORM mapping

### Step-by-Step Migration

1. **Setup Django Project**
   ```bash
   pip install django djangorestframework
   django startproject config .
   # Configure settings.py: DATABASES, INSTALLED_APPS, MIDDLEWARE
   ```

2. **Migrate Models**
   - Convert `backend/schemas.py`, `backend/models.py` to Django models
   - Convert Alembic migrations to Django migrations
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Migrate API Endpoints**
   - Convert FastAPI `@app.get()` / `@app.post()` to DRF `@api_view()` or ViewSets/Serializers
   - Update URL patterns from `FastAPI routing` to `DRF routing`
   - Update serializers from Pydantic models to DRF serializers

4. **Migrate Authentication**
   - Configure Google OAuth via `allauth` or custom backend
   - Update Firebase Auth integration if present
   - Update API endpoints that depend on auth

5. **Update Frontend**
   - Change API base URLs from `http://localhost:8000/api/v1/...` to `http://localhost:8000/...` (DRF default)
   - Update any type imports from Pydantic to DRF serializer types
   - Test all existing routes

6. **Deploy and Test**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   # Test all routes
   npm run test:frontend
   python3 -m unittest discover -s backend/tests
   ```

### Non-Migration Path (Keep FastAPI)

If the team decides the migration cost is too high and the current FastAPI setup is adequate:

- Maintain FastAPI as-is
- Build custom admin UI (estimated 2-3 weeks)
- Implement OAuth2/PKCE manually (estimated 3-5 days)
- Add testing utilities on top of existing setup
- Document that FastAPI was a deliberate choice, not the default recommendation

## 5. Final Decision

**Recommendation: Migrate to Django + Django REST Framework**

The recommendation is based on:

1. **Admin dashboard requirement** — Django provides this immediately; FastAPI would require ~2-3 weeks of development
2. **Authentication simplicity** — Google OAuth is simpler in Django
3. **Single framework advantage** — Reduces cognitive load for the student team
4. **Built-in security** — Django's security features reduce attack surface
5. **Migration cost is reasonable** — ~3-4 weeks vs. building admin + auth from scratch in FastAPI (~4-5 weeks)
6. **Project requirements align with Django strengths** — CRUD operations, scholarship management, user profiles, eligibility matching

**If the team decides to remain with FastAPI:**

- Document the rationale in `docs/BACKEND_FRAMEWORK_EVALUATION.md`
- Build custom admin UI
- Implement OAuth2 manual flow
- Maintain existing test suite
- No further framework changes recommended without new requirements

---
*Evaluation document generated as part of backend framework assessment.*
*Last updated: 2026-11-08*
