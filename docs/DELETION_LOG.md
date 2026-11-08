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