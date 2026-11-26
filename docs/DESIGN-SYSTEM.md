# Design system

Tokens live in `src/styles/globals.css` under `@theme`, so every Tailwind utility (`bg-ink-900`, `text-electric-600`, `shadow-[var(--shadow-card)]`) uses them.

## Colour

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#0b1222` | navigation, footer, dark panels, headings |
| `ink-700/800` | `#1f2a44` / `#141d33` | hovers, gradients |
| `canvas` | `#f5f7fa` | page background |
| `surface` | `#ffffff` | cards |
| `mist-100…300` | `#eef1f6` → `#cfd6e2` | subtle fills, borders |
| `slate-ink` | `#3c4659` | body text |
| `muted` | `#6a7487` | secondary text |
| `electric-500` | `#2f74ff` | primary accent / CTAs / focus |
| `electric-50…700` | | tints and pressed states |
| `success-600`, `warn-600`, `danger-600` | | price badges, disclosures, errors |

Price assessment colours: Excellent = solid green, Good = green tint, Fair = neutral, Above = amber. Never red — "above average" isn't an error.

## Type

* Display: **Plus Jakarta Sans** 700–800, tight tracking (`-0.02em`) — headings, prices.
* Body: **Inter** 400–600 — UI and copy. Numbers use `.tabular` (tabular figures).
* Scale: hero 34/48/56, page title 28–32, section title 24–28, card title 17, body 15–16, meta 13, legal 12.

## Shape, depth, motion

* Radii: cards `1.125rem` (`--radius-card`), controls `0.75rem`, chips/badges full.
* Shadows: `--shadow-card` resting, `--shadow-card-hover` on hover (+ 2px lift), `--shadow-float` for hero search, drawers, banners.
* Motion: 200–300ms ease; image zoom 1.03 on card hover; `fade-up` on hero. All disabled under `prefers-reduced-motion`.

## Components

| Component | File | Notes |
|---|---|---|
| Button | `ui/button.tsx` | primary, secondary (navy), outline, ghost, subtle, inverse, link · sm/md/lg/icon |
| Badge | `ui/badge.tsx` | neutral, dark, electric, soft, success, warn, danger, outline |
| Input / Select / Textarea / Label / Chip | `ui/field.tsx` | 48px touch targets; native `<select>` for mobile pickers |
| VehicleCard | `vehicle/vehicle-card.tsx` | grid / list / rail layouts; whole card is one link; save button above it |
| PriceAssessmentBadge | `vehicle/price-assessment-badge.tsx` | renders nothing without data |
| VehicleGallery | `vehicle/vehicle-gallery.tsx` | swipe, arrows, thumbnails, full-screen (Esc/arrow keys) |
| FinanceCalculator | `vehicle/finance-calculator.tsx` | illustrative only, labelled |
| ContactPanel / ShareReport / MobileContactBar | `vehicle/*` | message, viewing, part-exchange; call reveal; fixed mobile bar |
| HeroSearch / FilterPanel / ResultsToolbar / ActiveFilters / Pagination | `search/*` | URL is the state |
| SiteHeader / MobileTabBar / SiteFooter / CookieConsent | `layout/*` | app-style bottom nav on mobile |
| BodyIcon | `vehicle/body-icon.tsx` | generated from the same geometry as demo renders |
| PlannedFeature / DemoNotice | `common/*` | the standard way to flag unfinished or demo content |

## Responsive rules

* Breakpoints: `sm 640` · `lg 1024` (sidebar filters, desktop nav) · `xl 1280`.
* Mobile: bottom tab bar (Home, Search, Saved, Messages, Account); filters in a bottom sheet with "Show N results"; vehicle page swaps the tab bar for a fixed contact bar; rails scroll horizontally with snap.
* Never put a `position: fixed` layer inside an element with `backdrop-filter`/`transform` (it becomes the containing block) — see the note in `site-header.tsx`.

## Imagery

Demo listings use generated studio-style SVG renders marked "ILLUSTRATIVE IMAGE · DEMO LISTING". Real adverts use uploaded photos (4:3, served through `next/image` → AVIF/WebP). Manufacturer tiles use monograms until licensed logos are supplied via `manufacturers.logo_url`.
