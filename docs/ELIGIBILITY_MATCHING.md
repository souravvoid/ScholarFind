# Eligibility Matching

Last audited: 2026-11-15.

## Implementations

The repository contains a TypeScript evaluator for the SPA and a Python evaluator used by
the Django API. The frontend evaluates scholarship criteria locally; backend evaluation
routes also accept rule/profile data and have a database-backed path. The existence of both
implementations means parity must be maintained explicitly.

Relevant sources:

- [`src/utils/eligibilityEngine.ts`](../src/utils/eligibilityEngine.ts)
- [`backend/eligibility.py`](../backend/eligibility.py)
- [`backend/eligibility_service.py`](../backend/eligibility_service.py)
- [`backend/accounts/views.py`](../backend/accounts/views.py)
- [`tests/fixtures/eligibility-parity.json`](../tests/fixtures/eligibility-parity.json)

## Criteria implemented in the TypeScript engine

| Criterion | Observed behavior | Limitations |
|---|---|---|
| Academic score | Normalizes supported scales and checks `minGpaNormalized`; profile collects scale and score. | ECTS is presented as a letter-grade scale in the UI but treated as a numeric 0–100 value by the engine. |
| Degree level | Compares profile `targetDegrees` with rule `requiredDegrees`. | It does not use `educationLevel` for this match; current education and intended degree are separate fields. |
| Field/course | Compares free-text `primaryField` to `applicableFields` with substring matching. | Profile tags/keywords and course title are not independently evaluated. |
| Citizenship | Checks allowed/prohibited passport origins. | Residence and destination preferences are not checked; UI uses a fixed country list. |
| English language | Supports medium-of-instruction waiver plus IELTS, TOEFL, and Duolingo thresholds. | Waiver defaults can pass unless explicitly disabled; failure explanations for non-IELTS tests may show an IELTS cutoff. |
| Work experience | Compares years to `minWorkYears`. | Requirements such as leadership quality are not automatically assessed. |
| Deadline/manual review | Routes explicit deadline/manual-review criteria to manual review. | This is not a full deadline lifecycle/status system. |
| Income | **Not implemented.** | The profile/type has no income field or income rule. Some catalogue entries encode income as an `academic_score` rule with a zero GPA threshold; this does not verify income. |

Primary evidence: [`src/utils/eligibilityEngine.ts`](../src/utils/eligibilityEngine.ts),
[`src/types/index.ts`](../src/types/index.ts),
[`src/components/ProfileBuilder.tsx`](../src/components/ProfileBuilder.tsx), and
[`src/data/scholarshipsData.ts`](../src/data/scholarshipsData.ts).

Other unmodeled criteria include age, gender, domicile duration, course-specific admission,
and family circumstances in the inspected types. Review every provider rule before calling
an opportunity a match.

## Behavior and limitations

- Deterministic rule evaluation and explanations exist, but supported rules are incomplete.
- The frontend and backend have separate engine code and may drift as rules evolve.
- The backend eligibility API does not load the signed-in user's stored `StudentProfile` for
  the inspected evaluation paths; profile input is supplied to the request.
- This is a discovery aid, not a provider decision. Students must check current official
  requirements.
- Do not add arbitrary match percentages or claim that a calculated result is official.

## Required output contract (recommended)

For each scholarship, expose:

1. Criteria satisfied.
2. Criteria not satisfied.
3. Missing profile information.
4. Criteria or source details not verified.
5. A reminder to confirm requirements with the provider.

## Testing

Maintain shared golden fixtures for both runtimes. Add cases for missing values, unknown
rules, academic scales, course and geography requirements, income criteria, deadline status,
and rounding. A fixture passing does not prove complete semantic parity; compare the result
and explanation for every supported rule type.
