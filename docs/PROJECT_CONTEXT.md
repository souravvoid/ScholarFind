# ScholarFind — Project Context (verified)

> **Historical snapshot:** This document reflects the pre-Django-migration state and is not
> authoritative for the current implementation. Use [the current documentation index](DOCUMENTATION_INDEX.md)
> and [project status](PROJECT_STATUS.md) for audited architecture, feature state, and test
> results. Reconcile this snapshot before using its implementation claims.

> Knowledge doc for AI/developer sessions. Everything below was verified against the code on
> 2026-11-08 (commit `ce43c29`). Claims that could not be verified in code are marked
> **UNVERIFIED-CLAIM**. Update this file when implementation changes.

## What the product actually is

ScholarFind is a **client-side scholarship discovery app**: React 19 + Vite + Tailwind v4 SPA
talking **only** to Firebase (Auth + Firestore). It ships a static catalogue of **9 hardcoded
scholarships** (`src/data/scholarshipsData.ts`), a deterministic eligibility engine in TypeScript
(`src/utils/eligibilityEngine.ts`), a 4-step profile builder, an explorer with filters, an
application tracker, a sources/transparency page, and Google sign-in. Anonymous visitors get a
hardcoded demo persona so the app is fully usable without an account.

A second, **disconnected** product exists: a Python FastAPI backend (`backend/`) with its own
copy of the eligibility engine and a stubbed ingestion pipeline (no HTTP clients, no DB), plus a
dead TS ingestion module (`src/utils/ingestion/`, test-only). Neither is reachable from the UI.

## Verified architecture (as-is)

```
React SPA ──Firebase Auth (Google popup; silent demo fallback)──▶ Firestore
   │                  users/{uid}/profile/data  (owner-locked)            ▲
   │                  users/{uid}/saved_scholarships (onSnapshot)         │ public write rules
   └──Firestore reads/writes: scholarships+scholarship_sources+ingestion_logs+test ─┘
       (client-side seeding writes static data into these collections)

backend/ FastAPI (uvicorn, not run by any script, never called by the SPA)
   ├── /api/v1/health /sources /schtolarships(stub) /evaluate
   └── deterministic engine (Python) — divergent from the TS engine
```

- SPA has **zero** `fetch`/`axios` calls to the backend (grep-verified).
- `backend/` has **no** requirements.txt, no run wiring, no DB engine — SQLAlchemy models and
  import-fallback stubs are dead weight.
- Two divergent eligibility engines decide the same verdict with different numbers
  (UK 1st: TS 95 → PY 85; German 2.5: TS 66.7 → PY 62.5; unknown ruleType: TS auto-pass → PY
  manual review). See `docs/engineering/TECHNICAL_DEBT.md`.

## Directory map

| Path | Role | Verification |
|---|---|---|
| `src/App.tsx` | tab router (no URL routing), modal hosts | verified |
| `src/components/LandingPage.tsx` | Arc-US marketing landing (redesigned 2026-11) | verified |
| `src/components/ScholarshipExplorer.tsx` | catalogue grid + filters (3 filter controls are inert) | verified |
| `src/components/ProfileBuilder.tsx` | 4-step profile wizard (opens on step 2; fake stats) | verified |
| `src/components/ApplicationTracker.tsx` | saved list, stages, docs checklist, notes | verified |
| `src/components/ScholarshipDetailsModal.tsx` | rubric breakdown, save, redirect guard | verified |
| `src/components/OfficialRedirectModal.tsx` | external-link gate (no scheme/allowlist check) | verified |
| `src/components/SaveResumeModal.tsx` | **fake** "resume link emailed" flow (setTimeout) - deleted in 2026-11-08 refactor | deleted |
| `src/components/HeroGlobe3D.tsx` | Three.js globe — **dead code**, zero importers - deleted in 2026-11-08 refactor | deleted |
| `src/components/Dialog.tsx` | UI dialog component - deleted in 2026-11-08 refactor (no importers) | deleted |
| `src/components/Field.tsx` | UI FormField components (Input, Textarea, Select) - deleted in 2026-11-08 refactor (no importers) | deleted |
| `src/components/PageHeader.tsx` | Consistent page intro component - deleted in 2026-11-08 refactor (no importers) | deleted |
| `src/context/AuthContext.tsx` | demo persona, Firestore profile/saved CRUD, listener leak | verified |
| `src/services/databaseService.ts` | Firestore catalogue reads + client-side seeding + fake audit | verified |
| `src/utils/eligibilityEngine.ts` | TS eligibility engine (product truth today) | verified |
| `src/utils/ingestion/` | TS ingestion framework — **test-only dead code** | verified |
| `src/data/scholarshipsData.ts` | 9 hardcoded scholarships (only catalogue the UI uses) | verified |
| `src/data/sourcesData.ts` | 10 hardcoded source stats (mock counts) | verified |
| `backend/*` | FastAPI + divergent engine + simulated adapters | verified |
| `firestore.rules` | owner-scoped user data ✅; catalogue **world-writable** ✗ | verified |
| `firebase-applet-config.json` | historical Firebase web config, removed from current tree | verified |
| `tests/e2e/landing.spec.ts` | 4 Chromium smoke tests, landing only | verified |

## Commands

```bash
npm run dev            # Vite dev server, port 3000 (the product)
npm run build          # production build to dist/
npm run lint           # tsc --noEmit (no "strict" in tsconfig)
npm test               # tsx frontend tests, then python backend tests
npm run test:e2e       # (not in package.json) npx playwright test
bun install            # dependency install (bun.lock; npm works too)
python3 -m unittest discover -s backend/tests -v   # backend suite
```

Backend has no launcher (`uvicorn backend.main:app` works only if fastapi is installed; without
it the module silently no-ops).

## Conventions

- Tailwind utility classes with hardcoded hex over the `@theme` tokens (`src/index.css`) —
  tokens exist but are largely bypassed.
- Material Symbols `"chevron_right"` icon font via `<span class="material-symbols-outlined">`.
- Commit style: `feat(scope):`, `fix(scope):`, `refactor(scope):`.
- Tests: frontend `node:test` via `tsx --test`; backend `python3 -m unittest`.

## Critical known issues (top 3)

1. **firestore.rules:44-67** — `scholarships`, `scholarship_sources`, `ingestion_logs`, `test`
   are publicly writable → the "verified" catalogue and official-application URLs can be forged
   by anonymous clients. This is a pre-Django historical claim, not a finding about the active
   Django API; the old audit is not part of the maintained public documentation.
2. **Client-side seeding** (`databaseService.ts:97-129`) writes the catalogue from any browser.
3. **Engine divergence TS/PY** (`eligibilityEngine.ts:28-40` vs `eligibility.py:143-161`) —
   same applicant+rule-set yields different verdicts.

Full ranked register: `docs/engineering/TECHNICAL_DEBT.md` and `docs/engineering/ROADMAP.md`.
