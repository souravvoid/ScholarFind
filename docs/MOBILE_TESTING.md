# Mobile Testing Documentation — ScholarFind

## Current Status (as of 2026-11-08)

The ScholarFind frontend is a React 19 + Vite + Tailwind v4 application. The backend is a FastAPI service. This document describes how to test mobile compatibility on actual devices.

## 1. Local Development Setup

### Start the Development Server

```bash
# From the project root
npm run dev
```

The server starts on `http://localhost:3000` by default.

### Make the Server Accessible on the Local Network

By default, Vite dev server listens on `localhost` only. To access from other devices on the same Wi-Fi network:

```bash
# Stop the current dev server (Ctrl+C)
# Restart with network access
npx vite --host 0.0.0.0 --port 3000
```

Or using the package script (if configured):
```bash
npm run dev -- --host
```

### Verify Network Access

From another device on the same Wi-Fi network, open a browser and navigate to:

```
http://192.168.1.14:3000
```

Replace `192.168.1.14` with your computer's actual local IP address (run `hostname -I` to find it).

## 2. Backend API Access

The FastAPI backend runs internally and is not exposed over the network by default. For mobile API testing:

### Option A: Keep Backend Local Only (Recommended)
- The frontend communicates with the backend via relative paths during development
- Firebase Auth handles authentication on the client side
- No API calls from mobile needed unless specifically required

### Option B: Expose Backend on Network
```bash
# From the backend directory
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Then configure the frontend API base URL to `http://192.168.1.14:8000`.

### Backend Health Check

```bash
curl http://192.168.1.14:8000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "scholarfind-api",
  "timestamp": "<ISO timestamp>",
  "registered_sources": 10,
  "stored_scholarships": <count>
}
```

## 3. Test Results by Viewport

### Testing Methodology

1. **Physical device testing** (preferred) — Open the website on an actual Android phone on the same Wi-Fi network
2. **Browser developer tools viewport emulation** — Secondary confirmation only
3. **Chrome DevTools device toolbar** — Not a substitute for physical device testing

### Tested Viewports (via Chrome DevTools + Physical Device)

| Viewport | Status | Notes |
|----------|--------|-------|
| 320px (small mobile) | ✅ Pass | Single column layout, touch-friendly taps |
| 360px (standard mobile) | ✅ Pass | App shell nav, drawer works |
| 375px (common mobile) | ✅ Pass | Default test viewport |
| 390px (modern mobile) | ✅ Pass | Wide mobile, all routes OK |
| 430px (large mobile) | ✅ Pass | No horizontal overflow |
| 768px (tablet) | ✅ Pass | 2-column grid begins |
| 1024px (laptop/tablet landscape) | ✅ Pass | Full layout, no overflow |
| 1440px (desktop) | ✅ Pass | Full layout, container centered |

### Key Mobile Features Verified

- ✅ **AppShell** — sticky top nav (64px desktop / 56px mobile), paper background, hairline border
- ✅ **Mobile drawer** — right-side drawer, 56px rows, focus trap, Escape, backdrop click, body scroll lock
- ✅ **All 5 routes** — `/`, `/explore`, `/tracker`, `/sources`, `/scholarship/:id` work on mobile
- ✅ **No horizontal overflow** at any viewport
- ✅ **Touch targets** — all buttons ≥ 44px tall
- ✅ **Navigation** — hamburger opens drawer, Escape closes, backdrop click closes
- ✅ **Forms** — input fields fit, keyboard dismiss works
- ✅ **Cards and lists** — no overflow, responsive padding
- ✅ **Empty states** — render correctly on mobile
- ✅ **Skeleton loaders** — match final row geometry
- ✅ **Error panels** — render correctly
- ✅ **Console errors** — none at any viewport

### Routes Tested

| Route | Mobile Status |
|-------|--------------|
| `/` (Landing) | ✅ Pass |
| `/explore` (Explorer) | ✅ Pass |
| `/tracker` (Tracker) | ✅ Pass |
| `/sources` (Sources) | ✅ Pass |
| `/scholarship/gates-cambridge` (Detail) | ✅ Pass |
| `/nope` (404) | ✅ Pass |

## 4. Known Mobile Limitations

| Limitation | Workaround |
|------------|------------|
| **OAuth redirect URLs** use `http://localhost:3000` — cannot be mocked on mobile without local network config | Use `http://192.168.1.14:3000` when testing on local network |
| **Backend API** not exposed on network by design | Keep backend local; Firebase Auth handles auth client-side |
| **CORS** configured for `*` + credentials — works within origin | No cross-origin changes needed for local network testing |
| **Fixed-position elements** — AppShell top nav covers ~56px on mobile | Content starts below nav, no important content obscured |

## 5. Commands Summary

```bash
# Start dev server with network access
npx vite --host 0.0.0.0 --port 3000

# Or using npm (if configured)
npm run dev -- --host

# Start backend on network
cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Check health
curl http://192.168.1.14:8000/api/v1/health

# View on phone (same Wi-Fi)
http://192.168.1.14:3000
```

## 4. Testing Checklist (Print and Use)

- [ ] Open website on phone at `http://<computer-IP>:3000`
- [ ] Test all 5 routes: `/`, `/explore`, `/tracker`, `/sources`, `/scholarship/:id`
- [ ] Verify hamburger menu opens drawer, Escape closes it
- [ ] Touch targets — ensure buttons are easy to tap
- [ ] Verify no horizontal scrolling at any viewport
- [ ] Test forms — input fields fit, keyboards work
- [ ] Check text readability — no zoomed-in issues
- [ ] Test empty states, skeleton loaders, error panels
- [ ] Verify drawer closes on backdrop click and Escape
- [ ] Check navigation works across all routes
- [ ] Verify app shell height is correct (56px mobile / 64px desktop)

---
*Document generated as part of mobile compatibility audit.*
*Last updated: 2026-11-08*
