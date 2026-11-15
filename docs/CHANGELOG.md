# Changelog

This file records this documentation-only readiness pass. It is not a complete reconstruction
of repository history; see `git log` for prior commits.

## 2026-11-15 — Readiness documentation and first polish slice

- Added evidence-based project status, architecture, API, database, eligibility, data-source,
  testing, security, setup, demo, deployment, known-issue, roadmap, and contribution documents.
- Replaced overstated project description with the observed React/Firebase + Django/PostgreSQL
  architecture and explicit limitations.
- Recorded passing local suites and the separate PostgreSQL-blocked pytest result without
  conflating the runners.
- Corrected matching record foreign-key ownership and added migration plus owner-isolation
  tests; the focused four-test suite and backend unittest suite passed.
- Added PostgreSQL service-backed pytest execution to CI; the hosted workflow result remains
  pending.
- No production configuration or scholarship/user data was changed.
