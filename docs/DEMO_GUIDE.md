# Academic Demonstration Guide

Last audited: 2026-11-15. Use only synthetic personas and a local/staging environment.

## Safe setup

1. Follow [development setup](DEVELOPMENT_SETUP.md).
2. Prefer local fallback data and mocked/test auth. Do not use real student data or production
   accounts.
3. Confirm whether PostgreSQL-backed routes and Google OAuth are configured before claiming
   those journeys work.
4. Use the browser tests as smoke evidence; they do not prove persisted account journeys.

## Synthetic persona scenarios

Use clearly fictional labels and reserved `.example` email addresses, for example:

| Persona | Scenario |
|---|---|
| `Demo Student A` | B.Tech CSE undergraduate, Uttarakhand; profile fields complete, likely match scenario. |
| `Demo Student B` | B.Sc undergraduate, Uttar Pradesh; academic criterion not met scenario. |
| `Demo Student C` | Delhi postgraduate; missing language/profile data scenario. |
| `Demo Student D` | Rajasthan diploma student; course/level mismatch scenario. |
| `Demo Student E` | Bihar Class 12 student; upcoming or unverified opportunity scenario. |

These are test profiles, not real people. Avoid Aadhaar/PAN, phone, address, bank, or other
real identity data.

Suggested fixture scenarios (synthetic only): eligible, does not meet a requirement, missing
information, expired, upcoming, unverified, no published deadline, and an income-conditioned
opportunity. The last case must demonstrate that income matching is unsupported today, not
pretend that an income rule passed.

## Suggested walkthrough

1. Open the landing page and navigate to discovery.
2. Search and filter the existing catalogue; explain that coverage is limited and not an
   official government listing.
3. Open an opportunity, inspect source/provenance, and review the criteria.
4. Enter a synthetic profile and compare missing/ineligible/eligible outcomes. State
   explicitly that the result is advisory.
5. Save an opportunity and move it through tracker stages. Clarify that inspected SPA state
   may be browser-local rather than account-synced.
6. Use the redirect confirmation and stop before submitting anything to a provider.

## Data for a prepared demo (proposed)

Prepare a small, manually reviewed synthetic fixture set sufficient to demonstrate search,
filters, eligibility edge cases, saved/tracker states, empty states, and stale/unknown data.
Use around 8-12 records only as a **test-fixture sizing suggestion**, not as a claim about
real scholarship coverage. Label every synthetic record prominently and keep it separate
from verified public opportunities. No demo records were imported by this audit.
