# ScholarFind Documentation

Last audited: 2026-11-15. This index points to the current documentation-first readiness
assessment. Statements about the implementation are evidence-based; proposed work is
identified as such.

## Project and readiness

- [Project overview](PROJECT_OVERVIEW.md) — purpose, audience, and non-goals.
- [Requirements](REQUIREMENTS.md) — intended user journeys and current boundaries.
- [Project status](PROJECT_STATUS.md) — feature matrix, scores, evidence, and readiness.
- [Known issues](KNOWN_ISSUES.md) — verified gaps and blockers.
- [Implementation roadmap](IMPLEMENTATION_ROADMAP.md) — prioritized options and effort.

## Technical reference

- [System architecture](SYSTEM_ARCHITECTURE.md) — actual components and data flows.
- [Architecture decisions](ARCHITECTURE_DECISIONS.md) — current trade-offs and risks.
- [API documentation](API_DOCUMENTATION.md).
- [Eligibility matching](ELIGIBILITY_MATCHING.md).
- [Data sources and licensing](DATA_SOURCES_AND_LICENSING.md).
- [AI session work status](ai/WORK_STATUS.md) — current phase and verified local results.

## Running and validating

- [Development setup](DEVELOPMENT_SETUP.md).
- [Testing strategy](TESTING_STRATEGY.md) and [test report](TEST_REPORT.md).
- [Demo guide](DEMO_GUIDE.md) — synthetic persona scenarios only.
- [Deployment guide](DEPLOYMENT_GUIDE.md) — current readiness and unverified deployment prerequisites.

## Project contribution and history

- [Contribution guide](CONTRIBUTION_GUIDE.md).
- [Changelog](CHANGELOG.md).

Detailed academic material (LLD, ER/normalization, operating-system/networking explanations,
professor notes, viva questions, and internal audits) is maintained under the ignored
`.local-docs/` directory. It is not part of the public documentation set.

Some older repository notes predate the Django migration and current frontend behavior. For
current implementation claims, prefer the documents linked above and their cited source files;
`PROJECT_CONTEXT.md` is a pre-Django snapshot dated 2026-11-08 and is explicitly **not
authoritative** for the current code.
