# Sitemap — ScholarFind v1 (approved 2026-11-08)

Route model: **react-router** (decision 3). Every route shares `AppShell` (top nav +
mobile drawer + footer). Tab state (`landing/explore/tracker/sources`) is retired.

## Routes

| Path | Page | Access | Primary action | Replaces |
|---|---|---|---|---|
| `/` | Landing | public | **Find my matches** → profile wizard | `currentTab='landing'` |
| `/explore` | Catalogue explorer | public | Open a record | `currentTab='explore'` |
| `/scholarship/:id` | Scholarship detail | public | Check eligibility / Apply | `ScholarshipDetailsModal` |
| `/tracker` | Saved & applications | public (guest or account) | Next step on nearest deadline | `currentTab='tracker'` |
| `/sources` | Provenance & verification | public | Read source record | `currentTab='sources'` |
| `/login` | Sign in | public (redirects when signed in) | Sign in with email/password | — (new 2026-11-09) |
| `/signup` | Create account | public (redirects when signed in) | Create account | — (new 2026-11-09) |
| `*` | Not found | public | Back to explore | — (new) |

Not in v1: `/dashboard`, `/profile` (decisions 21–22). The profile wizard stays a modal;
account pages are limited to `/login` and `/signup`.

## Query state

`/explore` is shareable: `?q=&country=&degree=&funding=&deadline=&sort=`
(`deadline` ∈ `any|30|90`, `sort` ∈ `deadline|name`). Landing hero writes `q/country/degree`
into these params. Chips reflect params; clearing a chip removes its param. Back/forward
restore the exact view.

## Page structures

### `/` Landing (public)
1. **Nav** — wordmark, Explore / Tracked / Sources, account, CTA.
2. **Hero** — display-xl headline, one-sentence value line, primary `Find my matches`
   (opens wizard), secondary `Browse all {n} verified records` (n derived). No search form
   that pretends to filter (decision 9 = intent is carried, not simulated).
3. **How it works** — 3 honest steps: answer 4 questions → see the exact rule → apply at the
   official page.
4. **Featured records** — 3 real catalogue records (nearest deadlines) rendered with the
   shared list-row component. Every card can open its detail route.
5. **Verification strip** — derived counts only: records, countries, providers; link to
   `/sources`.
6. **Footer** — working links only (nav routes, provenance, repository). No inert buttons.

Signed-in variant: compact greeting row (saved count, next deadline, "continue profile")
replaces the CTA emphasis. Same sections otherwise.

### `/explore` Explorer (public)
1. Page header: title, derived count `{shown} of {total} verified records`.
2. Filter bar: search, country, degree level, funding, deadline window, sort. Always visible.
3. Applied chips row + `Clear all`.
4. Dense result rows: title (link), provider · country, degree, funding, deadline (mono,
   urgency), eligibility badge when a profile exists, save toggle, open action.
5. Empty state: explanation + `Clear filters` + `Browse all`.
6. Loading skeletons matching row geometry; failure banner notes static-baseline fallback.

### `/scholarship/:id` Detail (public)
1. Breadcrumb `← Explore` + save toggle.
2. Header: title, provider, country (flag `aria-hidden` + name), status/eligibility badge.
3. Overview (provider-authored summary, no invented claims).
4. Eligibility rubric: each rule → value → verdict; missing-items list; unsupported rules
   shown as "needs manual review".
5. Deadline + funding panel (mono dates, derived days remaining, urgency states).
6. Provenance: source name, last audited date, link to source record, verification note.
7. Actions: `Check my eligibility` (opens wizard / shows current verdict), `Apply at
   provider` (redirect gate), save. Sticky action bar under 768 px.
8. Unknown id: honest empty state (record not in current catalogue) + back to explore.

### `/tracker` Saved & applications (public)
1. Page header + derived counts (`{n} saved · {n} due in 14 days`).
2. Persistence notice: "Saved on this device" (guest) / "Synced to your account" (signed-in
   with a successful write).
3. Items ordered by real deadline: title (link), stage control, deadline, checklist, docs
   status, apply gate, remove. No dead-ends: non-catalogue ids get a plain explanation and
   a working official link only if provenance exists.
4. Empty state → browse records.

### `/sources` Provenance (public)
1. What "verified" means (rule, audited date, source record).
2. Coverage: derived records/countries/provider counts.
3. Source list: name, scope, records contributed, last audited, provenance link.
4. How records enter the catalogue (service-side process; no client ingestion claim).
5. No "Audit & Refresh" button (removed, decision 14).

### `/login` and `/signup` Account (public)
1. Page intro: one-line account promise + honest note that profile/saved records stay on
   this device.
2. Form card: email, password, sign-up display name + confirmation.
3. Inline field errors from DRF, one `role="alert"` summary for non-field errors.
4. Switch link between sign-in and sign-up; back-to-home link.
5. On success, return to the originating route (or `/`) and show the account menu.
6. Already-signed-in visitors are redirected away from both routes.

### `*` Not found
Short message + `Go to Explore`.

## Overlays

| Overlay | Status | Trigger | Notes |
|---|---|---|---|
| `ProfileBuilder` wizard | keep, fix | CTA/nav/explore/detail | Steps: 1 citizenship → 2 academics → 3 goals → 4 results. Starts at step 1 (B-09). Wizard implements its own dialog behavior, full-screen sheet <768 px (no shared `Dialog` primitive — deleted 2026-11-08, zero importers) |
| `OfficialRedirectModal` | keep | Detail + tracker apply | verified / unaudited / blocked gate; https-only; blocked disables proceed |
| Mobile nav drawer | keep | hamburger | shared focus-trap behavior |

## Navigation labels

`Explore` · `Tracked` · `Sources` (route `/tracker` keeps its path; label shortens for the
top bar). Account control shows `Sign in` (links to `/login`) or avatar menu with `Sign out`.
