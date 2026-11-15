# Requirements and Product Boundaries

Last audited: 2026-11-15.

This is an implementation-oriented summary, not a replacement for the existing product
requirements document in [product/PRD.md](product/PRD.md).

## Intended user journeys

1. Browse opportunities and search/filter the catalogue.
2. Read scholarship details and official provider links.
3. Enter profile information and inspect an explainable, non-official match.
4. Save an opportunity and track application progress.
5. Register/sign in where configured.

## Intended student segments

The product may serve secondary school students (including Class 10/12), undergraduate and
postgraduate students, engineering/diploma students, and research scholars. Merit-, income-,
and state-specific discovery are product goals, not evidence that corresponding data or
eligibility rules are fully implemented. In particular, income is not currently modeled by
the inspected eligibility engine.

## Non-functional expectations

- Preserve clear source provenance and distinguish unknown or unverified criteria.
- Do not imply that a match is an official decision.
- Protect user-specific data with owner-scoped authorization.
- Provide useful validation, empty, loading, and error states.
- Make critical journeys testable without production data or secrets.
- Record real data freshness and reuse permissions before publishing records.

## Current constraints

- The client uses the Django API for catalogue/source reads and auth, and browser storage for
  inspected profile and tracker state. Django persists to PostgreSQL.
- The client does not yet demonstrate complete end-to-end account-backed persistence across
  the inspected profile and tracker journeys.
- A live Google OAuth flow, a running deployment, production database operations,
  backup/recovery, and operational monitoring were not verified.
- Indian scholarship data coverage and bulk reuse rights are not established by this audit.

See the [project status](PROJECT_STATUS.md) for per-feature evidence and classifications.
