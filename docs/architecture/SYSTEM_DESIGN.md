# System Design — ScholarFind (as-is, 2026-11-08)

Documents the architecture that **actually exists** (commit `ce43c29`), then the intended target
state. Recommendations are incremental; nothing here has been implemented yet beyond docs.

## 1. Component responsibilities (current)

| Component | Responsibility | Issues |
|---|---|---|
| SPA (`src/`) | all product logic: routing (tabs), rendering, filtering, eligibility, persistence | holds fabricated stats; 3 inert filters; modal a11y gaps |
| `AuthContext` | session, per-user profile + saved list (Firestore), demo persona, localStorage cache | listener leak, stale-write payloads, snapshot-zero bug, unguarded JSON.parse |
| `databaseService.ts` | Firestore reads + **client-side catalogue seeding** + fake audit writes | writes public collections; unvalidated casts |
| Firebase | Auth (Google), Firestore (profiles/saves owner-locked; catalogue world-writable) | rules C1; no deploy wiring (no `firebase.json`) |
| `backend/` FastAPI | health/sources/ingest/evaluate/scholarships endpoints | unreachable from SPA; unauth admin + evaluate 500s + stub `/scholarships`; no requirements.txt; import-fallback stubs hide breakage |
| `backend/eligibility.py` | Python engine (tested) | divergent from shipped TS engine — dead as product logic today |
| `backend/ingestion/` | simulated adapters (no network), in-memory idempotent-ish storage | "ingestion" never touches the web; 7/10 adapters crash `run_job` (verified) |
| `src/utils/ingestion/` | TS mirror of ingestion, test-only | dead in production |

## 2. Data stores (current vs documented)

- **Real:** Firestore collections `users/{uid}/profile/data`, `users/{uid}/saved_scholarships`,
  `scholarships`, `scholarship_sources`, `ingestion_logs`, `test`. Static fallback:
  `src/data/scholarshipsData.ts` / `sourcesData.ts`.
- **Documented-but-fictional:** SQLAlchemy schema (`backend/models.py`, 11 tables, no engine,
  no migrations, no DB).

## 3. Contracts

- **Frontend↔Firestore:** implicit schema = TS types (`src/types/index.ts`) mirrored by
  `firebase-blueprint.json`; no runtime validation on read (`as Scholarship` casts).
- **Backend REST:** 5 endpoints exist but only `/health` & `/evaluate` do real work; `/evaluate`
  lacks the request schema it imports; `/scholarships` ignores its query params (stub, hardcoded
  `total_count: 1428`); `/admin/ingest/{id}` fails with HTTP 200 for 7/10 sources.

## 4. Security model

- Client identity: Firebase Auth only. Firestore rules isolate user subpaths (verified good),
  but catalogue/sources/logs/`test` are anonymously writable (critical, see SECURITY_AUDIT.md).
- Backend has no auth on any route, wildcard CORS. No rate limiting, no logging service.

## 5. Target architecture (recommended, incremental)

Keep the SPA+Firebase spine. Resolve the duplicate-product question as:

1. **Adopt the Python engine as single source of truth for rule semantics** OR vice versa, with a
   **shared golden fixture table** (same profile+rules → identical normalized scores and verdicts).
   Ships as a TS engine + parity tests; the Python engine stops being referenced until a server
   use-case justifies it.
2. **Make backend optional:** strip fallback stubs, add `requirements.txt`, add `TestClient`
   tests, auth on admin routes, real CORS list. It may remain an internal service for future
   ingestion; the SPA stays Firestore-first.
3. **Catalogue writes move to a service identity** (Cloud Function/admin script or CI job);
   client only reads. One seeding script (server-side) replaces per-browser seeding.
4. Remove: `HeroGlobe3D`, `src/utils/ingestion`, unused deps, dead imports, fake flows.

## 6. Observability (current: none server-side)

- Client console only. Recommended minimal: Firestore rules audit + `error.log` discipline in
  `databaseService` failure paths; later a structured logger + CI run of all suites.

## 7. Deployment (current: none defined)

- SPA: Vite static build (dist/) — no host config in repo.
- Firestore rules: exist but no `firebase.json`/deploy wiring — **unverified whether the
  committed rules were ever applied to the live project** (hypothesis: they are, since AI
  Studio injects config; treat deploy story as unknown).
- Backend: no Procfile/Dockerfile; assume Cloud Run hosting per `.env.example` comments
  (UNVERIFIED-CLAIM).
