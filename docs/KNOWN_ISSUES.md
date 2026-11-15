# Known Issues and Verification Gaps

Observed 2026-11-15. See source links for the implementation evidence.

## Confirmed functional gaps

1. **Split persistence.** The SPA profile and saved/tracker state are browser-local while
   corresponding authenticated Django APIs exist. Cross-device/account persistence is not
   implemented in the inspected SPA path.
2. **Catalogue/detail lookup mismatch.** Explorer can load Firestore catalogue entries, but
   the detail page resolves against the static catalogue. Firestore-only records may not
   resolve to a details page. See
   [`src/components/ScholarshipExplorer.tsx`](../src/components/ScholarshipExplorer.tsx)
   and [`src/pages/ScholarshipDetailPage.tsx`](../src/pages/ScholarshipDetailPage.tsx).
3. **Eligibility profile linkage.** Backend evaluation accepts a profile in the request
   instead of loading the authenticated user's stored student profile.
4. **Default profile values.** The profile builder starts with example values; users may
   mistake them for their saved answers and receive misleading match results.
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

## Resolved in the current worktree

- **Matching record ownership:** aligned `ManualReviewFlag` and `WorkExperienceRecord`
  foreign keys with the `StudentProfile` resolved by the view, added migration
  `backend/matching/migrations/0002_alter_manualreviewflag_student_and_more.py`, and added
  owner-isolation regression tests. The targeted Django suite passed 4 tests. The broader
  PostgreSQL CI job has not yet run.

## Blockers / not verified

- PostgreSQL-backed Django tests errored in this environment due database setup/connection
  failure; a reachable, migrated test database is required to verify persistence.
- Google OAuth requires configured credentials and callback settings; a successful live
  provider flow was not tested.
- Firestore rules in source were reviewed, but deployed rules and emulator acceptance tests
  were not verified.
- No production deployment target, backup/recovery, monitoring, or alerting was verified.
- Scholarship source licensing, structured feeds, data freshness, and Indian opportunity
  coverage remain unresolved for several official portals.
- Current UI smoke tests do not cover the full successful auth, cross-device persistence,
  save/tracker, and redirect flows.

## Documentation debt

The root README and some architecture/status notes contained outdated claims about a
FastAPI-only/disconnected backend and overstated production readiness. Use the current
documents linked from [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md); legacy notes are
identified there.
