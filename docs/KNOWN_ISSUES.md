# Known Issues and Verification Gaps

Observed 2026-11-15. See source links for the implementation evidence.

## Confirmed functional gaps

1. **Split persistence.** The SPA profile and saved/tracker state are browser-local while
   corresponding authenticated Django APIs exist. Cross-device/account persistence is not
   implemented in the inspected SPA path.
2. **Offline fallback can be stale.** When the catalogue API is unreachable, the client shows
   the bundled 48-record catalogue and 10 bundled sources. The bundle may lag the database, and
   a slug that exists only in PostgreSQL resolves to not-found offline. See
   [`src/services/catalogueService.ts`](../src/services/catalogueService.ts).
3. **Eligibility profile linkage.** Backend evaluation accepts a profile in the request
   instead of loading the authenticated user's stored student profile.
4. **Illustrative profile defaults.** The profile builder starts with sample values
   (University of Delhi, 3.82 GPA, Fall 2026). Identity and residence are intentionally pinned
   to India, but the other defaults can be mistaken for saved answers. See
   [`src/components/ProfileBuilder.tsx`](../src/components/ProfileBuilder.tsx).
5. **Income requirements are not actually evaluated.** The profile and rule types have no
   income criterion, while some catalogue rules encode income as an academic-score rule.
   The matcher evaluates that as GPA, not income. See
   [`src/types/index.ts`](../src/types/index.ts),
   [`src/utils/eligibilityEngine.ts`](../src/utils/eligibilityEngine.ts), and
   [`src/data/scholarshipsData.ts`](../src/data/scholarshipsData.ts).
6. **Eligibility input defaults can overstate evidence.** Medium-of-instruction eligibility
   defaults to true in a new profile, and the engine may accept a waiver unless a rule
   explicitly disables it. The ECTS UI/normalization and non-IELTS failure explanations also
   need review. Details: [eligibility matching](ELIGIBILITY_MATCHING.md).

## Resolved

- **Matching record ownership:** `ManualReviewFlag` and `WorkExperienceRecord` now relate to
  `StudentProfile`, views assign the profile from `request.user`, serializers mark ownership
  and verification fields read-only, and owner-isolation tests cover the behavior. Migration:
  `backend/matching/migrations/0002_alter_manualreviewflag_student_and_more.py`.
- **Firebase client removal:** the SPA no longer bundles a Firebase SDK or reads/writes
  Firestore. Catalogue and source reads are API-first with a bundled offline fallback; there is
  no client-side catalogue seeding.
- **Catalogue/detail consistency:** the explorer and the detail page both read the Django
  catalogue, detail lookup uses the canonical slug, and API empty results, HTTP errors, and
  404s are no longer masked by static records.

## Blockers / not verified

- PostgreSQL-backed `pytest` needs a reachable, migrated database. CI provisions PostgreSQL 16;
  a green hosted run was not confirmed in this environment.
- Google OAuth requires configured credentials; the endpoints return 503 without them and a
  successful live provider flow was not tested.
- [`render.yaml`](../render.yaml) describes Render + PostgreSQL hosting, but no deployment,
  backup/recovery, monitoring, or alerting was verified.
- Scholarship source licensing, structured feeds, data freshness, and Indian opportunity
  coverage remain unresolved for several official portals.
- E2E covers routing, landing, and local auth-form validation; it does not cover successful
  live auth, cross-device persistence, save/tracker round-trips, or the full redirect flow.

## Documentation debt

Academic design, database, presentation, OS/network, and audit notes are maintained in the
ignored local `.local-docs/` pack. `docs/PROJECT_CONTEXT.md` is an older, pre-Django historical
snapshot; use the current documents linked from [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
for implementation claims.
