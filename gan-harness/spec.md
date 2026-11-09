# GAN Harness Spec — Eligibility Parity (Slice 1)

## One-line brief

Make the TypeScript UI eligibility engine and the Python Django eligibility engine return
the same normalized score and the same verdict for the same profile + rules, proven by one
shared golden fixture.

## Problem

`src/utils/eligibilityEngine.ts` and `backend/eligibility_service.py` disagree on:

- UK Honours mapping (TS `1.0 → 95`, PY `1.0 → 85`)
- German mapping (TS `2.5 → 75`, PY `2.5 → 62.5`)
- ECTS mapping (TS letter grades, PY percentage)
- 5.0-scale denominator when `max_gpa` is not 5.0
- language thresholds (TS accepts any non-empty score; PY enforces IELTS/TOEFL/Duolingo)
- field mismatch (TS `missing`, PY `fails`)
- unknown / `deadline` rule types (TS auto-pass, PY manual review)
- match score (TS passed/total, PY weighted) and overall outcome (TS has no `needs_review`)

The PRD acceptance criterion #3 requires a shared parity fixture. This slice delivers it.

## Scope (in)

- One canonical mapping for all six grading scales.
- One canonical criterion-status model: `meets`, `fails`, `more_info_needed`,
  `needs_manual_review`.
- One canonical overall model: `likely_eligible`, `more_info_needed`, `does_not_meet`,
  `needs_review`.
- Canonical weighted match score and half-up rounding.
- A shared fixture consumed by both test suites.
- UI handling for the new `needs_review` status.

## Out of scope

- Real authoritative ingestion, backend/frontend wiring, auth, CI.
- Re-scraping catalogue rules or changing scholarship data.
- `deadline` rule semantics beyond conservative manual review (graduation-year parsing is a
  follow-up; the existing "recent graduation window" rule cannot be evaluated reliably from
  the current profile strings).

## Acceptance criteria

1. Both suites read `tests/fixtures/eligibility-parity.json`.
2. Every `gpa_cases` entry returns the same normalized value in TS and PY.
3. Every `scenarios` entry returns the same criterion statuses, overall outcome, match
   percentage, met count, mandatory-failure count, missing count, and manual-review count.
4. `npm run test:frontend`, `npm run lint`, `npm run build`, `npx playwright test`, and
   `cd backend && python -m pytest -q` pass.
5. No catalogue data, API contract, or auth behavior changes.

## Canonical decisions

| Area | Decision |
|---|---|
| Scale authority | Python engine values become canonical (backend contract), TS aligns |
| 4.0 / 5.0 | Explicit denominators 4.0 / 5.0; `max_gpa` only for unknown scales |
| Percentage / ECTS | Numeric 0–100, clamped |
| German | Modified Bavarian: `((5 - g) / 4) * 100`, clamped to 1–5, rounded to 1 dp |
| UK Honours | `≤1 → 85`, `2.0–2.15 → 75`, `2.15–2.25 → 60`, `≥40 → raw`, else `75` |
| Zero GPA | Treated as "not provided" (`more_info_needed`) |
| Unknown / deadline / manual | `needs_manual_review` — never auto-pass |
| Field mismatch | `fails` (deterministic), not missing |
| Match score | Weighted: meets 1.0, manual 0.5, missing 0.25, fail 0.0; half-up |
| Outcome precedence | mandatory fail → missing mandatory → manual review → likely eligible |
