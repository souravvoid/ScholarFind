# AGENTS.md — ScholarFind

> Working rules for AI agents and developers. Start with `docs/ai/WORK_STATUS.md` and
> `docs/PROJECT_STATUS.md` for current state; `docs/PROJECT_CONTEXT.md` is a **pre-Django
> historical snapshot** and is not authoritative for implementation claims.

## Project one-liner

React 19 + Vite 8 + Tailwind v4 scholarship discovery SPA backed by a Django 6 + DRF +
PostgreSQL API. The client reads the catalogue/sources and authenticates against `/api/*`,
with a bundled 48-record offline fallback; profile/saved/tracker state is still
browser-local. Deterministic TS eligibility engine, 4-step profile builder, tracker,
sources page. The legacy FastAPI modules (`backend/main.py`, `models.py`, `schemas.py`) and
`firestore.rules` are unused reference artifacts. Ground rules for every change:

## Commands

| Task | Command |
|---|---|
| Dev server (client) | `npm run dev` (port 3000) |
| API + client | `npm run dev:all` / `./scripts/dev.sh` (needs PostgreSQL; migrates + seeds) |
| Type check | `npm run lint` (`tsc --noEmit`) |
| Build | `npm run build` |
| Unit tests | `npm run test:frontend` (tsx) · `npm run test:components` (Vitest) |
| Backend tests | `npm run test:backend` (`unittest`; pytest needs PostgreSQL) |
| All local suites | `npm test` (frontend + components + backend) |
| E2E | `npm run test:e2e` (Chromium; landing spec mocks the catalogue API) |

Definition of done for any code change: `npm run lint` clean, relevant unit suites pass,
`npm run build` succeeds, e2e landing spec still passes. Never delete or weaken an
existing test to make a build pass.

## Coding conventions

- Keep the existing structure: components in `src/components/`, API access only via
  `src/services/catalogueService.ts` / `src/services/authService.ts`, types in
  `src/types/index.ts`. `databaseService.ts` holds date helpers only; there is no Firebase
  client.
- Tailwind utilities; reuse classes defined in `src/index.css` (`arc-*`, font utilities) before adding new ones.
- Convention: user-visible strings are plain JSX text (React auto-escapes). **Do not** introduce
  `dangerouslySetInnerHTML`.
- Icons are lucide-react through `src/components/ui/Icon.tsx`; mark decorative ones
  `aria-hidden` (most are not yet → fix when touching a file).
- Commits: `type(scope): imperative summary` (see `git log`).

## Security rules (hard)

1. **Never write catalogue data from the browser.** Catalogue mutations belong to Django admin
   or the `seed_catalogue_bundle` management command. The client is read-only against
   `/api/v1/scholarships/` and `/api/v1/scholarship-sources/`; do not add client-side seeding
   or writes. `firestore.rules` is a legacy artifact and the client no longer bundles Firebase.
2. Never commit real secrets. `.env*` and `backend/.env` are gitignored except the
   `.env.example` placeholders; never put server secrets in `VITE_` variables.
   `firebase-applet-config.json` is a legacy public Firebase web config.
3. Never open external URLs from data without the `OfficialRedirectModal` gate; do not weaken it
   further — it will get a `https:`-only + allowlist check.
4. Do not widen CORS. `backend/config/settings.py` reads explicit `CORS_ALLOWED_ORIGINS`; keep
   same-origin API access through the Vite `/api` proxy in development.
5. Treat API payloads as untrusted input: validate shape before use (the parsers in
   `catalogueService.ts` are the reference).

## Agent coordination rules

- One agent owns one file at a time; parallelize only reviews/research, not writes.
- Require file:line evidence for every claim; label unverified claims as such; spot-verify
  critical findings in the actual source before acting on them.
- Do not rebuild from scratch; prefer the smallest change that preserves behavior
  (lazy-senior-dev mode is active for this workspace).
- Before changing a module, grep its callers. After editing, run the verification commands above.
- Never fabricate test results, metrics, or product numbers. The bundled fallback sources still
  carry mock `scholarshipCount` values (e.g. 342 in `src/data/sourcesData.ts`) — do not
  propagate them into new code or present them as database totals.
- Design work follows the approved system: read `docs/DESIGN_BRIEF.md`,
  `docs/DESIGN_SYSTEM.md`, `docs/SITEMAP.md` before touching UI. Use shared `ui/` primitives
  and design tokens — no page-specific styling or raw hexes. Icons are lucide-react via
  `Icon.tsx` (no Material Symbols, no emoji in chrome). Design changes to identity or
  feature removals need approval; minor CSS inside an approved page plan does not.

## Where things stand (see docs/)

- Current state: `docs/ai/WORK_STATUS.md` (read first), `docs/PROJECT_STATUS.md`,
  `docs/SYSTEM_ARCHITECTURE.md`. `docs/PROJECT_CONTEXT.md` is historical (pre-Django).
- Approved fix sequence: `docs/engineering/ROADMAP.md`.
- Product requirements (as-is): `docs/product/PRD.md`.
- Design intent: `docs/DESIGN_BRIEF.md` (approved 2026-11-08).
- Design system: `docs/DESIGN_SYSTEM.md` — tokens, components, responsive + a11y contract.
- Routes: `docs/SITEMAP.md` (react-router; top nav; detail as a page).
- Implementation order: `docs/engineering/PAGE_PLAN.md` (shell first, then page by page).
- UX findings: `docs/UX_AUDIT.md` · open defects: `docs/UI_BACKLOG.md`.
- Session state: `docs/ai/WORK_STATUS.md` — read this first in a new session.
