# Data Sources and Licensing

Research checked: 2026-11-15. URLs and availability can change. No scholarship records were
imported or copied as part of this audit.

## Official-source candidates

| Provider | Official page(s) | Data availability and student categories | Update frequency / freshness | License, reuse, and verification |
|---|---|---|---|---|
| National Scholarship Portal (NSP) | [Home](https://scholarships.gov.in/), [students](https://scholarships.gov.in/Students), [scheme list](https://scholarships.gov.in/All-Scholarships), [eligibility](https://scholarships.gov.in/scholarshipEligibility) | Public scheme list, eligibility information and cycle announcements were accessible. Central and state scheme sections are present; exact student categories depend on each scheme. No structured export or documented public API was verified. | Page content indicated AY 2026–27 open during the check. Cycle dates change; no dependable fixed refresh interval was verified. Recheck each current scheme guideline. | Reuse license not verified. Manual validation and permission check required before republishing. |
| Open Government Data Platform India | [Catalog](https://www.data.gov.in/catalog), [license](https://www.data.gov.in/government-open-data-license-india) | Pages returned 403; no scholarship dataset, file format, API, or coverage was verified. Potential cross-ministry/state coverage is unconfirmed. | Dataset update history could not be inspected. | Dataset-specific terms and license text remain unverified. Confirm individual dataset license, attribution, update date, and API/download documentation before use. |
| Ministry of Education | [Scholarships candidate page](https://www.education.gov.in/scholarships) | Page returned 403; current scheme listings/downloads and applicable student categories were not verified. | Unknown. | Reuse conditions unresolved; manually verify current guidelines and permissions. |
| University Grants Commission | [Scholarships candidate page](https://www.ugc.gov.in/Scholarships) | Page returned maintenance/access-denied response; current programs and structured data were not verified. | Unknown. | Reuse terms unresolved; confirm active notices and guidelines manually. |
| AICTE | [Official site](https://www.aicte-india.org/) | Site could not be retrieved; technical-education student-support programs and any scholarship feed were not verified. | Unknown. | Reuse terms unresolved; do not infer availability or permissions. |
| Uttar Pradesh scholarship portal | [Portal candidate](https://scholarship.up.gov.in/) | Portal could not be retrieved; current program details, structured data and categories were not verified. | Unknown. | Portal identity, terms, freshness, and reuse permission require confirmation. |

These are candidates, not a claim that every portal permits redistribution. Research did not
verify student-level award datasets or a public bulk scholarship-recipient dataset.

## Record-quality contract

Before treating a real record as verified, capture the scholarship name, provider, description,
geographic scope, education level/course, academic and other eligibility criteria, award
benefit if published, opening/deadline/cycle if published, official application URL, source
URL, last-verified date, and verification/reuse status. Missing information must remain
unknown rather than guessed. Suggested statuses: `VERIFIED`, `NEEDS_REVIEW`, `EXPIRED`,
`UPCOMING`, and `UNKNOWN`.

## Recommended source workflow

For each candidate record, store the official page and guidelines, provider, geography, cycle,
source observation date, verification state, reuse status, and a change history. Use explicit
states such as `VERIFIED`, `NEEDS_REVIEW`, `EXPIRED`, `UPCOMING`, and `UNKNOWN`. Confirm
application URL, deadline, award, eligibility, and licensing against provider material before
publishing. Unknown values stay unknown.

An ingestion pipeline should validate source policy, normalize without losing original
provenance, detect duplicates/changes, quarantine invalid or stale records, require manual
review where terms or eligibility are ambiguous, and log failures. Do not overwrite
historical data destructively.

See the actual implementation in [`backend/ingestion/`](../backend/ingestion/) and its
current limitations in [project status](PROJECT_STATUS.md).
