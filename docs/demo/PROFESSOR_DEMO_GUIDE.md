# Professor Demo Guide — ScholarFind

## Setup
1. `cp backend/.env.example backend/.env` and set `POSTGRES_PORT=5433` (or your DB).
2. `./scripts/dev.sh` (or `npm run dev:all`).
3. Open http://localhost:3000.

## Demo flow (10 min)
1. Landing page → Sentry-inspired design system.
2. `/explore` → catalogue thumbnails, filters, India filter (39 records).
3. Open a scholarship detail → hero image, criteria, official link (redirect gate).
4. Register a synthetic Indian student account.
5. Profile builder → citizenship/residence locked to India.
6. Eligibility evaluation → per-criterion explanations.
7. Save a scholarship → tracker status change.
8. Refresh page → verify persistence (DB-backed where implemented).
9. Show `docs/system-design/HLD.md`, ER diagram, OS/networking docs.

## Talking points
- Modular monolith, Django/DRF, PostgreSQL, deterministic eligibility engine.
- Normalization + intentional denormalization.
- OS: processes (Gunicorn), sockets, no app-level IPC.
- Networking: REST, TCP, CORS, proxy.

## Do not claim
- Official government connection.
- Application submission.
- Deployed production (config only).
- Real scholarship verification beyond bundled catalogue.
