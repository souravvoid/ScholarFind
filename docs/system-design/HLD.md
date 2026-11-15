# High-Level Design

Modular monolith: React/Vite frontend, Django REST Framework backend, PostgreSQL. No microservices. External: Firebase legacy, Neon/Postgres. Auth via DRF token. Scholarship catalogue read-only public; writes staff-only. Eligibility deterministic service. Deployment: Render + Neon. Security boundaries: env secrets, DEBUG false, CORS explicit.