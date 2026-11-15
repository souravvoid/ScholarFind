# Normalization — ScholarFind

## Functional dependencies (selected)

- `Scholarship.slug → all other Scholarship attributes` (candidate key).
- `ScholarshipProvider.name → provider attributes`.
- `SavedScholarship.(user, scholarship) → status, notes, timestamps`.
- `StudentProfile.user → all profile attributes`.

## 1NF
All attributes are atomic scalars except the intentional comma-separated
text fields (`destination_countries`, `study_levels`, `fields_of_study`,
`coverage_types`, `funding_nature`, `faculty_tags`, `target_degrees`, etc.) and
`application_instructions` (JSON). Strictly these violate 1NF; they are kept as
denormalized convenience fields for the MVP (see below).

## 2NF
No partial dependencies on composite keys: every table with a composite key
(saved, tracker, manual review) has non-key attributes depending on the whole
pair.

## 3NF
No transitive dependencies among non-key attributes in the core tables.
`Scholarship` references `Provider` and `Source` via FK rather than copying
their attributes.

## Intentional denormalization
- Comma-separated lists instead of M:N join tables (e.g. scholarship↔country,
  scholarship↔field). Trade-off: simpler queries and a direct mapping from the
  original TS catalogue; cost: no referential integrity on individual values and
  harder filtering. Marked as technical debt.
- `coverage_types`/`funding_nature` stored as text rather than enums/M2M for the
  same reason.

## BCNF
Core entities (Provider, Source, Scholarship keyed by slug) satisfy BCNF.
Tables with surrogate keys and unique natural keys (Provider.name) satisfy BCNF
for their FDs. Not claimed for the denormalized text fields.
