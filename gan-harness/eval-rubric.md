# GAN Harness Eval Rubric — Eligibility Parity (Slice 1)

Score each dimension 0–10. Pass threshold: **7.0** overall with no dimension below 5.

| # | Dimension | Weight | What "10" looks like |
|---|---|---|---|
| 1 | Normalization parity | 25% | All six scales match the shared fixture exactly; rounding is deterministic |
| 2 | Verdict parity | 25% | Every fixture scenario yields identical statuses, outcome, counts, and match % |
| 3 | Correctness / honesty | 15% | Unknown/deadline rules never auto-pass; zero GPA is "info needed", not a fake fail |
| 4 | Test quality | 15% | One fixture drives both suites; no duplicated expected tables; failure messages name the case |
| 5 | Integration safety | 10% | UI handles `needs_review`; type unions updated; existing scenario tests still meaningful |
| 6 | Documentation | 5% | Canonical decisions and known follow-ups recorded |
| 7 | Scope discipline | 5% | No auth, API contract, ingestion, or catalogue changes |

## Hard fail conditions

- A fixture case is skipped or expected values are duplicated per language.
- An unknown/deadline rule auto-passes.
- Existing tests are deleted or weakened to reach green.
- `npm run lint`, `npm run build`, `npx playwright test`, or `pytest` fails.

## Evaluation mode

`code-only` — this slice has no new user-facing flow; Playwright is a regression gate only.
