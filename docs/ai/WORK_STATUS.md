# Work Status — ScholarFind

Session log for the design/engineering agent. Read this first in a new session.
Companion docs: `AGENTS.md`, `docs/DESIGN_BRIEF.md` (once approved),
`docs/DESIGN_SYSTEM.md`, `docs/SITEMAP.md`, `docs/UX_AUDIT.md`, `docs/UI_BACKLOG.md`,
`docs/engineering/ROADMAP.md`.

## Current phase

**Design-agent phase — Step 0 (foundation) + Step 1 (auth/state) done. Next: Step 2 (Landing).**
Remaining steps: 2 Landing, 3 Explorer, 4 Detail route, 5 Tracker, 6 Sources, 7 Profile wizard,
8 A11y/responsive sweep, 9 verification.

## Done

| When | What | Commit |
|---|---|---|
| 2026-11-08 | Arc-inspired landing/nav/footer redesign + Playwright e2e suite | `ce43c29` |
| 2026-11-08 | Discovery deliverables (PRD, architecture, debt, security, test strategy, roadmap) | `55ab397` |
| 2026-11-08 | **M1 catalogue integrity**: catalogue/sources/logs read-only rules, no client seeding, read-shape validation, honest audit flow, redirect gate verified/mismatch/blocked | `afb0fe2` |
| 2026-11-08 | `docs/UX_AUDIT.md` (journey defects, file:line) + `docs/UI_BACKLOG.md` (B-01…B-24) | prior commit |
| 2026-11-08 | Step 0 — router shell, tokens, ui primitives, lucide, self-hosted fonts; 8/8 e2e green | Step 0 commit |
| 2026-11-08 | Step 1 — auth/state hardening (demo fallback removed, guarded storage, leak + stale writes fixed) | Step 1 commit |

Verified after M1: `npm run lint` clean · unit 22/22 · build green · e2e 4/4 ·
8/9 catalogue URLs gate `verified`, gates-cambridge `mismatch` (allied portal, warns).

## In progress

1. **Design questionnaire (batch 1)** — structure, navigation model, Arc influence, icon
   system, catalogue-honesty scope, rollout order. Answers → `docs/DESIGN_BRIEF.md`.

## Blocked / awaiting decisions

| Item | Needs |
|---|---|
| Firestore rules deploy | Owner runs `firebase deploy --only firestore:rules` (needs `firebase.json`); live project still on old rules |
| M2 engine parity (TS vs Python eligibility) | Canonical values: UK 1st 95 vs 85, German 2.5 → 66.7 vs 62.5, unknown ruleType auto-pass vs manual-review |
| M6 backend keep vs archive | Product decision |
| B-15 default explorer filters | Design decision (risk of empty first paint) |
| B-16 URL routing (B-16) | Design decision |
| Icon migration Material Symbols → Lucide | Design decision (user stated Lucide preferred) |
| Remove sign-in demo-persona fallback | Removes existing behavior → needs approval |

## Next after answers

Write `docs/DESIGN_BRIEF.md`, `docs/DESIGN_SYSTEM.md`, `docs/SITEMAP.md` + page-by-page plan →
approve → implement in milestone order: M4 honesty removals → M5 inert controls/dead-ends →
M3 auth/state fixes → M8 a11y baseline → M7 token sweep.

## Rules reminder

- DoD: `npm run lint`, `npm run test:frontend`, `npm run build`, `npx playwright test` green.
- Never delete/weaken tests; never fabricate stats/metrics; no `dangerouslySetInnerHTML`;
  external links only through `OfficialRedirectModal`.
- `tests/e2e/landing.spec.ts` asserts `Step 2 of 4` — update together with B-09.
