# AGENTS.md — ScholarFind

> Working rules for AI agents and developers. Verified project context lives in
> `docs/PROJECT_CONTEXT.md` — read it first; this file holds the *rules*.

## Project one-liner

Client-side React 19 + Vite + Tailwind v4 scholarship discovery app on Firebase
(Auth + Firestore) with a disconnected Python FastAPI backend. 9-scholarship static
catalogue, deterministic TS eligibility engine, 4-step profile builder, tracker,
sources page. Ground rules for every change:

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` (port 3000) |
| Type check | `npm run lint` (`tsc --noEmit`) |
| Build | `npm run build` |
| Unit tests | `npm run test:frontend` / `npm run test:backend` |
| E2E | `npx playwright test` (Chromium; dev server auto-started) |

Definition of done for any code change: `npm run lint` clean, relevant unit suites pass,
`npm run build` succeeds, e2e landing spec still passes. Never delete or weaken an
existing test to make a build pass.

## Coding conventions

- Keep the existing structure: components in `src/components/`, Firestore access only via
  `src/services/databaseService.ts` and `src/context/AuthContext.tsx`, types in `src/types/index.ts`.
- Tailwind utilities; reuse classes defined in `src/index.css` (`arc-*`, font utilities) before adding new ones.
- Convention: user-visible strings are plain JSX text (React auto-escapes). **Do not** introduce
  `dangerouslySetInnerHTML`.
- Icons are `<span className="material-symbols-outlined">` — mark decorative ones `aria-hidden`
  (most are not yet → fix when touching a file).
- Commits: `type(scope): imperative summary` (see `git log`).

## Security rules (hard)

1. **Never write to Firestore `scholarships`, `scholarship_sources`, `ingestion_logs` from the
   client.** These collections are publicly writable today (`firestore.rules:44-67`) and that is
   a critical defect being fixed — do not add new client writes; move catalogue writes behind
   an admin/service path.
2. Never commit real secrets. `firebase-applet-config.json` is deliberately public Firebase web
   config; `.env*` is gitignored except `.env.example` (placeholders only).
3. Never open external URLs from data without the `OfficialRedirectModal` gate; do not weaken it
   further — it will get a `https:`-only + allowlist check.
4. Do not widen CORS in `backend/main.py`; it is already `*` + credentials (to be tightened).
5. Treat any doc cast from Firestore as untrusted input: validate shape before use.

## Agent coordination rules

- One agent owns one file at a time; parallelize only reviews/research, not writes.
- Require file:line evidence for every claim; label unverified claims as such; spot-verify
  critical findings in the actual source before acting on them.
- Do not rebuild from scratch; prefer the smallest change that preserves behavior
  (lazy-senior-dev mode is active for this workspace).
- Before changing a module, grep its callers. After editing, run the verification commands above.
- Never fabricate test results, metrics, or product numbers. The UI contains hardcoded mock
  stats (e.g. "842 grants", "342 records") — do not propagate them into new code.

## Where things stand (see docs/)

- Discovery audit: complete (see `docs/PROJECT_CONTEXT.md`, `docs/architecture/*`).
- Approved fix sequence: `docs/engineering/ROADMAP.md` (start with security + honesty fixes).
- Product requirements (as-is): `docs/product/PRD.md`.
