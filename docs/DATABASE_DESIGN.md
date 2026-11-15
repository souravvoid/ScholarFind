# Database Design

Last audited: 2026-11-15.

## Stores in use

| Store | Role observed | Evidence |
|---|---|---|
| PostgreSQL via Django ORM | Backend account/profile, scholarship, saved, tracking, matching and ingestion persistence | [`backend/config/settings.py`](../backend/config/settings.py), [`backend/*/models.py`](../backend) |
| Firebase Firestore | Browser catalogue/source reads and owner-scoped user data rules | [`src/services/databaseService.ts`](../src/services/databaseService.ts), [`firestore.rules`](../firestore.rules) |
| Browser localStorage | Inspected SPA profile and saved/tracker state | [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx) |

The audit did not establish catalogue synchronization between PostgreSQL and Firestore.

## Relational schema

Django apps and migrations are the schema source of truth. They include account, student,
scholarship, saved, tracking, and matching models. Representative model and migration
locations include:

- [`backend/students/models.py`](../backend/students/models.py) and
  [`backend/students/migrations/`](../backend/students/migrations/)
- [`backend/scholarships/models.py`](../backend/scholarships/models.py) and
  [`backend/scholarships/migrations/`](../backend/scholarships/migrations/)
- [`backend/saved/models.py`](../backend/saved/models.py) and
  [`backend/saved/migrations/`](../backend/saved/migrations/)
- [`backend/tracking/models.py`](../backend/tracking/models.py) and
  [`backend/tracking/migrations/`](../backend/tracking/migrations/)
- [`backend/matching/models.py`](../backend/matching/models.py) and
  [`backend/matching/migrations/`](../backend/matching/migrations/)

The current models include user-owned profile data and saved/tracking relationships to
scholarships. Saved and tracking models define uniqueness for a user/scholarship pair.
Student GPA values have serializer/model validation, but the inspected GPA fields do not have
database check constraints. Scholarship destination, level, and field values are text;
some filtering parses comma-separated values.

The audit did not inventory every database index or validate query plans; indexing and
transaction behavior remain **NEEDS REVIEW**. Use migrations and database-backed tests as the
source of truth before proposing schema changes.

## Firestore rules

[`firestore.rules`](../firestore.rules) has a global deny default, owner-scoped user profile
and saved-scholarship writes, public catalogue/source/provenance reads, and denies client
writes to catalogue/source/ingestion collections. This describes the checked-in rules only;
live deployment was not verified. See [security review](SECURITY_REVIEW.md).

## Gaps and next decisions

- Verify both stores' actual deployed schemas and decide which system owns scholarship data.
- Add database-backed integration coverage in a controlled local PostgreSQL test environment.
- Decide whether profile/tracker client storage is intentionally demo-only or temporary.
- Review database constraints for values that must remain valid under writes outside the
  serializer layer.
- Document retention/backup policy before hosting personal student data.

The field-level index is in [data dictionary](DATA_DICTIONARY.md).
