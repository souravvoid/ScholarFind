# Contribution Guide

## Safe contribution workflow

1. Create a focused branch, for example `feat/profile-api`, `fix/catalogue-detail`, or
   `docs/readiness`.
2. Make a narrow change that preserves existing product behavior and add tests for the
   expected outcome.
3. Run relevant checks and record failures honestly:

   ```bash
   npm run lint
   npm test
   npm run build
   npm run test:e2e
   ```

4. For backend persistence work, use a disposable PostgreSQL database and run migrations and
   database-backed tests. Never point tests at production.
5. Open a pull request with scope, rationale, test output, screenshots only if actually
   captured, migration/data impact, and rollback notes.

## Security and data rules

- Never commit `.env` values, tokens, private keys, or real student data.
- Use synthetic identities with `.example` addresses for fixtures.
- Do not add client writes to catalogue/source/ingestion Firestore collections.
- Do not republish scholarship information until source accuracy and reuse rights are checked.
- Route external provider URLs through the application's confirmation and validation path.
- Do not weaken/delete a failing test without an equivalent replacement assertion.

## Commits and releases

Use the repository's existing imperative conventional style, e.g.
`fix(api): scope profile lookup to the owner`. Maintain the changelog for user-visible or
operationally important changes. Release/publish only after authorized review.
