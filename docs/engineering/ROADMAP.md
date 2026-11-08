# Roadmap — ScholarFind (implementation sequence, approved pending)

Principles: keep the working SPA+Firebase product; no rewrites; delete before adding; every
milestone is independently verifiable and ends with the DoD gates (`TEST_STRATEGY.md`).
Sequencing: security → honesty → correctness → architecture decisions → debt → tests.

## Milestone sequence

### M0 — Discovery ✅ done (this round)
Four read-only audits (discovery, backend, security, frontend/QA), cross-verified, docs created.

### M1 — Catalogue integrity (security, first) — ✅ done 2026-11-08
1. `firestore.rules`: ~~`scholarships`/`scholarship_sources`/`ingestion_logs` → read-true,
   write-false (+ delete-open `test` collection or its rules).~~ **Applied.** Client-side
   seeding removed from `databaseService.ts`; empty/failed reads fall back to the static
   baseline; `triggerLiveSourceSync` no longer fabricates audit writes.
   NOTE: rules must still be **deployed to the live Firebase project** (`firebase deploy
   --only firestore:rules` needs `firebase.json` wiring — pending, needs owner's Firebase CLI).
2. `OfficialRedirectModal`: require `https:` + allow against the record's `sourceDomain`; show
   broken state instead of opening raw strings.
3. Validate doc shape on read in databaseService (small runtime guard, not a cast).
Risk: low. Files: `firestore.rules`, `OfficialRedirectModal.tsx`, `databaseService.ts`.
Acceptance: anonymous write blocked (emulator/manual proof); landing+explorer flows still pass.

### M2 — One eligibility truth + parity test
1. Decide the canonical mapping per scale (UK/GER/ECTS/language/unknown-rule) — product call,
   documented in a short ADR inside the parity fixture.
2. Fix TS engine to the chosen values; keep PY engine behind tests (no behavior change to API
   consumers yet).
3. Golden parity fixture table shared by both suites.
Risk: medium (changes visible match badges on 3 cards; update e2e expectations).
Justification: eligibility verdicts are the product's core claim.

### M3 — AuthContext correctness & honesty
Fix in one file: guard `JSON.parse`, unsubscribe saved-listens on re-auth, apply zero-length
snapshots, build tracker payloads from latest state, clear profile/saves on sign-out, surface
sign-in errors instead of silent demo persona, stop seeding fabricated profiles for new users.
Risk: low; tests first for save/zero-delete paths (mock Firebase).

### M4 — Remove fabricated features & stats (honesty)
Delete Save-Resume theater, fake "Audit & Refresh" (or reduce to an honest timestamp refresh),
842/840/342-style hardcoded stats, WHED badge claims; update `sourcesData`/README to match reality.
Risk: low; copies exist in e2e? — verify e2e doesn't assert removed strings.

### M5 — Broken journeys & inert controls
Hero search fields → explorer presets (contract through query/explicit state) or remove fields;
citizenship filter → implement against profile or remove control; coverage filter same;
verified-30d → real date math; tracker rows resolve from loaded catalogue (fallback generic row
with disabled actions instead of dead-ends); profile builder starts at step 1.
Risk: low/medium; e2e journey tests added (explorer, tracker).

### M6 — Backend: decide, then make honest
Decision point for human approval: **(A)** keep backend as internal service → add
`requirements.txt`, delete fallback stubs, Pydantic schemas on `/evaluate`, auth token on admin
route, explicit CORS, `TestClient` tests, fix the 7 broken adapters & currency double-conversion;
**(B)** archive `backend/` out of the product scope until a real ingestion source exists.
Trade-off documented in `TECHNICAL_DEBT.md`; nothing shipped to users depends on it either way.

### M7 — Dependency & build hygiene
Remove unused deps (`three`,`motion`,`@google/genai`,`express`,`lucide-react`,`dotenv`,
`@types/jest`,… verified dead) and files (`HeroGlobe3D.tsx`, `src/utils/ingestion/*`,
`backend/models.py` if M6=B). Add `"strict"` incrementally (start with `noUncheckedIndexedAccess`
off, measure). Update `name`/README. Risk: low; build+tests gate.

### M8 — Accessibility baseline & a11y tests
Shared dialog behavior (Escape, initial focus, focus restore, aria-labelledby) for the 4 modals +
drawer; `aria-hidden` on decorative icon spans; label association in ProfileBuilder; `aria-live`
for save/tally feedback; heading order. Risk: low; keyboard e2e for one modal added.

## Explicitly deferred (needs human/product call)
- Real server-side ingestion of authoritative sources (licensing/robots/ops) — until at least
  one source is license-clear and an ops host exists.
- URL routing / deep links; pagination; GitHub CI pipeline (recommended after M1–M3).
- Deploy wiring (`firebase.json`, hosting rules deploy) — question for the repo owner: is the
  committed rules file deployed anywhere today?
