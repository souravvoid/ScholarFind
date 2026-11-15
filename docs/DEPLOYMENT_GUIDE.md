# Deployment Readiness

Last audited: 2026-11-15.

## Current status

No production hosting target or complete deployment configuration was verified. The
repository has local Vite scripts, a Django backend and PostgreSQL settings, Firebase
configuration/rules, and GitHub Actions CI. No checked-in Dockerfile, Compose file, or
standard hosting descriptor was found during the repository audit. Production deployment,
database provisioning, backup/recovery, monitoring, and alerting remain **unverified**.

## Before deployment

1. Choose and document hosting for the SPA, Django API, PostgreSQL, and Firebase services.
2. Configure server-only secrets through the hosting secret manager; do not commit `.env`
   files or put private credentials in frontend build variables.
3. Set allowed hosts, HTTPS, CORS/CSRF policy, token/session settings, database connection
   limits, and logging redaction for the selected environment.
4. Apply migrations to a new or disposable database and verify rollback/recovery procedures.
5. Confirm deployed Firestore rules match the reviewed, owner-scoped rules; test with the
   emulator before deploy.
6. Configure Google OAuth redirect origins and credentials only if that feature is part of
   the approved launch scope.
7. Add health monitoring, error alerts, backup verification, data-retention policy, and a
   release/rollback procedure.
8. Run the full CI workflow and a staging smoke test using synthetic accounts/data.

These are readiness requirements, not completed deployment instructions. Do not deploy or
change production configuration based solely on this document.
