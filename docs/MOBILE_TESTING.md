# Mobile Testing Guide

Last updated: 2026-11-15. Viewport results below are from the 2026-11-08 design audit and
should be re-checked after UI changes.

## Stack

React 19 + Vite 8 + Tailwind v4 SPA, backed by a Django API on PostgreSQL. The client reads
`/api/*` through the Vite proxy; auth uses Django token endpoints. There is no Firebase SDK.

## 1. Local development on a phone

`npm run dev` already binds to all interfaces:

```json
"dev": "vite --port=3000 --host=0.0.0.0"
```

Start the client, find your machine's LAN IP (`hostname -I`), and open
`http://<computer-IP>:3000` on a device on the same Wi-Fi.

For the full API + client experience, start both with the local runner:

```bash
./scripts/dev.sh        # API :8000, client :3000, migrations + catalogue seed
```

The phone only needs port `3000`: Vite proxies `/api` to the API on the dev machine
(`VITE_API_PROXY_TARGET`, default `http://127.0.0.1:8000`), so the backend does not need to be
exposed to the LAN. If you point the client directly at the API instead, set
`VITE_API_BASE_URL=http://<computer-IP>:8000` and add that origin to
`CORS_ALLOWED_ORIGINS` in `backend/.env`.

## 2. Health check

```bash
curl http://127.0.0.1:8000/api/v1/health/
```

The Django endpoint returns a JSON health response; it does not require authentication.

## 3. Viewport results (2026-11-08 audit)

Method: Chrome DevTools viewport emulation plus one physical Android device.

| Viewport | Status | Notes |
|---|---|---|
| 320px | Pass | Single column, touch-friendly taps |
| 360px | Pass | App shell nav, drawer works |
| 375px | Pass | Default test viewport |
| 390px | Pass | All routes OK |
| 430px | Pass | No horizontal overflow |
| 768px | Pass | Two-column grid begins |
| 1024px | Pass | Full layout |
| 1440px | Pass | Container centered |

Verified then: mobile drawer (focus trap, Escape, backdrop, scroll lock), no horizontal
overflow, touch targets ≥44px, and the routes below.

| Route | Status |
|---|---|
| `/` | Pass |
| `/explore` | Pass |
| `/tracker` | Pass |
| `/sources` | Pass |
| `/scholarship/:id` | Pass (slug-based detail) |
| unknown route | Pass (404 page) |

## 4. Known mobile limitations

| Limitation | Workaround |
|---|---|
| Offline catalogue banner appears if the API is unreachable from the dev machine | Run `./scripts/dev.sh`; check `/api/v1/health/` |
| Google OAuth is disabled without credentials (503) | Use email/password locally; OAuth redirect origins must be configured for a real host |
| Profile/saved/tracker state is browser-local | Do not expect cross-device sync; clearing site data resets it |
| Fixed top nav occupies ~56px on mobile | Content starts below the nav |

## 5. Checklist

- [ ] Open `http://<computer-IP>:3000` on a physical device
- [ ] Check all routes, including a scholarship detail slug and an unknown route
- [ ] Open the hamburger drawer; close with Escape and backdrop click
- [ ] Confirm no horizontal scrolling at 320–430px
- [ ] Confirm touch targets are tappable and forms fit
- [ ] Check empty states, skeletons, and error panels
- [ ] Confirm the offline banner appears only when the API is down
