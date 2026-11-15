# Database Design

Last audited: 2026-11-15.

## Stores in use

| Store | Role observed | Evidence |
|---|---|---|
| PostgreSQL via Django ORM | The only server-side store: accounts, student profiles, scholarship catalogue, saved items, tracking, matching, and ingestion records | [`backend/config/settings.py`](../backend/config/settings.py), [`backend/*/models.py`](../backend) |
| Browser localStorage | SPA profile and saved/tracker state (`scholarfind_profile`, `scholarfind_saved`) | [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx) |

The client has no database SDK. Catalogue and source reads go through the Django API with a
bundled static fallback; the fallback is not a second persistent store.

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

## Catalogue seeding

The bundled catalogue fixture is generated from the TypeScript source so the API and the
offline fallback expose the same records:

```bash
npx tsx scripts/export-catalogue-bundle.ts
cd backend && python manage.py seed_catalogue_bundle
```

[`backend/scholarships/fixtures/bundled_catalogue.json`](../backend/scholarships/fixtures/bundled_catalogue.json)
currently contains 48 scholarship records. The seed command is idempotent: it recognises an
existing programme by title and copies missing presentation metadata instead of duplicating
rows. Never hand-edit the fixture; regenerate it from `src/data/scholarshipsData.ts`.

## Legacy Firebase artefacts

[`firestore.rules`](../firestore.rules) and
[`firebase-applet-config.json`](../firebase-applet-config.json) remain in the repository for
historical reference. The React client has no Firebase dependency and performs no Firestore
reads or writes; catalogue access is read-only through Django. Do not reintroduce a client
database path.

## Gaps and next decisions

- Verify the deployed PostgreSQL schema and migration state before release.
- Add database-backed integration coverage in a controlled local PostgreSQL test environment.
- Decide whether profile/tracker browser storage is intentionally demo-only or temporary.
- Review database constraints for values that must remain valid under writes outside the
  serializer layer.
- Document retention/backup policy before hosting personal student data.

The field-level index is in [data dictionary](DATA_DICTIONARY.md).
