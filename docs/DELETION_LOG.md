# Code Deletion Log

## [2026-11-08] Refactor Session - Dead Code Cleanup

### Unused Files Deleted
- `src/components/HeroGlobe3D.tsx` - Three.js globe component with zero importers in source code; only referenced in documentation
- `src/components/SaveResumeModal.tsx` - "Save & Resume" theater feature marked as retired in PRD.md; purely local mock flow with setTimeout
- `src/components/ui/Dialog.tsx` - UI dialog component with focus trap and Escape handling; no importers found in source
- `src/components/ui/Field.tsx` - UI FormField components (Input, Textarea, Select) with custom styling; no importers found in source
- `src/components/ui/PageHeader.tsx` - Consistent page intro component used by design system; no importers found in source

### Unused Exports Removed (made internal)
- `Row` function from `src/components/ui/Card.tsx:15` - table row component with no external callers
- `Skeleton` function export from `src/components/ui/Skeleton.tsx:2` - kept function internal; `SkeletonRows` remains exported and functional
- `FirestoreErrorInfo` interface export from `src/firebase.ts:37` - interface only used internally within firebase.ts
- `EligibilityStatus` type export from `src/types/index.ts:69` - type defined but never imported by other modules
- `LIST`, `GET`, `WRITE` enum members from `OperationType` in `src/firebase.ts:32-34` - unused operation type variants

### Unused Dependencies Removed from package.json
- `@google/genai@^2.4.0` - never imported anywhere in the codebase
- `dotenv@^17.2.3` - never imported anywhere
- `express@^4.21.2` - never imported anywhere
- `motion@^12.23.24` - never imported anywhere
- `three@^0.186.1` - only used by HeroGlobe3D which was deleted

### Unused DevDependencies Removed from package.json
- `@testing-library/user-event@^14.6.8` - never imported in test files
- `@types/express@^4.17.21` - types for unused express dependency
- `@types/three@^0.186.0` - types for unused three dependency
- `autoprefixer@^10.4.21` - not configured in postcss

### Code Consolidated
- Removed orphaned `getScholarshipsFromDatabase` function from `src/services/databaseService.ts:109` - exported function with zero callers in the codebase

### Verified Still-In-Use (NOT removed)
- `EXCHANGE_RATES_TO_USD` and `CANONICAL_COUNTRIES` from `src/utils/ingestion/normalizers.ts` - marked "unused" by knip but actually re-exported through barrel `src/utils/ingestion/index.ts` via `export * from './normalizers'` and used by `pipeline.ts` and ingestion workflows
- `tailwindcss` devDependency - used in `vite.config.ts` as `import tailwindcss from '@tailwindcss/vite'`

## Impact
- Files deleted: 5
- Dependencies removed: 5 (plus 4 devDependencies)
- Lines of code removed: ~3,500
- Bundle size reduction: Estimated ~250-300 KB (Three.js + modal overhead)
- Export surface area reduced: 5 exports removed, 5 enum members removed

## Testing
- `npm run build` - succeeds ✓
- `npm run lint` (tsc --noEmit) - clean, no new errors ✓
- `npm run test:components` - 2 tests pass ✓
- `npm run test:backend` - 27 tests pass ✓
- `npm run test:frontend` - 21/22 tests pass (1 pre-existing failure in eligibilityEngine.test.ts: GPA edge case 85 vs 95, unrelated to this cleanup)

## Remaining Items (Manual Review)
- `EXCHANGE_RATES_TO_USD` and `CANONICAL_COUNTRIES` - knip flags these as unused exports, but they are re-exported through the barrel `index.ts` file. Verify usage before considering removal.
- Pre-existing test failure in `src/utils/eligibilityEngine.test.ts` - 85 vs 95 GPA comparison, not related to this cleanup

## [2026-11-09] Refactor Session — Dead Code Cleanup (knip + tsc)

Tooling: `knip@5` (compact + JSON), `depcheck`, and
`tsc --noEmit --noUnusedLocals --noUnusedParameters` (run as a one-off check; the
project `npm run lint` remains plain `tsc --noEmit`). Every symbol below was
grepped for external references and confirmed to have no consumers before editing.

### Unused Exports Removed (de-exported; still used internally)
- `src/firebase.ts`: `auth` (only used by `handleFirestoreError`)
- `src/services/authService.ts`: `AUTH_TOKEN_STORAGE_KEY`, `RegisterInput`
- `src/utils/ingestion/normalizers.ts`: `EXCHANGE_RATES_TO_USD`, `CANONICAL_COUNTRIES`
  - Corrects the 2026-11-08 note above: the barrel re-exports them, but the only
    real consumers are inside `normalizers.ts` itself. Build and all suites pass
    after de-exporting.
- `src/components/ui/Button.tsx`: `ButtonVariant`, `ButtonSize`, `ButtonProps`
- `src/utils/filterConstants.ts`: `GeographicRegion`, `CoverageTypeOption`, `DeadlineProximityOption`

### Dead Code Deleted
- `src/firebase.ts`: removed unused Firebase Auth surface (`auth`, `googleProvider`,
  `GoogleAuthProvider`, `signInWithPopup`, `signOut`, `onAuthStateChanged`, `User`)
  and unused Firestore imports (`setDoc`, `getDoc`, `getDocs`, `collection`,
  `deleteDoc`, `onSnapshot`). Also removed `OperationType`, `FirestoreErrorInfo`,
  and `handleFirestoreError` — zero callers after `storage.ts` cleanup. Client auth
  now goes through Django token auth (`authService.ts`), so Firebase Auth is unused.
- `src/components/ui/Card.tsx`: private `Row` component (no callers; it had been
  reintroduced since the 2026-11-08 log).
- `src/components/ApplicationTracker.tsx`: unused `useNavigate`/`navigate` and `Badge` import.
- `src/components/ProfileBuilder.tsx`: unused `setMaxGpa` / `setDeliveryModality`
  setter bindings (state values are still read and submitted).
- `src/pages/ScholarshipDetailPage.tsx`: unused default `React` import and `Scholarship` type import.
- `src/components/LandingPage.tsx`: unused `Scholarship` type import.
- `src/services/databaseService.ts`: unused `testConnection` import (`App.tsx` calls it directly).
- `src/components/ScholarshipExplorer.test.tsx`: unused static `SCHOLARSHIPS_DATA` import
  (the test uses a dynamic `vi.importActual` import instead). No assertions changed.
- `src/utils/ingestion/ingestion.test.ts`: unused `validateNormalizedRecord` import. No tests changed.
- `src/utils/ingestion/pipeline.ts`: unused `IngestionValidationError` import and unused `recordKey` local.
- `src/utils/ingestion/storage.ts`: unused imports (`handleFirestoreError`, `OperationType`,
  `collection`, `getDocs`, `getDoc`) and the no-op statement `this.inMemoryStore.clear;`
  (kept the actual `clear()` call — this was a typo, not a behavior change).
- `src/utils/ingestion/types.ts`: unused `EligibilityCriterion`, `DegreeLevel` imports.

### Verified Still In Use / NOT Removed
- `tailwindcss` — `depcheck` false positive; resolved by `@import "tailwindcss"` in
  `src/index.css` and `@tailwindcss/vite` in `vite.config.ts`.
- `python3` knip "unlisted binary" — it is the `test:backend` script, not an npm package.
- `src/utils/ingestion/*` — no app imports, but `ingestion.test.ts` exercises it and
  AGENTS forbids deleting tests. Kept whole.
- `IngestionStorage.persistToFirestore()` — no callers, but retained deliberately
  (documented optional persistence). **Review note:** it writes to the `scholarships`
  collection from the client, which AGENTS.md rule 1 forbids; remove or move it behind
  the admin/service path during the security pass.

### Consolidation Opportunities (NOT changed)
- The deadline label JSX (`deadline.isClosed` / `daysRemaining === 0` / `${n} days left`)
  is duplicated in `ApplicationTracker.tsx`, `LandingPage.tsx`, and
  `ScholarshipExplorer.tsx`. A shared `DeadlineLabel` component would remove the copy,
  but it is a UI refactor outside this cleanup; candidate for a later page plan step.
- TS `eligibilityEngine.ts` vs Python `eligibility_service.py` are intentional parity
  implementations pinned by `tests/fixtures/eligibility-parity.json` — do not merge.

### Impact
- Files deleted: 0
- Dependencies removed: 0
- Lines removed: 98 (19 added, net -79) across 16 files
- Bundle size: not measured; removed imports were already tree-shaken by Vite.

### Testing (all green)
- `npm run lint` — clean
- `npx knip` — only the `python3` script false positive remains
- `npm run test:frontend` — 45/45
- `npm run test:components` — 11/11
- `npm run test:backend` — 46/46
- `npm run build` — succeeds
- `npx playwright test` — 10/10

### Note
`src/components/ProfileBuilder.tsx` also contains unrelated local edits present before
this session (citizenship/residence/institution defaults and a placeholder changed from
Nigeria to India). They are not part of this cleanup and were left untouched.