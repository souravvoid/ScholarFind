# Data Flow — ScholarFind (verified actuality, 2026-11-08)

All flows traced in code at commit `ce43c29`. Note these are the *real* flows, not the README's.

## Flow A — Boot

```
App.tsx:23-26 ──▶ testConnection() (firebase.ts:76-86)
                  getDocFromServer "test/connection"  (floating promise, no UI effect)
AuthContext.tsx:127-182
   onAuthStateChanged
     user?  ──▶ getDoc users/{uid}/profile/data ─┐
                missing? setDoc(demo+uid,email)  │ onSnapshot users/{uid}/saved_scholarships
                                                └─ setSaved()
     none? ──▶ demo persona (INITIAL_SAMPLE_PROFILE) + seed saved list
localStorage hydration at mount (AuthContext.tsx:73-111, unguarded JSON.parse)
```

Bug: the `onSnapshot` unsubscribe is returned from *inside* the auth callback → never called
(listener leak, cross-user ghost writes). Empty snapshot is ignored (`if (list.length > 0)`,
`:164`), so deletions to zero never sync.

## Flow B — Explore

```
ScholarshipExplorer.tsx:86-113
  getScholarshipsFromDatabase (databaseService.ts:135-166)
     getDocs("scholarships") ─ empty? seedScholarshipsIfEmpty :97-111
                                └─ setDoc(merge) ×9 records from SCHOLARSHIPS_DATA (client creds!)
     error ──▶ fallback to static array, fromDatabase=false
  evaluate each record with profile? ──▶ eligibilityEngine.ts (local, TS)
  filters (search/countries/levels/award/deadline) at :143-190
     ⚠ selectedCitizenship / selectedCoverage / verifiedRecentOnly state (:122-127) never read
  sort/“all vs profile” modes (:180-189)
```

Note: first-paint dataset uses static `daysRemaining` (`ScholarshipExplorer.tsx:79`) while the
DB fetch normalizes later — default deadline filter can show results then drop them.

## Flow C — Save / Tracker

```
Explorer card save ──▶ AuthContext.saveScholarship :225-256
   optimistic setSaved(...) ──▶ user? setDoc(users/{uid}/saved/{id}) : ELSE localStorage only
Tracker stage/notes/doc checkboxes ──▶ updateTrackerStatus :276-313
   payload built from stale closure find() (:298) ──▶ whole-doc setDoc (no transaction)
Remove ──▶ unsave deleteDoc (:225-256 superset)
```

Concurrency model: none (no runTransaction anywhere). Tracker rows resolve metadata from the
static file only (`ApplicationTracker.tsx:131`) → DB-loaded ids dead-end (no detail/Apply).

## Flow D — Detail & redirect

```
Card/modal ──▶ ScholarshipDetailsModal ──▶ rubric from eligibilityEngine (local calcs)
"Continue to Official Application" ──▶ OfficialRedirectModal
   destinationUrl = officialApplicationUrl || officialSourceUrl (:20)
   new URL(...).hostname for display only; NO scheme check, NO allowlist (:20-33)
   window.open(destinationUrl, '_blank')  ← raw stored URL; catalogue docs are publicly writable
```

## Flow E — Sources "Audit & Refresh" (cosmetic)

```
SourceTransparency trigger(:31-59) ──▶ databaseService.triggerLiveSourceSync :206-266
   addDoc("ingestion_logs", { status:'verified', itemsIngested: sourceData?.scholarshipCount || 150 })
   updateDoc("scholarship_sources", { lastIngested: now })
   UI: "Audit verified! Stored in Firestore"
```

No adapter/pipeline/network code is invoked. Counts and timestamps on the page are hardcoded
(`sourcesData.ts`).

## Flow F — Backend (disconnected)

```
(spa) ──✗── uvicorn backend.main:app
  GET /api/v1/health      counts DEFAULT_STORAGE (memory, resets)
  GET /api/v1/sources     hardcoded "verified" statuses
  POST /api/v1/admin/ingest/{id}   run_job: get_access_conditions on all 10
        (7/10 adapters lack it → HTTP 200 {"status":"failed"}), sleep-based backoff, bytes
  POST /api/v1/evaluate   raw Dict body → standardize_gpa (str → TypeError → 500)
  GET  /api/v1/scholarships        hardcoded 2 records + total_count:1428, ignores params
  CORS allow_origins=["*"] + allow_credentials=True
```

No `fetch` exists in `src/`; `vite.config.ts` has no proxy — the SPA cannot reach these.
