# Security Review Notes

Static, documentation-grade review date: 2026-11-15. This is not a penetration test,
dependency audit, or verification of deployed services. No unauthorized scanning or
production access was performed.

## Verified controls and limits

| Area | Observed state | Remaining verification |
|---|---|---|
| Firestore default access | Checked-in rules default-deny, restrict profile/saved writes to the owner, allow public reads of catalogue/source records, and deny client catalogue/source/log writes. | Deployed rules and emulator tests were not verified. See [`firestore.rules`](../firestore.rules). |
| Django permissions | Reviewed API viewsets use authenticated/owner-scoped access for student, saved, and tracking operations; ingestion trigger is staff-only. | Run tests against a configured disposable PostgreSQL DB and verify cross-user denial. |
| OAuth | Google OAuth handlers exist. Client credentials are empty by default in settings. | A configured provider flow was not tested; keep secrets server-side. |
| Client/server data | SPA auth calls Django, while profile/tracker state remains browser-local and catalogue reads use Firestore. | Verify intended trust boundaries and avoid treating browser-stored values as authoritative. |
| External scholarship links | UI has a redirect confirmation flow in the application. | Re-test HTTPS and destination allowlist behavior against current code; no live navigation test was performed during this audit. |
| Secrets | Environment templates are present; secret values were not inspected. | Secret scanning and deployed secret configuration were not part of this review. |

## Risks to prioritize

1. **Live Firestore rules may differ from the checked-in rules.** A passing source inspection
   does not verify deployment. Validate using the Firebase emulator and an authorized
   deployment review before relying on live behavior.
2. **Input integrity is split across layers.** Review model/database constraints and API
   serializers for values that may be written outside current frontend forms.
3. **No production operations evidence.** Hosting, backups, monitoring, rate limits under
   load, and incident response were not verified.

The matching relation defect was corrected in the current worktree with targeted owner
isolation tests. Broader database-backed CI remains pending.

## Required follow-up

- Add Firestore rules emulator tests for anonymous denial, owner access, other-user denial,
  and immutable client catalogue writes.
- Run API authorization and validation tests against a disposable test database.
- Review CORS, CSRF, token/session lifecycle, rate throttling, logging redaction, dependency
  updates, and HTTPS deployment configuration before public exposure.
- Confirm every external redirect is HTTPS and constrained to the verified provider.

No finding here should be interpreted as a complete security assessment or a claim that the
application is production-ready.
