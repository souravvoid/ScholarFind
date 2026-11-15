# UI Backlog — ScholarFind

Live defect list for the continuous-improvement loop. Add/resolve as milestones land.
Rule: a defect moves to "Done" only after tests/build/verification evidence.

## Backlog (open)

| ID | Sev | Area | Defect | Milestone | Evidence |
|---|---|---|---|---|---|
| B-01 | P1 | Modals | No shared focus-trap/Escape/restore behavior across 4 dialogs + drawer | M8 | UX_AUDIT cross-cutting |
| B-02 | P1 | Explorer | Citizenship/coverage/verified-30d filters inert | M5 | `ScholarshipExplorer.tsx:122-127` |
| B-03 | P1 | Tracker | Dead-ends for catalogue-sourced ids (title/Apply no-ops) | M5 | `ApplicationTracker.tsx:131,166,291` |
| B-04 | P1 | Tracker | Last-item delete leaves ghost (snapshot zero-guard) | M3 | `AuthContext.tsx:164` |
| B-05 | P1 | Auth | Silent demo-persona swap on popup failure | M3 | `AuthContext.tsx:184-196` |
| B-06 | P1 | Auth | New users seeded with fabricated profile | M3 | `AuthContext.tsx:139-149` |
| B-07 | P1 | Auth | Sign-out leaves user residue in state/localStorage | M3 | `AuthContext.tsx:198-205` |
| B-08 | P1 | Landing | Hero search ignores inputs | M5 | `LandingPage.tsx:40-43` |
| B-09 | P1 | Profile | Wizard opens at step 2 | M5 | `ProfileBuilder.tsx:14` |
| B-10 | P2 | Builder | Fake stats (842/~840, WHED badges, region counts) | M4 | `ProfileBuilder.tsx:195,417-425,1108-1114` |
| B-11 | P2 | Save & Resume | Deleted in 2026-11-08 refactor — SaveResumeModal removed | M4 | N/A — component deleted |
| B-12 | P2 | Icons | ~100 material-symbol spans not `aria-hidden` | M8 | grep |
| B-13 | P2 | Builder | Form labels not associated | M8 | `ProfileBuilder.tsx:257-530` |
| B-14 | P2 | A11y | No `aria-live` mutation feedback (save/stage/audit) | M8 | grep `role="status"` |
| B-15 | P2 | Explorer | Default filter stack risk of empty grid on first paint | M5 ⚠needs user decision | `ScholarshipExplorer.tsx:79` |
| B-16 | P2 | Routing | Tab state not URL-addressable (Back exits site) | deferred (design decision) | `App.tsx:18-21` |
| B-17 | P2 | Tracker | Stale-closure payload on rapid doc toggles | M3 | `AuthContext.tsx:282-311` |
| B-18 | P2 | Boot | Unguarded `JSON.parse(localStorage)` crash | M3 | `AuthContext.tsx:74-81` |
| B-19 | P3 | Explorer | Card `<h3 onClick>` not keyboard-operable (tracker) | M5/M8 | `ApplicationTracker.tsx:165` |
| B-20 | P3 | Flags/emoji | Flag emoji announced letter-by-letter in modals/sources | M8 | `ScholarshipDetailsModal.tsx:77` |
| B-21 | P3 | Footer | Website/Email/Repository buttons inert; Privacy/Terms misroutes | M4/deferred | `Footer.tsx:33-61,77-89` |
| B-22 | P3 | Focus | `focus:outline-none` with no substitute (navbar brand, sort select) | M8 | `Navbar.tsx:52`, `ScholarshipExplorer.tsx:426` |
| B-23 | P3 | Motion | `prefers-reduced-motion` only covers 2 arc buttons (skeletons/entrances keep animating) | M8 | `index.css:339-342` |
| B-24 | P3 | Design | Tokens bypassed by hardcoded hex (`#6b7280` small labels ≈ borderline contrast) | M7/M8 sweep | `index.css:3-65` vs components |

## Done (rolled)

| ID | Area | Fix | Commit/verification |
|---|---|---|---|
| D-01 | Security | Catalogue writes are server-only; Firebase client removed | client is read-only via the Django API; `firestore.rules` is legacy |
| D-02 | Security | Redirect gate https+domain trust states | `afb0fe2` · lint/build/e2e green |
| D-03 | Honesty | Fake audit write removed; truthful copy | `afb0fe2` · e2e green |
