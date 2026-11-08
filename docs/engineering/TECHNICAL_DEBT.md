# Technical Debt Register — ScholarFind (discovery, 2026-11-08)

Severity: P0 blocker · P1 high · P2 medium · P3 low. "Verified" = traced in code.
Fix options include trade-offs. Owners: Technical Lead (integration), sized for small milestones.

## Risk register (top 10, ranked)

| # | Sev | Issue | Evidence | Fixed by |
|---|---|---|---|---|
| R1 | P0 | Public write access to catalogue/sources/logs lets anyone forge "verified" programs + phishing URLs behind the app's own trust banner | `firestore.rules:44-67`; `databaseService.ts:152,206-266`; `OfficialRedirectModal.tsx:20-33` | M1 |
| R2 | P0 | Two divergent eligibility engines → wrong verdicts (UK 1st 95 vs 85; German 2.5 → 66.7 vs 62.5; ECTS 2.0 → 85 vs degenerate 2.0; unknown ruleType auto-pass vs manual-review; language thresholds ignored in TS) | `eligibilityEngine.ts:28-40,251-257,298-305` vs `eligibility.py:143-161,618,636-646` | M2 |
| R3 | P1 | AuthContext correctness: listener leak → cross-user ghost saves; deletes never sync to zero; stale-closure Firestore writes; unguarded JSON.parse crashes boot | `AuthContext.tsx:75-81,157-174,282-311` | M3 |
| R4 | P1 | Fake features presented as real: **Deleted in M4 refactor** — Save&Resume email theater flow removed, "Audit & Refresh" fake ingest log removed, 842/840/342-stats removed, WHED badges removed, `total_count:1428` removed | `SaveResumeModal.tsx:24-33` (deleted); `databaseService.ts:219` (removed); `ProfileBuilder.tsx:195,1108-1114` (stats removed); `backend/main.py:209` (removed) | M4 (resolved) |
| R5 | P1 | Inert UI controls: hero search discards input; explorer citizenship/coverage/verified-30d filters do nothing; tracker dead-ends for non-static ids | `LandingPage.tsx:40-43,105-128`; `ScholarshipExplorer.tsx:121-127,143-190`; `ApplicationTracker.tsx:131,166,291` | M5 |
| R6 | P1 | Auth honesty: silent demo-persona swap on sign-in failure; new users pre-seeded with fabricated academic profile; sign-out leaves residue | `AuthContext.tsx:184-196,139-149,198-205` | M3 |
| R7 | P1 | Backend security posture: unauth admin ingest, no rate limits, evaluate 500s, wildcard CORS | `main.py:64-71,104-116,119-164` | M6 |
| R8 | P2 | Dead weight shipped/maintained: **Deleted in M7 refactor** — `HeroGlobe3D` (three.js) removed, unused deps (`three`,`motion`,`@google/genai`,`express`,`dotenv`) removed, plus `@types/express`,`@types/three`,`autoprefixer`,`@testing-library/user-event` — bundle costs & copy-drift resolved. `lucide-react` is **used** (icons via `Icon.tsx`) and stays. `src/utils/ingestion/*` NOT removed — still referenced by its tests and `pipeline.ts`/`validators.ts` barrel; removal still pending → see candidates below | grep $production_deps$ ; `vite.config.ts` | M7 (partially resolved) |
| R9 | P2 | Data-integrity in simulated pipeline: currency double-conversion (~30% inflation), monthly stipend = annual/12 mislabel, `+60d` fabricated deadlines | `csc_uk.py:261-262`+`pipeline.py:278-281`; `normalizers.ts:81-88,44,62` | M6 |
| R10 | P2 | A11y gaps: no focus trap/Escape in 4 dialogs; ~100 unlabeled icon spans; unassociated form labels; heading skips; no aria-live | `ScholarshipDetailsModal.tsx:69-72`, `ProfileBuilder.tsx:257+`, grep icons | M8 |

## Queue beyond top-10

- P2 No `strict` tsconfig; ambient `jest` types while tests run node:test (`tsconfig.json:7`).
- P2 `npm test` chain silently skips backend on frontend failure (`package.json:14`).
- P2 unit tests import Firebase SDK at module load (no mocks) → env-coupled (`databaseService.test.ts:3-8`).
- P2 No CI at all (`/.github` absent); e2e only landing, Chromium-only.
- P3 `storage.ts:43` no-op `clear;` statement; dead imports (`databaseService.ts:9-11`, `main.py:41-45`).
- P3 Footer buttons without destinations; README claims (Three.js hero, robots.txt ingestion,
  SQLAlchemy, zero-trust catalogue) contradict code — **README Three.js claim fixed 2026-11-08**;
  other claims still to verify after fixes.
- P3 name `"react-example"` + AI-Studio scaffold artifacts (`metadata.json`).

## Removal candidates (deletion beats addition)

| Item | Why safe | Check before acting |
|---|---|---|
| `src/components/HeroGlobe3D.tsx` | **deleted 2026-11-08** (zero importers) | none — done |
| `src/components/ui/{Dialog,Field,PageHeader}.tsx` + `Row` export | **deleted 2026-11-08** (zero importers) | none — done |
| `src/utils/ingestion/*` | still referenced by its tests and `pipeline.ts` | keep tests until M2 parity line chosen; delete module+tests together |
| deps `three`,`motion`,`@google/genai`,`express`,`dotenv`,`@types/express`,`@types/three`,`autoprefixer`,`@testing-library/user-event` | **removed 2026-11-08** (grep-verified unused) | none — done |
| deps `lucide-react`,`@types/jest`,`esbuild` | still in use (`Icon.tsx` / test types / vite transitive) | build still green after removal — do NOT remove `lucide-react` |
| `backend/models.py` SQLAlchemy schema | no DB engine/usage anywhere | keep only if backend direction chosen; else delete with stubs |
| fallback import stubs (`main.py`,`models.py`,`schemas.py`) | hide real breakage | replace with `requirements.txt` + fail-loud imports |
