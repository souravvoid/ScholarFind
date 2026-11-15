# Networking Concepts — ScholarFind

## 1. Client-server architecture
React SPA (client) ↔ Django/DRF (server) ↔ PostgreSQL (data server). REST over HTTP.

## 2. Request lifecycle (actual)
```
Browser fetch('/api/v1/scholarships/?page=1')
  → Vite dev proxy (or same-origin in prod) forwards to http://127.0.0.1:8000
  → Gunicorn accepts TCP connection
  → Django middleware (security, session, common, auth, CORS)
  → URL router (config/urls.py)
  → ScholarshipViewSet
  → ORM → PostgreSQL over TCP (port 5433 locally)
  → JSON response
  → client parses, renders
```

## 3. Protocols
- HTTP (REST, JSON). HTTPS in production via Render's TLS termination.
- TCP for HTTP and for the DB connection.
- IP addressing: localhost/127.0.0.1 in dev; Render-assigned host in prod.
- DNS: github.com for repo; Render/Neon hostnames in prod (not yet deployed).
- Ports: 3000 (Vite), 8000 (Django), 5433 (Postgres), 443 (HTTPS prod).

## 4. CORS
`CORS_ALLOWED_ORIGINS` from env; in dev `http://localhost:3000`. Backend is `*` + credentials
in the original config (to be tightened). Frontend uses Vite proxy in dev to avoid CORS.

## 5. Auth over the wire
- Bearer token (DRF Token) in `Authorization` header for authenticated endpoints.
- CSRF cookie for session-based auth (Google OAuth flow).
- Throttling returns 429 on excess.

## 6. TCP/IP layer mapping
| Layer | ScholarFind usage |
|---|---|
| Application | HTTP, REST, JSON, DNS names |
| Transport | TCP (HTTP, Postgres wire protocol) |
| Internet | IP addressing, routing |
| Link | Ethernet/Wi-Fi of host |

TLS not configured at app layer; provided by hosting platform in prod.
