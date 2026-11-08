# Design System — ScholarFind v1 (approved 2026-11-08)

Global system for **every** route and overlay. No page-specific styling beyond layout
composition. Source tokens live in `src/index.css` (`@theme`); this doc is the contract.

Reference: Arc Browser for chrome/restraint only (see `docs/DESIGN_BRIEF.md` §5).

## 1. Token layers

`primitive` (raw values) → `semantic` (role) → `component` (usage). Components never use
primitive values directly; they use semantic tokens or the component classes below.

### 1.1 Color (primitive → semantic)

| Semantic token | Value | Use | Verified contrast |
|---|---|---|---|
| `--color-paper` | `#FBFBFA` | App canvas | — |
| `--color-paper-raised` | `#FFFFFF` | Cards, dialogs, inputs | — |
| `--color-paper-sunken` | `#F3F4F3` | Table headers, inset panels | — |
| `--color-ink` | `#14141F` | Primary text, headings | 17.6:1 on paper |
| `--color-ink-muted` | `#5A5A66` | Secondary text, metadata | 6.6:1 on paper · 6.2:1 on sunken |
| `--color-hairline` | `#E4E4E0` | 1 px borders/dividers | — |
| `--color-hairline-strong` | `#D2D2CC` | Hover/focus borders | — |
| `--color-sapphire` | `#0037B0` | Primary action, links | 9.3:1 on paper · white on it 9.7:1 |
| `--color-sapphire-hover` | `#1D4ED8` | Hover/pressed | 6.7:1 with white |
| `--color-royal` | `#3B3BFF` | Accent only (underline, marker, focus glow) | 6.2:1 on paper |
| `--color-cream` | `#FFFEF0` | Callout/quote surface | ink on it >15:1 |
| `--color-eligible-*` | text `#047857` / surface `#ECFDF5` / border `#A7F3D0` | Eligible | 5.2:1 |
| `--color-pending-*` | text `#B45309` / surface `#FFFBEB` / border `#FDE68A` | Manual review / warning | 4.8:1 |
| `--color-missing-*` | text `#BE123C` / surface `#FFF1F2` / border `#FECDD3` | Ineligible / blocked | 5.7:1 |
| `--color-disabled-surface` | `#EFEFEC` | Disabled control bg | — |
| `--color-disabled-text` | `#6B6B75` | Disabled label | 4.6:1 on disabled surface |

Rules:
- Never use raw hex in components; `#6B7280` (old muted) is retired — it measures 4.38:1 on
  sunken surfaces and fails AA for small text.
- Royal is never body text or a large fill; sapphire is the action color.
- Status colors are only for eligibility/trust states, never decoration.

### 1.2 Typography

Families (self-hosted via Fontsource; Manrope removed, Google Fonts `<link>` removed):

| Role | Family | Weights |
|---|---|---|
| Display / headings | Space Grotesk | 500, 600, 700 |
| UI / body | Inter | 400, 500, 600 |
| Data (dates, ids, deadlines) | JetBrains Mono | 500 |

Scale (mobile → desktop with `clamp`):

| Token | Size / line-height | Family | Use |
|---|---|---|---|
| `display-xl` | `clamp(2.5rem, 6vw, 4.5rem)` / 1.02 | SG 700, tracking `-0.03em` | Landing hero only |
| `display-lg` | `clamp(2rem, 4vw, 3rem)` / 1.08 | SG 700, `-0.02em` | Page hero |
| `h1` | `clamp(1.75rem, 3vw, 2.25rem)` / 1.15 | SG 600 | Page title |
| `h2` | `1.5rem` / 1.25 | SG 600 | Section title |
| `h3` | `1.125rem` / 1.35 | SG 600 | Row/card title |
| `body` | `1rem` / 1.6 | Inter 400 | Default |
| `body-strong` | `0.9375rem` / 1.5 | Inter 600 | Buttons, labels |
| `small` | `0.875rem` / 1.5 | Inter 400 | Helper text |
| `caption` | `0.75rem` / 1.4 | Inter 500, `0.02em` | Metadata (never sole carrier of meaning) |
| `mono` | `0.8125rem` / 1.5 | JBM 500 | Deadlines, counts, ids |

Rules: max content width 68ch for prose; headings never all-caps (caption labels only);
numerals in tables/deadlines use `font-variant-numeric: tabular-nums`.

### 1.3 Spacing, radius, elevation

- Spacing scale (4 px base): `4, 8, 12, 16, 24, 32, 48, 64, 96`. Only these.
- Section rhythm: `clamp(48px, 8vw, 96px)` vertical.
- Container: `max-width: 1200px`; gutters `20px` (<768), `32px` (≥768), `48px` (≥1280).
- Radius: `6px` (badges/chips), `10px` (inputs/buttons), `14px` (cards), `16px`
  (dialogs/sheets), `999px` (pills, avatars).
- Borders: `1px solid var(--color-hairline)`. Hover: `--color-hairline-strong`.
- Shadow: default **none** (Arc restraint). Allowed:
  `--shadow-raise: 0 1px 2px rgba(20,20,31,.05)`,
  `--shadow-overlay: 0 24px 64px -16px rgba(20,20,31,.24)` (dialogs only).

## 2. Layout & navigation

- **App shell**: sticky top nav, height `64px` desktop / `56px` mobile, paper background at
  92 % opacity with `backdrop-filter: blur(8px)`, hairline bottom border. No shadow.
- **Nav content**: wordmark (+ ink tile) left; `Explore`, `Tracked`, `Sources` center/right;
  profile/account control right; primary CTA `Find my matches` on the landing page only.
- **Mobile**: hamburger opens a right-side drawer (`min(360px, 88vw)`), 56 px rows, focus
  trap, Escape, backdrop click, body scroll lock, focus restore.
- **Page frame**: eyebrow caption → h1 → one-line description → optional actions,
  then content sections. Same layout pattern on all routes. (No shared `PageHeader`
  primitive — one was created in Step 0 but deleted 2026-11-08 after grep showed zero
  importers; see `docs/DELETION_LOG.md`.)
- **No sidebar**, no bottom tab bar (decision 2).

## 3. Components

Every component below is shared (`src/components/ui/`) — never re-implemented per page.

### Button
- Height `44px` (min, also 44 px tap target), radius `10px`, padding `0 20px`,
  `body-strong`, inline icon 16 px + 8 px gap.
- Variants: `primary` (sapphire bg, white text, hover sapphire-hover), `secondary`
  (paper bg, hairline border, ink text), `ghost` (transparent, ink-muted text, hover
  paper-sunken), `danger` (rose text, rose border, white bg).
- Focus: `2px solid sapphire`, offset 2 px. Disabled: `disabled-surface` +
  `disabled-text`, `cursor-not-allowed`, `aria-disabled` where it must stay focusable.
- Motion: background/border `120ms`; transform on press `scale(.98)` only when motion is
  allowed.

### Input / Select / Textarea
- Height `44px` (textarea min 96 px), radius `10px`, `1px` hairline border, paper-raised bg.
- Label above (`body-strong`), optional hint (`small`, ink-muted), error below
  (`small`, missing text) linked with `aria-describedby` + `aria-invalid`.
- Focus ring identical to buttons. Placeholder is ink-muted at 70 % and never a label.
- Selects are native elements styled to match (keyboard + mobile correctness); no custom
  listbox unless a multi-select is unavoidable.

### Chips / filters
- Active filter chip: pill, `paper-sunken` bg, hairline border, label + `X` button
  (`aria-label="Remove <filter>"`), 32 px tall, 12 px text.
- Filter bar is always visible on `/explore`; result count sits beside it and updates in an
  `aria-live="polite"` region.

### List row (explorer results, tracker items)
- Layout: 3 columns on desktop (identity / meta / actions), stacked on mobile.
- `padding: 16px 0`, `border-bottom: 1px solid hairline`, hover `paper-sunken` at 60 %.
- Title is a real link (`/scholarship/:id`) in `h3`; provider + country in `small`.
- Deadline in `mono` with weekday + urgency color (pending <14 days, missing if passed).
- Actions right: save toggle (icon-only, `aria-pressed` + label), primary open action.
- Whole-row click is a convenience layer only; keyboard path is the title link.

### Card
- Used for landing feature tiles and empty-state panels only — **not** for results lists.
- Paper-raised, hairline border, radius 14 px, padding 24 px; hover raises shadow

### Badge (status)
- Pill, `caption` 12 px 600, padding `4px 10px`, 1 px border.
- Variants map 1:1 to eligibility/trust: eligible, pending/manual review, missing,
  verified link, unaudited link, blocked link.
- Badge text must match the rubric that produced it; no badge without evidence.

### Tooltip
- Icon-only controls only. 400 ms open delay, ink background, white 12 px text, radius 8 px,
  `aria-describedby` target. Dismiss on Escape/blur. Never contains interactive content.

### Table / definition list
- Tracker detail rows: definition list (`dt`/`dd`) per item; no horizontal-scroll tables.
- If a true table is ever needed: hairline row dividers, header `caption` + sunken bg,
  `tabular-nums`, no vertical borders, card-less.

### Empty state
- Icon 24 px (ink-muted) → `h3` → one sentence explaining why it's empty → **one** primary
  action. Examples: no results (clear filters), empty tracker (browse records), unknown id
  (return to explore). Never a blank grid.

### Loading state
- Skeleton blocks matching final row geometry (`paper-sunken`, 1.4 s shimmer, disabled under
  reduced motion). No spinner for list/page content; a spinner is allowed only inside a
  button for <5 s actions. Loading text is announced once via `role="status"`.

### Error state
- Inline panel: missing surface, missing border, icon, one-line cause in plain language,
  retry button, and — where the static baseline is used — a provenance note
  ("Showing the verified local catalogue; live database unavailable."). No raw stack traces.

## 4. Iconography (lucide-react)

- One component: `src/components/ui/Icon.tsx` exporting a semantic map; pages never import
  from `lucide-react` directly.
- Sizes: `16` (inline with small text), `18` (buttons/rows), `20` (nav), `24` (empty states).
  `strokeWidth={1.75}`, `currentColor`.
- Decorative icons: `aria-hidden="true"` (default in the component). Icon-only buttons must
  pass `label` → renders `aria-label` and a tooltip.
- Suggested semantics: save→`Bookmark`, saved→`BookmarkCheck`, deadline→`CalendarClock`,
  verified→`BadgeCheck`, unaudited→`TriangleAlert`, blocked→`ShieldX`, external→
  `ExternalLink`, search→`Search`, filters→`SlidersHorizontal`, country→`Globe2`,
  eligible→`CircleCheck`, missing→`CircleX`, manual→`CircleHelp`.
- No emoji in interface chrome; flags may remain as text but must be wrapped in
  `aria-hidden` with a country name adjacent.
- Migration: delete the Material Symbols `<link>` only after zero spans remain.

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | All UI transitions |
| `--dur-fast` | `120ms` | Color, border, opacity |
| `--dur-base` | `180ms` | Transform, drawer, dialog |

- Allowed: hover/press states, drawer/dialog enter, chip add/remove, skeleton shimmer.
- Not allowed: parallax, auto-rotating carousels, looping ambient animation, scroll-jacking.
- `@media (prefers-reduced-motion: reduce)`: durations → `1ms`, transforms disabled,
  shimmer static. Implemented once globally, not per component.

## 6. Responsive contract

Breakpoints: `xs 320`, `sm 375`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1440`.

| Range | Rules |
|---|---|
| 320–374 | Single column, 20 px gutters, nav 56 px, no side-by-side actions, mono wraps, title `h2` max |
| 375–767 | Same single column, 20 px gutters, drawer nav |
| 768–1023 | 2-column grids allowed (cards), 32 px gutters, drawer nav until 1024 |
| 1024–1439 | Top nav full, list row 3-column, 32 px gutters |
| ≥1440 | Container capped 1200 px, centered, 48 px gutters |

Hard rules: `overflow-x` never on body content; no fixed widths > `100%`; no text below
12 px; every control ≥44 px tall on touch; dialogs become sheets under 768 px; the detail
page gets a sticky bottom action bar under 768 px.

## 7. Implementation mapping

- Tokens: `src/index.css` `@theme` block (replace the current mixed M3/Arc tokens).
- Primitives: `src/components/ui/{Button,Icon,Badge,Card,Chip,Container,EmptyState,ErrorPanel,Skeleton}.tsx`.
- Layout: `src/components/layout/{AppShell,TopNav,MobileDrawer,Footer}.tsx`.
- Retire: `arc-*` one-off utility classes once pages consume primitives; Manrope +
  Material Symbols font links; hardcoded hexes in components.
- Verification: screenshots at 375 / 768 / 1440 for each route; `npm run lint`,
  `npm run test:frontend`, `npm run build`, `npx playwright test`.
