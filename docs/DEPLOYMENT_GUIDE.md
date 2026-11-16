# Deployment Readiness

Last audited: 2026-11-15.

## Current status

A deployment descriptor is checked in: [`render.yaml`](../render.yaml) defines a Render web
service (`scholarfind-api`, root `backend`, `gunicorn config.wsgi:application`, health check
`/api/v1/health/`) and a PostgreSQL database (`scholarfind-db`). `backend/build.sh` installs
dependencies and collects static files for WhiteNoise.

No live deployment was verified. Production database provisioning, environment values,
backup/recovery, monitoring, and alerting remain **unverified**, and the descriptor alone is
not evidence that the service is reachable.

## Before deployment

1. Confirm hosting for the SPA and API. The API is configured for Render; the client needs a
   static host or a Vite build served alongside it.
2. Configure server-only secrets through the hosting secret manager: `DJANGO_SECRET_KEY`,
   `DATABASE_URL`, and (if enabled) Google OAuth credentials. Never commit `.env` files or put
   private credentials in `VITE_` variables.
3. Set `DJANGO_ENV=production`, `DJANGO_DEBUG=False`, `ALLOWED_HOSTS`, and an explicit
   `CORS_ALLOWED_ORIGINS` allowlist. Keep HTTPS/HSTS and secure-cookie settings enabled.
4. Apply migrations to a new or disposable database, then seed the catalogue:

   ```bash
   cd backend
   python manage.py migrate
   python manage.py seed_catalogue_bundle
   ```

   Verify rollback/recovery procedures; the seed command is idempotent but is not a substitute
   for a backup.
5. Set `VITE_API_BASE_URL` for the client build when the API is on a different origin, or serve
   both same-origin behind one host/proxy.
6. Configure Google OAuth redirect origins and credentials only if that feature is in the
   approved launch scope; without them the OAuth endpoints return 503.
7. Add health monitoring, error alerts, backup verification, data-retention policy, and a
   release/rollback procedure.
8. Run the full CI workflow and a staging smoke test using synthetic accounts and data. The
   backend CI job provisions PostgreSQL 16 and runs `pytest` plus unittest discovery.

These are readiness requirements, not completed deployment instructions. Do not deploy or
change production configuration based solely on this document.

## Legacy Firebase artefacts

`firestore.rules` is retained for historical reference; the unused legacy Firebase web config
was removed from the current tree. The client no longer bundles Firebase and does not need
Firestore deployed for the current architecture; do not add a Firebase dependency back without
an explicit decision.
