# Security Audit — ScholarFind (2026-11-08)

Read-only audit by Security Engineer agent; critical/high findings re-verified directly in source
by the Technical Lead. Repo commit `ce43c29`. Scope: Firestore rules, auth, backend, client XSS,
redirect handling, secrets.

**Verdict: HIGH risk — 1 critical, 2 high, 4 medium, 4 low. One ~6-line rules change removes the
worst attack path.**

## C1 — CRITICAL: world-writable catalogue → forged-"verified" phishing chain ✅ verified
Chain: `firestore.rules:44-48` `allow create, update: if true` on `scholarships` (+ same for
`scholarship_sources:51-55`, no auth/field checks) → app renders fetched docs unchecked
(`databaseService.ts:152` casts) → `OfficialRedirectModal.tsx:20-33` opens `officialApplicationUrl`
verbatim with a "Verified Destination Host" badge and **no scheme check and no allowlist**
(`data:`/`javascript:` URLs still open; parse failure shows `sourceDomain` but opens the raw
string). Anonymous attacker can repoint the Gates Cambridge "official application" to a
credential-harvesting clone over HTTPS and every user sees the app's own trust banner.
Also forgeable: audit trail via world-writable `ingestion_logs` (`:58-62`, client-authored at
`databaseService.ts:222-231`) and the `test` collection (`:65-67`).
**Fix:** `allow write: if false` for catalogue/sources (Admin-SDK/service identity only),
`ingestion_logs` read-public write-false, kill `test`; https-scheme + domain-allowlist check in
the redirect modal; validate doc shape on read instead of casting.

## C2/H1 — HIGH: unauthenticated admin endpoint + no rate limiting ✅ verified
`backend/main.py:104-116` `POST /api/v1/admin/ingest/{source_id}` — no auth dependency on
**any** route; no limiter anywhere. `/evaluate` takes `Dict[str, Any]` (`:120`) bypassing the
Pydantic schemas it imports (`:41-45`) — malformed `gpa` surfaces as TypeError→500; unbounded
`rules` array = CPU amplification. DoS-amplification via backoff sleeps in the worker.
**Fix (if backend remains deployed):** secret/token dependency on admin routes, explicit CORS
origin list without `credentials` (current `["*"]`+credentials combo is invalid), slowapi-style
limits, wire request schemas.

## H2 — SSRF latent (inert today) ✅ verified-closed
No HTTP client exists in `backend/` (grep: no requests/httpx/urllib); adapters return hardcoded
dicts. When real fetching is added: host allowlist (the 10 source domains), block RFC1918/link-local,
admin-only trigger — otherwise the combination above becomes SSRF-by-construction.

## M-items (verified)
- **M1** `ingestion_logs` create-anyone / delete-none → unbounded storage-billing spam; `test` fully open.
- **M2** CORS `allow_origins=["*"]` + `allow_credentials=True` (`main.py:64-71`).
- **M3** PII (name/email/GPA/research keywords) in cleartext localStorage; boot-crash on corrupt
  value (`AuthContext.tsx:74-77,115-124`, unguarded `JSON.parse`).
- **M4** Owner-scoped rules lack document-size/type caps → per-user billing bloat with garbage docs.

## L-items
1. Committed Firebase web API key is public-by-design — restrict in console (app/referrer).
2. `.env.example` placeholders only; `.env*` gitignored ✅.
3. `@google/genai` was declared but never imported — **removed 2026-11-08** along with `three`, `motion`, `express`, `dotenv`; no key exposure to bundle ✅.
4. Auth fallback: any popup failure silently adopts demo persona (`AuthContext.tsx:184-196`) —
   trust/UX integrity issue (see PRD FR-4).

## Verified clean
- No XSS sinks (`dangerouslySetInnerHTML`/`innerHTML`/`eval`) in `src/` ✅
- No service-account JSONs or real keys in repo/history ✅
- No Python `eval/exec/pickle` ✅ · Playwright config holds no secrets ✅
- User-owned collections correctly uid-scoped with field checks (`firestore.rules:23-41`) ✅

## Fix order
1. C1 rules rewrite (+ redirect-modal hardening + read-validation) — smallest diff, largest risk cut.
2. M1 (same rules file) together with C1.
3. Backend auth/rate-limit/CORS/request-schema pass (only if backend stays deployed).
4. M3 localStorage hygiene + M4 rule-level caps.
