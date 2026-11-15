# DBMS Design — ScholarFind

## 1. Engine and configuration
- Engine: PostgreSQL (local port 5433; production via `DATABASE_URL`).
- ORM: Django ORM. Migrations are the schema source of truth.
- Connection pooling: `conn_max_age=600` when using `DATABASE_URL`.

## 2. Design rationale
- Relational model fits: users, scholarships, and the M:N saved/tracker relationships.
- Normalized to 3NF for core entities; intentional denormalization for comma-separated
  lists (see NORMALIZATION.md) to keep the MVP simple and match the original TS catalogue.

## 3. Integrity
- PKs: surrogate `id` (BigAutoField) except 1:1 profiles where the user PK is reused.
- FKs with CASCADE ensure no orphaned rules/documents/saved rows.
- Unique constraints prevent duplicate saves per user.
- Validators enforce numeric ranges at app layer (not DB CHECK).

## 4. Indexing
- `scholarships_scholarship.slug` (unique, indexed) — detail lookup.
- `title` (indexed) — search.
- `application_deadline` (indexed) — sort/filter.
- PK and FK columns indexed by PostgreSQL automatically.

## 5. Transactions
- Single-statement ORM calls are auto-committed.
- Registration creates User + UserProfile; not wrapped in an explicit transaction in code
  (IMPLICIT: Django's default autocommit). A failure between the two inserts could leave an
  orphan user — a known gap.

## 6. What is NOT implemented
- No DB-level CHECK constraints.
- No materialized views.
- No full-text search indexes.
- No read replicas.
- No explicit transaction blocks (`transaction.atomic`) in views.
