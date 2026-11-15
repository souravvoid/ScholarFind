# Technical Viva Questions — ScholarFind

1. **What does ScholarFind do?** Scholarship discovery + eligibility explanation for Indian students; links to official pages; does not submit applications.
2. **Why Django over FastAPI?** Mature ORM, admin, auth, migrations, DRF; fits academic MVP. Legacy FastAPI kept for reference.
3. **How does frontend talk to backend?** REST JSON over HTTP via Vite proxy in dev; Bearer token auth.
4. **How is eligibility computed?** `DeterministicEligibilityEngine.evaluate` in `eligibility_service.py`, pure Python, no DB writes; rules from DB or request.
5. **What is a process vs thread here?** Gunicorn workers are processes; runserver is threaded; OS schedules both.
6. **Is there IPC?** No app-level IPC. Django↔Postgres is a TCP socket.
7. **How are saved scholarships modeled?** M:N through `SavedScholarship` with unique (user, scholarship).
8. **Normalization level?** Core tables 3NF/BCNF; comma-separated lists are intentional 1NF violations.
9. **Why denormalize lists?** Simpler MVP + direct mapping from TS catalogue; trade-off: no FK integrity on items.
10. **What indexes exist?** slug (unique), title, application_deadline, PKs/FKs.
11. **How is auth secured?** DRF tokens, throttling, CSRF for sessions, generic login errors.
12. **What about CORS?** Env-driven `CORS_ALLOWED_ORIGINS`; dev proxy avoids it.
13. **How is the catalogue seeded?** `seed_catalogue_bundle` imports a 48-record fixture; idempotent.
14. **What happens if API is down?** Client falls back to bundled records and shows "Offline catalogue" banner.
15. **How are migrations managed?** Django migrations; `migrate --noinput` in dev script.
16. **What OS concepts are demonstrated?** Processes, threads, sockets, TCP/IP, file system, scheduling.
17. **What is NOT implemented?** Celery, async views, email verification, password reset, DB CHECK constraints.
18. **How is the frontend state managed?** React state + Context (AuthContext); no Redux.
19. **What testing exists?** pytest (78), node (51), components (11), Playwright (10).
20. **Deployment target?** Render (web) + Postgres; config only, not deployed.
21. **How does Google OAuth work?** Manual flow against Google endpoints; session-based; returns token.
22. **What is the redirect gate?** `OfficialRedirectModal` confirms before opening external URLs.
23. **How are floats validated?** Django validators (gpa 0–5); no DB CHECK.
24. **What is the eligibility outcome aggregate?** match %, mandatory failures, missing info, manual review counts.
25. **How is pagination done?** DRF page_number pagination, `page`/`page_size`.
26. **What is the tech debt?** Legacy FastAPI files, denormalized lists, root-level eligibility modules.
27. **How is concurrency handled?** Synchronous; no app-level async; OS schedules processes.
28. **What is the data flow for evaluation?** Frontend → POST /api/v1/eligibility/ → load rules from DB → engine → JSON.
29. **Why keep legacy FastAPI?** Reference during migration; not imported by Django.
30. **What would you improve next?** M2M for lists, user-scoped persistence, CI with Postgres, real per-programme images.
