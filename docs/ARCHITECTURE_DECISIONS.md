# Architecture Decisions and Current Trade-offs

Last audited: 2026-11-15. These are observed design choices, not claims that they were
formally approved as ADRs.

## AD-1: Django catalogue with browser-local user state

**Observed:** catalogue and source reads in the SPA use the Django API (with a bundled
offline fallback); Django persists to PostgreSQL. Profile, saved, and tracker state in the
inspected SPA uses local storage.

**Trade-off:** the catalogue has one authoritative server path, but user state is not yet
account-backed or cross-device.

**Recommendation:** migrate profile/saved/tracker persistence onto the existing
authenticated APIs behind an explicit contract; do not reintroduce a browser database or a
second catalogue store.

## AD-2: Client-side and server-side eligibility implementations

**Observed:** the SPA has a TypeScript engine and the backend has Python eligibility code.
The frontend has deterministic-engine tests and parity-related fixtures.

**Trade-off:** immediate client evaluation is available, but duplicated rule semantics can
drift. API behavior and local UI results must be compared on the same fixtures.

**Recommendation:** keep shared, reviewed golden cases and decide whether one engine becomes
the authoritative evaluator.

## AD-3: Framework migration

**Observed:** current backend dependencies and routes use Django/DRF; older documentation
describes FastAPI. The migration is recorded in [`backend/MIGRATION_REPORT.md`](../backend/MIGRATION_REPORT.md).

**Recommendation:** treat Django source and current tests as authoritative; reconcile legacy
architecture documents instead of maintaining two competing descriptions.

## AD-4: Local browser persistence

**Observed:** the SPA profile and tracker workflows persist in browser storage, while
authenticated server-side profile/saved/tracker APIs also exist.

**Trade-off:** this supports a local UI demonstration but does not provide account-backed,
cross-device state.

**Recommendation:** integrate one workflow at a time behind an explicit API contract and add
cross-user authorization tests before relying on backend persistence in a demo.

## AD-5: Approved direction for full polish — Django/PostgreSQL as system of record

**Decision approved by project owner on 2026-11-15:** make Django/PostgreSQL the canonical
catalogue and user-data store, and migrate SPA data reads/writes to backend APIs.

**Status:** catalogue and auth slices implemented — the Firebase client was removed, the
catalogue is served by Django and seeded from the exported TS fixture, and login/signup use
Django token endpoints. Profile/saved/tracker persistence remains browser-local. Preserve
data provenance and avoid destructive migration or production data changes.

## AD-6: Google OAuth live verification deferred

**Decision approved by project owner on 2026-11-15:** include secure integration work only
where useful, but keep email/password as the verified completion path and defer live Google
OAuth verification until credentials can be configured through a secret manager. No secrets
are to be shared in chat or committed.
