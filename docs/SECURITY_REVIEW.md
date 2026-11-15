# Security Review Notes

Static, documentation-grade review date: 2026-11-15. This is not a penetration test,
dependency audit, or verification of deployed services. No unauthorized scanning or
production access was performed.

## Verified controls and limits

| Area | Observed state | Remaining verification |
|---|---|---|
| Client data access | The client has no Firebase/Firestore SDK and cannot write catalogue data. Catalogue/source reads are public Django API reads; auth uses token endpoints. | Verify deployed API permissions and throttles; `firestore.rules` is a legacy artifact. |
| Django permissions | Reviewed API viewsets use authenticated/owner-scoped access for student, saved, and tracking operations; ingestion trigger is staff-only. | Run tests against a configured disposable PostgreSQL DB and verify cross-user denial. |
| OAuth | Google OAuth handlers exist. Client credentials are empty by default in settings. | A configured provider flow was not tested; keep secrets server-side. |
| Client/server data | SPA auth and catalogue/source reads call Django; profile/tracker state remains browser-local. | Verify intended trust boundaries and avoid treating browser-stored values as authoritative. |
| External scholarship links | UI has a redirect confirmation flow in the application. | Re-test HTTPS and destination allowlist behavior against current code; no live navigation test was performed during this audit. |
| Secrets | Environment templates are present; secret values were not inspected. | Secret scanning and deployed secret configuration were not part of this review. |

## Risks to prioritize

1. **Deployed API controls may differ from source.** Authentication, throttling, and CORS
   settings are configured in `backend/config/settings.py`, but deployed values and load
   behavior were not verified. Confirm them in staging before relying on them.
2. **Input integrity is split across layers.** Review model/database constraints and API
   serializers for values that may be written outside current frontend forms.
3. **No production operations evidence.** Hosting, backups, monitoring, rate limits under
   load, and incident response were not verified.

The matching relation defect was corrected and committed, with targeted owner-isolation tests.
Broader database-backed CI remains pending.

## Required follow-up

- Add API permission tests for anonymous denial, owner access, and other-user denial; confirm
  catalogue and source endpoints stay read-only.
- Run API authorization and validation tests against a disposable test database.
- Review CORS, CSRF, token/session lifecycle, rate throttling, logging redaction, dependency
  updates, and HTTPS deployment configuration before public exposure.
- Confirm every external redirect is HTTPS and constrained to the verified provider.

No finding here should be interpreted as a complete security assessment or a claim that the
application is production-ready.
