# Page-by-Page Implementation Plan (v1)

Companion to `docs/DESIGN_BRIEF.md`, `docs/DESIGN_SYSTEM.md`, `docs/SITEMAP.md`.
Sequence: **shell first, then one page per reviewable commit** (decision 8).

Every step's definition of done (DoD): `npm run lint`, `npm run test:frontend`,
`npm run build`, `npx playwright test` all green, plus a screenshot check at 375 / 768 /
1440 for touched routes. Never weaken a test to pass.

## Step 0 — Foundation (shared shell, tokens, primitives)

Scope:
- deps: `react-router-dom`, `lucide-react`, Fontsource (`inter`, `space-grotesk`,
  `jetbrains-mono`).
- `src/index.css`: rewrite `@theme` to the token contract in `docs/DESIGN_SYSTEM.md`;
  remove unused M3/Manrope tokens after pages migrate.
- new `src/components/ui/*` primitives (Button, Icon, Chip, Badge,
  Card, EmptyState, Skeleton, ErrorPanel, Container) and
  `src/components/layout/{AppShell,TopNav,MobileDrawer,Footer}`.
  (Step 0 originally also scoped Field, Select, Textarea, Row, Dialog, PageHeader —
  Field, Dialog, PageHeader and the `Row` export were deleted 2026-11-08, zero
  importers; see `docs/DELETION_LOG.md`.)
- `src/App.tsx`: router with `/`, `/explore`, `/scholarship/:id`, `/tracker`, `/sources`, `*`;
  keep `AuthProvider`.
- `index.html`: drop Google Fonts + Material Symbols links; self-host fonts.
- Navbar: convert to router links; keep drawer behavior, move it into `MobileDrawer`.

Acceptance: every route reachable by URL and refresh; nav/drawer keyboard + focus correct;
zero Material Symbol spans in shell files; no Google Fonts network request; existing 4 e2e
tests still pass (selectors may need `getByRole('link')`).

Risk: token rename touches every component — but components are migrated page-by-page in
later steps, so only shell compiles against new tokens here.

## Step 1 — Auth/state hardening (M3) — before pages depend on it

Why early: explorer save, tracker rows, and wizard results all read `AuthContext`. Fixing it
after the UI would mean rebuilding page logic twice.

Scope (`src/context/AuthContext.tsx`, `src/services/databaseService.ts` readers):
- remove silent demo-persona fallback → explicit error + retry; guest = device-local.
- remove fabricated new-user profile seeding (empty profile, starts wizard at step 1).
- fix saved-list listener leak (store + call unsubscribe).
- fix zero-length snapshot ghost row (clear on empty).
- guard `JSON.parse` of localStorage (corrupt → discard + notice).
- stage/checklist writes built from current state (functional update / transaction).
- clear profile + saves + storage on sign-out.
- honest copy: guest = "Saved on this device"; signed-in = "Synced to your account" only
  after a confirmed write.

Acceptance: unit tests for storage guard + removal of demo path (extend existing suite);
manual: sign-out leaves no residue, last-item delete clears UI, rapid toggles persist last
value. No behavior added beyond fixes.

## Step 2 — Landing (`/`)

Scope: `src/components/LandingPage.tsx` rebuilt on primitives; real featured records
(nearest 3 from the loaded catalogue); derived counts only; profile-first hero
(`Find my matches` primary, `Browse all {n}` secondary); signed-in compact variant;
footer links made real (B-21).
Tests: update `tests/e2e/landing.spec.ts` (hero quote assertion, `Step 2 of 4` → `Step 1 of
4` once wizard fix lands in Step 7 — sequence note below), add nav-link reachability.

Acceptance: no invented number or badge in rendered DOM; hero CTA opens wizard; browse CTA
navigates to `/explore`; responsive 320/375 no overflow.

## Step 3 — Explorer (`/explore`)

Scope: `src/components/ScholarshipExplorer.tsx` → dense rows on `Row`; wire all filters
(decision: no defaults), hero-intent params, chips, sort, derived count, skeletons, empty
state, save toggle with `aria-pressed`; remove fake country counts (B-02, B-08, B-15, B-19).
Tests: new e2e — filter narrows results, clear restores all, URL reflects filters, empty
state reachable and recoverable.

Acceptance: every visible control has an effect; count always matches rendered rows; deep
link with params reproduces the view; no `<h3 onClick>`.

## Step 4 — Detail (`/scholarship/:id`)

Scope: new page composed from `ScholarshipDetailsModal` content (rubric, deadline, funding,
provenance, actions) + `OfficialRedirectModal` gate; unknown-id state; sticky mobile action
bar; then delete `ScholarshipDetailsModal.tsx` and its usages (decision 11).
Tests: e2e — open record from explorer by URL click, rubric visible, gate opens and
verified/mismatch states render, unknown id shows recovery action.

Acceptance: no modal-in-modal; back restores explorer with filters intact; apply is gated.

## Step 5 — Tracker (`/tracker`)

Scope: `src/components/ApplicationTracker.tsx` on primitives; fix dead-ends for non-catalogue
ids (explain + working provenance link or no action), keyboard-operable titles, stage
control, checklist/docs with live-region feedback, honest persistence notice, empty state
(B-03, B-04, B-17, B-19).
Tests: e2e — save from explorer → tracker row appears with deadline; stage change persists
after reload (signed-out device case); remove clears row and shows empty state.

Acceptance: zero silent no-ops; stage changes announce; guest data survives reload.

## Step 6 — Sources (`/sources`)

Scope: `src/components/SourceTransparency.tsx` → informational provenance page; remove the
`triggerLiveSourceSync` button and its service function if unused (decision 14); derived
coverage numbers; last-audited dates from real fields only.
Tests: source list renders, every provenance link goes through the gate or is a plain link
to a verified source record.

Acceptance: no button claims a sync; no fabricated audit state.

## Step 7 — Profile wizard (`ProfileBuilder` modal)

Scope: start at step 1 (B-09); associate every label (B-13); remove fake stats and WHED
badges (B-10); honest save copy per Step 1; results step on primitives with rubric
explanation and "what you're missing"; wizard resume from device storage only.
Tests: e2e — open wizard, complete step 1 → step 4, results render real verdicts; landing
e2e `Step 1 of 4` assertion updated here (synchronize with Step 2 note).

Acceptance: no fabricated data in wizard DOM; keyboard-only completion possible; Escape
closes with confirmation if answers exist.

## Step 8 — A11y + responsive sweep (global)

Scope: icons `aria-hidden` (B-12, B-20), `aria-live` for save/stage/audit (B-14), focus
rings (B-22), reduced-motion coverage (B-23), remaining hardcoded hexes → tokens (B-24),
dialog focus trap applied everywhere (B-01), 44 px targets, contrast check on every muted
label.
Tests: keyboard-only walkthrough of all routes; axe smoke check if a runner is added
(optional, no paid service); screenshots 320/375/768/1024/1440.

Acceptance: zero `focus:outline-none` without replacement; zero unlabelled icon buttons;
no horizontal scroll at 320 px; all status feedback announced.

## Step 9 — Verification pass

- Full e2e suite (landing, explorer filters, detail + gate, tracker lifecycle, sources).
- Visual pass on every route at 3 widths, checked against this design system.
- Update `docs/UI_BACKLOG.md` (move fixed IDs to Done), `docs/ai/WORK_STATUS.md`,
  `docs/UX_AUDIT.md` (resolved findings), `docs/engineering/ROADMAP.md` (mark M4/M5/M3/M8).

## Sequencing notes

- **Retirements need one explicit confirmation** (removing functionality): `SaveResumeModal`
  (deleted in 2026-11-08 refactor — theater flow removed), `ScholarshipDetailsModal` (replaced by route), Sources audit button. Listed here
  for approval; then they are deleted in Steps 4–6.
- `tests/e2e/landing.spec.ts` asserts `Step 2 of 4`; it gets updated in Step 7 with the
  wizard fix, not before, so the guard stays meaningful.
- Backend/FastAPI untouched at the time of this page plan; the later Django migration replaced
  it (see `docs/SYSTEM_ARCHITECTURE.md`).
- Open product decisions still pending (engine parity, backend keep/archive) are **not**
  required for these steps; the UI must surface verdicts honestly either way.
