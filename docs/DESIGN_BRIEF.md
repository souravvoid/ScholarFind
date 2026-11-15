# Design Brief — ScholarFind

> **Status (2026-11-15):** the design decisions below remain in force, but the scope list in §9
> predates the Django migration. Email/password auth, backend catalogue integration, the
> 48-record seeded catalogue, and react-router pages now exist; Firestore rules are legacy.
> Check [SITEMAP.md](SITEMAP.md), [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md), and
> [ai/WORK_STATUS.md](ai/WORK_STATUS.md) for current state. (approved 2026-11-08)

Approved by the product owner via a 3-batch questionnaire. This document is the source of
truth for design intent. `docs/DESIGN_SYSTEM.md` holds the implementation tokens;
`docs/SITEMAP.md` holds routes. Change this file only when a decision changes, and log the
change at the bottom.

## 1. What ScholarFind is

A verification-first scholarship discovery tool. It indexes a **small, curated set of
verified opportunities** (currently 9), shows the exact eligibility rule for each, tells the
student what they are missing, and only ever sends them to the provider's official page
through a trust-gated redirect.

Positioning line: *"Know what you qualify for — before you spend a weekend applying."*

**Brand attributes:** calm, exact, academic, quietly confident. Not a growth-hacky SaaS.
Every claim on screen must be reproducible from data the app actually holds.

## 2. Users and jobs

Primary: international students (18–30) comparing master's/fellowship funding across
countries, often on a phone, often on limited data.

| Job | Where it happens | Success looks like |
|---|---|---|
| "Can I even apply?" | `/explore` + `/scholarship/:id` | Verdict + the exact rule + missing items in one screen |
| "What am I missing?" | Detail page rubric | Actionable list, no vague "not eligible" |
| "Don't let me miss the deadline" | `/tracker` | Deadline urgency ordered by real dates |
| "Is this link real?" | Redirect gate | Verified / unaudited / blocked state before leaving |
| "Save it for later" | Row action + tracker | Works signed-out (device) and signed-in (account) |

Evidence basis: code behavior + `docs/UX_AUDIT.md`. **No user interviews were conducted.**
Assumptions that still need real-user validation are marked `[A]` in §8.

## 3. Approved decisions (2026-11-08)

| # | Question | Decision |
|---|---|---|
| 1 | Arc influence | **Full Arc language globally** — one tokens/type/border system on every route |
| 2 | Navigation shell | **Top nav everywhere + mobile drawer** (no sidebar, no bottom tabs) |
| 3 | Routing | **react-router routes**; `/explore`, `/scholarship/:id`, `/tracker`, `/sources`; filters in query string |
| 4 | Icons | **Full migration to lucide-react**, one shared icon component, `aria-hidden` by default |
| 5 | Catalogue honesty | **Curated verified set**, remove invented scale numbers and unverifiable badges |
| 6 | Profile builder | **Keep the 4-step wizard as a modal**, fix step order, labels, save copy, results |
| 7 | Auth fallback | **Remove the silent demo persona**; guests are device-local and labelled as such |
| 8 | Rollout | **Shared shell first, then one page per reviewable commit** |
| 9 | Hero search | **Carry intent** into `/explore` (degree/field/country become applied filter chips) |
| 10 | Explorer layout | **Dense list rows** (Arc-style), not a card grid |
| 11 | Detail view | **Full page route** `/scholarship/:id` (modal retired) |
| 12 | Default filters | **No filters on load**; show all records; explicit filter bar |
| 13 | Tracker scope | **Fix current tracker** (dead-ends, ghost rows, keyboard, empty state), no pipeline rebuild |
| 14 | Sources page | **Informational provenance page**; the fake-sync button is removed |
| 15 | Motion / a11y | **Subtle motion (120–180 ms), WCAG 2.2 AA baseline** |
| 16 | Landing content | **Real data only**; featured records come from the catalogue, counts derived |
| 17 | Wordmark | **Text wordmark in Space Grotesk + small ink tile**; no new logo asset |
| 18 | Palette | **Warm paper + sapphire**; Arc royal used for accent only; status green/amber/rose |
| 19 | Typography | **Space Grotesk (display) + Inter (UI) + JetBrains Mono (data)**, self-hosted via Fontsource |
| 20 | Landing job | **Profile-first**: wizard → matched results is the dominant path |
| 21 | Auth methods | **Google popup + guest device-local** only; no new providers |
| 22 | Dashboard | **No separate `/dashboard`**; landing adapts for signed-in users, tracker is the hub |

## 4. Content honesty rules (hard)

1. Any count shown must be computed from the loaded dataset (`verifiedRecords.length`,
   distinct countries, etc.) or omitted. No "842 grants", "342 records", "~840".
2. Never render an attribution badge (WHED, WES-ENIC, "verified within 30 days") unless the
   record carries that evidence; the institution field alone proves nothing.
3. Ingestion, sync, and audit language must match reality: a client-side local check is
   described as a local check.
4. Guest persistence is "saved on this device". Only say "saved to your account" when the
   write actually reached the account-backed API for a signed-in user; profile/saved state is
   currently device-local.
5. Eligibility verdicts always show the rule that produced them. Unknown/unsupported rule
   types are surfaced as "needs manual review", never silently passed.
6. No invented testimonials, ratings, or user counts. If a section needs social proof and we
   have none, use product evidence instead (e.g. "every record links to its source").
7. Demo/preview data is removed, not hidden behind a banner (decision 7).

## 5. Visual direction

Arc Browser is the reference for **chrome and restraint**, not for copying.

Take: warm paper canvas, hairline borders instead of shadows, large calm display type,
pill-shaped secondary actions, generous whitespace, one saturated accent used sparingly,
quiet 150 ms state transitions.

Do not take: glassmorphism as a default surface, gradient text, playful/mascot tone,
sidebar-only interaction model, heavy blur stacks, looping background animation.

The result should read as an academic tool made by careful people — ArXiv-meets-Arc.

## 6. Interaction principles

1. **One primary action per screen.** Landing: build profile. Explorer: open a record.
   Detail: check eligibility / apply. Tracker: next step for the nearest deadline.
2. **Never dead-end.** Every control either acts, is visibly disabled with a reason, or is
   removed. No silent no-ops (B-03).
3. **State is visible and reversible.** Filters appear as removable chips; saves and stage
   changes announce via `aria-live`; destructive actions confirm.
4. **No modal on top of a modal.** The redirect gate is the only overlay the detail page may
   open; the profile wizard is a single overlay with internal steps.
5. **Mobile is the primary layout, not a compression.** Single column under 768 px, sticky
   action bar for the detail page, 44 px targets, no horizontal scroll anywhere.

## 7. Accessibility bar (WCAG 2.2 AA)

- Visible focus on every interactive element (2 px sapphire ring, 2 px offset).
- All form controls programmatically labelled; errors linked via `aria-describedby`.
- Every dialog: focus trap, Escape, focus restore, `aria-modal`, labelled title.
- Icon-only buttons: `aria-label` + tooltip; decorative icons `aria-hidden`.
- Status changes (save, stage, audit, filter result count) in `aria-live="polite"`.
- Text contrast ≥ 4.5:1; muted text token fixed to `#5A5A66` (the old `#6B7280` fails on
  `#F3F4F3`).
- `prefers-reduced-motion: reduce` disables transforms and looping animation globally.
- Keyboard-operable list rows and card titles (links/buttons, never `<h3 onClick>`).

## 8. Assumptions that still need validation `[A]`

- A-1: Students value an explicit "what you're missing" list more than a percentage match.
- A-2: Nine curated records are acceptable if provenance is visible; scale is not the draw.
- A-3: Profile-first onboarding will not scare off browse-intent visitors (mitigated by a
  visible "browse all" secondary path).
- A-4: Device-local guest saves are acceptable for a first session.
- A-5: "Unaudited origin" warning wording is understandable without jargon.

## 9. Explicitly out of scope (for now)

- Email/password or magic-link auth (decision 21).
- `/dashboard` (decision 22), i18n, dark mode (revisit after tokens land).
- Backend ingestion/API integration (M6 decision pending).
- Rebuilding the catalogue beyond the seeded 48 records and curated source set (needs a
  data-source decision).
- Deploying the legacy Firestore rules (no longer part of the architecture; safe to archive).

## 10. Change log

| Date | Change | By |
|---|---|---|
| 2026-11-08 | Initial brief from 22 approved questionnaire answers | agent |
