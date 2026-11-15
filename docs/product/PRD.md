# PRD — ScholarFind (as-is, v0 discovery)

**Status:** initial PRD reconstructed from verified code (commit `ce43c29`, 2026-11-08).
Every capability listed was traced in code. Marketing/fabricated numbers are excluded by design.

> **Historical:** this PRD predates the Django catalogue/auth migration and the removal of the
> Firebase client. Several rows below (Firestore reads, Google popup sign-in, guest demo
> persona, client-side seeding) no longer describe the code. Use
> [project status](../PROJECT_STATUS.md) and [system architecture](../SYSTEM_ARCHITECTURE.md) for
> current behavior; treat this document as the original product intent.

## 1. Vision

Let a student describe their academic profile **once** and see, explainably, which real
scholarship programs they plausibly qualify for — without a paywall, without opaque AI scores,
and with every rule traceable to an official program page. (Vision inferred from README intent +
implemented mechanics; the "10 live authoritative sources" part of the vision is **not yet
implemented** — ingestion exists only as simulated stubs.)

## 2. Target users

- **Student (primary):** international/postgrad applicant; wants shortlist + honest eligibility.
- **Anonymous visitor:** must get full value without an account (the app seeds a demo persona).
- **Program administrator (future/not served today):** would publish/verify listings — no
  surface exists; today the "admin" task is a fake client-side button.

## 3. Personas

| Persona | Goal | Current reality |
|---|---|---|
| Amara, 24, Nigerian ML grad, Guest | judge fit for funded UK/DE programs | works if she accepts demo persona; her typed inputs feed a real local engine |
| Alex, US undergrad, Google-verified | keep track of deadlines in one place | works locally; Firestore sync has sync/zero-deletion bug (T-saved-zero) |

## 4. Verified capabilities (MVP that already exists)

| # | Capability | Where it lives | Honest status |
|---|---|---|---|
| F1 | Static verified catalogue (9 programs, real program data links) | `scholarshipsData.ts` | works; static |
| F2 | Catalogue persists to/as reads from Firestore with fallback | `databaseService.ts` | works (read path only, seeds public writes) |
| F3 | Explorer: text search, country/level/award/deadline filters, sort, match badge | `ScholarshipExplorer.tsx` | works; citizenship/coverage/30-day filters are inert |
| F4 | Deterministic eligibility engine (6 grading scales, citizenship rules, degree prereqs, academic cutoff, MOI/language, work experience, manual-review routing, match %, rubric breakdown) | `eligibilityEngine.ts` | works; backend twin diverges |
| F5 | Profile builder: 4 steps (identity/academics/language/review), live GPA normalization | `ProfileBuilder.tsx` | works; opens on step 2, contains fabricated stats |
| F6 | Save/tracker: stages (Interested→Applied), documents checklist, notes, persisted per user | `ApplicationTracker`, `AuthContext` | works; stale-write + snapshot-zero bugs |
| F7 | Auth: Google popup sign-in, per-user Firestore profile/saves, guest demo persona | `AuthContext.tsx` | works; silent demo fallback misleads, sign-out leaves residue |
| F8 | Detail modal: rubric per criterion with explanation + official source link | `ScholarshipDetailsModal.tsx` | works |
| F9 | External-redirect guard modal (disclaimer + proceed) | `OfficialRedirectModal.tsx` | works; validation is cosmetic |
| F10 | Landing page (marketing) with e2e smoke coverage | `LandingPage.tsx`, `tests/e2e` | works |

## 5. Not real (fabricated UI — must be removed or built for-truth)

- "Audit & Refresh" live-source sync on Sources page (`databaseService.ts:206-266`) — writes a
  fake log with a fake ingested count; says "Stored in Firestore".
- Hardcoded stats: 842/840 awards, 342/215/… country counts, `total_count: 1428`, WHED badges,
  region-opportunity counts, "verified" source statuses with fake timestamps.

## 6. Functional requirements (next release scope)

FR-1 Catalogue integrity: public reads only; **all writes via admin/service identity**;
seeded docs carry a real `lastVerified` date; 30-day "recently verified" filter works off a real date.
FR-2 Explorer filters all honest: define `coverage` filter ("any" default) and either implement
citizenship prefilter or remove the control; wire hero search fields into explorer presets or
remove them.
FR-3 Tracker: resolve saved items from the loaded dataset (not just the static file) so detail/
Apply actions never dead-end; state reaches an empty list reliably (fix snapshot guard).
FR-4 Auth honesty: on sign-in failure show the error (no silent persona swap); brand-new users
start with an **empty** profile (no fabricated GPA/institution); sign-out clears profile+saves state.
FR-5 Connected fix milestones in `TEST_STRATEGY.md`: AuthContext tree (save/unsave/stages/notes),
engine result correctness for changed rules, explorer filtering golden cases.
FR-6 Remove fake flows FR-5 data: delete Save-Resume theater and fake audit button, or replace
with honest placeholders ("coming soon").
FR-7 Accessibility baseline: focus trap + Escape + restore in all dialogs; icon spans
`aria-hidden`; profile form labels associated; `aria-live` for save/tally feedback.

## 7. Non-functional requirements

- Deterministic, explainable matching (no AI scores) — keep.
- Works fully offline without account (static data fallback) — keep.
- No secrets in repo; Firebase web config (public) + restricted API keys.
- a11y: keyboard-operable dialogs, AA contrast for text.
- Bundle: remove `three`, `motion`, `@google/genai`, `express`, `dotenv`
  (verified unused — removed 2026-11-08). `lucide-react` is **used** (icons via
  `src/components/ui/Icon.tsx`) and must stay.

## 8. Acceptance criteria (spot checks)

- With rules deployed, an unauthenticated browser cannot create/update any `scholarships/*`
  doc (Firestore emulator test).
- Deleting the last saved item from a second tab updates the first tab to 0 items.
- A profile with German 2.5 returns the same normalized % from the parity fixture for TS and PY
  engines (one golden-table test).
- Keyboard-only: open detail modal from explorer card, close with Escape, focus returns to card.

## 9. Constraints & exclusions

- Catalogue stays 9 static records until a real, license-clearing ingestion source is wired
  (server-side, idempotent, robots/ToS-compliant). Out of scope for next release.
- No new pays/no auth-backend beyond Firebase. No URL routing for v-next (nice-to-have later).
- Mobile app native packaging: excluded.

## 10. Roadmap split

- **MVP (already):** F1–F10 minus "not real" items.
- **Next release:** FR-1..FR-7 (integrity, honesty, correctness, a11y baseline).
- **Long-term:** real server-side ingestion from ≥1 authoritative source; single shared engine
  source of truth; program-admin publishing flow; real Save & Resume.
