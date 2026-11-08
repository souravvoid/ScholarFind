# UX Audit — ScholarFind (verified, 2026-11-08)

Source: frontend/QA audit + discovery audit; every item verified in code (file:line) and
confirmed by Technical Lead. Split per the product-agent protocol:
**[J] = confirmed user-journey defect, [P] = verified causes for user pain (fix without asking),
[D] = pending design preference, [A] = assumption needing user/human validation.**

## Journey: discover → shortlist

| Sev | Type | Problem | Evidence |
|---|---|---|---|
| P1 | [J] | Hero search discards degree/field input; lands on unfiltered explorer pretending to search | `LandingPage.tsx:40-43,105-128` |
| P1 | [J] | Three visible filter controls do nothing: applicant citizenship, coverage type, "verified within 30 days" (only shows a removable tag) | `ScholarshipExplorer.tsx:122,124,127` vs filter fn `:143-190` |
| P2 | [J] | Default filter stack (UK+DE, ≥$25k, 1–3 months, masters) can present an empty grid to first-time visitors with 9 records | `ScholarshipExplorer.tsx:79` defaults ⚠[A] funnel risk |
| P2 | [J] | First-paint filters use static `daysRemaining`; results can appear then vanish after the DB fetch normalizes | `ScholarshipExplorer.tsx:79` + `databaseService.ts` |
| P2 | [J] | Clickable card titles are `<h3 onClick>` — invisible to keyboard in tracker (explorer has duplicate visible CTA) | `ApplicationTracker.tsx:165-170`, `ScholarshipExplorer.tsx:813-818` |
| P3 | [A] | Country counts (342/215/184…) and "842 grants" imply a scale that doesn't exist (9 records) | `ScholarshipExplorer.tsx:575`, `ProfileBuilder.tsx:195` |

## Journey: profile → eligibility verdict

| Sev | Type | Problem | Evidence |
|---|---|---|---|
| P1 | [J] | Profile wizard opens on Step 2 ("matching screenshot"); Step 1 (citizenship) is only reachable via Back | `ProfileBuilder.tsx:14` |
| P1 | [J] | Sign-in failure silently swaps in a demo persona without setting `currentUser` — UI shows "Sign In" while matching silently uses fabricated data | `AuthContext.tsx:184-196` |
| P1 | [J] | New verified users are pre-seeded with a fabricated academic profile (GPA 3.82, University of Ibadan, ML keywords) → misleading verdicts | `AuthContext.tsx:139-149` |
| P2 | [J] | Form labels are not programmatically associated (no htmlFor/wrapping) across the builder | `ProfileBuilder.tsx:257-303, 404-530` |
| P2 | [A] | "Auto-saved to Firestore" copy is unconditional; guests save to localStorage only | `ProfileBuilder.tsx:1152-1155` |
| P2 | [A] | "WHED Listed"/WES-ENIC attribution badges fire on any typed institution string | `ProfileBuilder.tsx:417-425,491` |

## Journey: save → track → apply

| Sev | Type | Problem | Evidence |
|---|---|---|---|
| P1 | [J] | Tracker dead-ends for saved items whose id isn't in the static file: title click and "Apply at Provider" are guarded no-ops, no feedback | `ApplicationTracker.tsx:131,166,291-295` |
| P1 | [J] | Deleting the last saved item doesn't clear UI (snapshot guard only applies non-empty lists) → ghost item persists until reload | `AuthContext.tsx:164` |
| P2 | [J] | Rapid checklist toggles can persist stale notes/doc state (payload built from pre-update closure; no transaction) | `AuthContext.tsx:282-311` |
| P2 | [J] | Sign-out keeps previous user's profile+saves in state and localStorage (next anonymous visitor sees them) | `AuthContext.tsx:198-205,73-111` |
| P3 | [J] | Saved-list Firestore listener leaks per sign-in (unsubscribe return value ignored) — correctness+perf | `AuthContext.tsx:127-182` |

## Journey: reach official application

| Sev | Type | Problem | Evidence |
|---|---|---|---|
| P2 | [P→fixed M1] | Redirect gate previously claimed "verified/lock" for any parseable URL; now gate is verified/mismatch/blocked (`afb0fe2`) | `OfficialRedirectModal.tsx:20-40` |
| P3 | [A] | Allied-portal warning wording needs a student-comprehension check (jargon "audited origin") | `OfficialRedirectModal.tsx:63-102` |

## Cross-cutting

| Sev | Type | Problem | Evidence |
|---|---|---|---|
| P1 | [D] | No unified dialog behavior: no focus trap, no Escape (except drawer), no focus restore, 5 surfaces implement overlays differently | `OfficialRedirectModal.tsx:44-48`, `ProfileBuilder.tsx:154`, `Navbar.tsx:226-243` |
| P2 | [P] | ~100 Material Symbols icon spans announced by screen readers; only ~7 have `aria-hidden` | grep across `src/components` |
| P2 | [P] | No `aria-live` on save/unsave/stage-change/audit feedback (single `role="status"` in explorer loading only) | `ScholarshipExplorer.tsx:761` |
| P2 | [P] | Tab state isn't URL-addressable; refresh loses place, Back exits the site | `App.tsx:18-21` (no router) ⚠[A] acceptable for v-next? |
| P3 | [D] | Boot crash if localStorage JSON corrupt (`AuthContext.tsx:74-81`) ⚠ being fixed in M3 | |
| P3 | [D] | Fonts (Space Grotesk/JetBrains/Inter), Material symbols require network; no offline fallback stack issue | `index.html:14-16` |

## Unnecessary steps / simplification opportunities

1. Landing hero form duplicates the explorer's filter UI without carrying intent (either wire or cut).
2. Tracker rows require opening a second modal to act; detail modal has the same "Apply" action — one consistent apply path could reduce double-modal hops (design decision pending).
3. Sources page is informational; its only interactive button (Audit & Refresh) is now an honest local check — could become plain provenance text.
