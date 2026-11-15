# Operating System Concepts — ScholarFind

## 1. Process management
- Django runs under Gunicorn in production (`render.yaml`: `gunicorn config.wsgi:application --workers 2 --timeout 120`).
- Local dev uses `python manage.py runserver` (single process, threaded by default).
- Frontend dev uses Vite dev server (Node process).
- PostgreSQL is a separate OS process.

## 2. Process vs thread
- A process has its own address space; threads share one. Gunicorn workers are
  separate processes; each handles requests with threads (sync worker default = 1 thread
  per worker unless configured). Not explicitly configured beyond worker count.

## 3. IPC
Dedicated application-level IPC has **not** been implemented in the current system.
- Django and PostgreSQL communicate over a TCP socket (or Unix socket depending on
  host config) — that is client/server socket communication, not app-level IPC.
- Ordinary Python function calls are control flow within one process, not IPC.

## 4. Network communication
Browser → TCP/IP → backend socket → Django → DB socket → PostgreSQL → response.
TLS only where the deployment provides it (Render provides HTTPS termination).

## 5. Memory management
- Python heap holds request/response objects, ORM instances, cached querysets.
- CPython reference counting + generational GC.
- No explicit memory management in app code.
- Connection objects held per request (Django's request-scoped DB connection).

## 6. File system
- Static assets (Vite build) served by WhiteNoise in prod.
- Media root configured (`MEDIA_URL`, `MEDIA_ROOT`) but no upload flows implemented.
- `.env` / `backend/.env` (gitignored) for config.
- Logs via Django logging (console).

## 7. Concurrency and scheduling
- Synchronous request handling; no async views, no Celery/RQ workers.
- OS scheduler manages Gunicorn worker processes and the DB process.
- Throttling is per-process in-memory (DRF default cache), not shared across workers.

## 8. OS concept mapping table

| OS Concept | Where it appears | Actual implementation | Evidence | Status |
|---|---|---|---|---|
| Process management | Gunicorn workers, runserver, Vite, Postgres | Multi-process in prod | render.yaml, scripts/dev.sh | USED |
| Thread management | runserver threaded; Gunicorn sync workers | Default threading | Django defaults | INDIRECTLY USED |
| IPC | none | n/a | — | NOT IMPLEMENTED |
| Sockets | HTTP server socket, DB connection | TCP (localhost:5433) | settings.py PORT | USED |
| TCP/IP | client-server HTTP | Standard stack | vite proxy, fetch | USED |
| Virtual memory | Python process | OS-managed | — | INDIRECTLY USED |
| Stack/heap | Python frames/objects | CPython | — | INDIRECTLY USED |
| File systems | static/media/config | WhiteNoise, .env | settings.py | USED |
| Scheduling | worker scheduling | OS scheduler | — | INDIRECTLY USED |
| Concurrency | request handling | sync, no async | views.py | NOT IMPLEMENTED (app-level async) |
| Synchronization | throttles, token auth | in-memory per process | throttles.py | INDIRECTLY USED |
| Resource management | DB connections | conn_max_age | settings.py | USED |
