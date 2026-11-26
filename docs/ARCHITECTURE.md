# Architecture

> Temporary brand: **Forecourt** — change in `src/config/brand.ts` (+ logo mark in `components/layout/logo.tsx`, PWA icons in `public/icons`).

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Web app | Next.js 15 (App Router) + React 19 + TypeScript (strict) | Server Components for data pages; client components only where interactive |
| Styling | Tailwind CSS v4 + shadcn/ui conventions (`components.json`) | Tokens in `src/styles/globals.css` (`@theme`) |
| Database | PostgreSQL via Supabase | Migrations in `supabase/migrations`, RLS on every table |
| Auth | Supabase Auth via `@supabase/ssr` | cookie sessions refreshed in `middleware.ts`; `profiles` row + `buyer` role created by trigger on sign-up |
| Storage | Supabase Storage (`listing-media`, `dealer-branding`) | Upload path must start with the uploader's user id |
| Search | PostgreSQL FTS + filter RPC (`search_listings`, `count_listings`) | Contract designed to be replaced by Typesense/Meilisearch/OpenSearch |
| Payments | Stripe (Phase 6) | `stripe_events` table gives idempotent webhook processing |
| Email | Resend (Phase 5) | Templates in `email_templates` (admin-editable) |
| Hosting | Vercel | Security headers in `next.config.ts` |

## Layering

```
app/ (routes, metadata, route handlers)          ← thin: parse params, call loader, render view
  └─ lib/pages/loaders.ts                         ← page data assembly (shared by web, preview, future API)
       └─ lib/repositories/{index,demo,supabase}  ← ListingRepository / TaxonomyRepository / DealerRepository
            ├─ lib/search/engine.ts               ← in-memory implementation (demo + tests)
            └─ Postgres RPCs (search_listings…)   ← production implementation
views/       ← pure presentational page views (no data fetching)
components/  ← ui/ (design-system primitives), layout/, search/, vehicle/, home/, common/
lib/api/handlers.ts ← framework-agnostic API handlers (validated with zod) → reused by a versioned JSON API for native apps
```

Why: pages never import a data source directly. Switching `DATA_SOURCE=demo|supabase` (or adding a search-engine adapter) touches one file. The same loaders and handlers will back `/api/v1/*` for dedicated iOS/Android apps, so mobile apps don't need a rebuilt backend.

## Folder structure

```
supabase/
  migrations/           0001 foundation → 0008 storage/settings (validated on Postgres 16)
  seed.sql              GENERATED demo data (npm run db:seed:generate)
  tests/                rls_smoke.sql + local auth/storage shim
scripts/
  generate-seed.ts      demo dataset → seed.sql + illustrative SVG renders
  check-sql-parity.ts   SQL search == in-memory search, 28 filter cases
  test-db.sh            migrations + seed + parity + RLS smoke on a scratch DB
src/
  app/                  routes (see below)
  components/ views/ lib/ config/ content/ data/demo/ types/
  modules/              reserved for future marketplace modules (vans, bikes, classics, auctions…)
tests/                  node:test unit tests (npm test)
preview/                static design preview build (not part of production)
docs/                   ARCHITECTURE, DESIGN-SYSTEM, PROGRESS
```

### Routes (Phase 1)

| Route | Type | Notes |
|---|---|---|
| `/` | live | homepage |
| `/used-cars` | live | search; all filters in the URL (shareable, canonicalised) |
| `/used-cars/[make]`, `/used-cars/[make]/[model]` | live | SEO landing pages (404 for unknown make/model) |
| `/vehicle/[slug]` | live | advert page, JSON-LD `Car`+`Offer` |
| `/dealers`, `/dealers/[slug]` | live | directory + public dealer profile |
| `/saved` | live | saved vehicles + saved searches; device-local, synced to the account when signed in |
| `/compare` | live | up to 4 vehicles side by side |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/sign-out` | live (needs Supabase) | password + email-link auth |
| `/account`, `/account/settings`, `/account/notifications` | live (needs Supabase) | protected by middleware |
| `/api/me`, `/api/me/{sync,saved,recent,searches,notifications,export,delete}` | live (needs Supabase) | RLS-scoped per user |
| `/sell`, `/valuation`, `/messages`, `/new-cars`, `/vans`, `/motorcycles`, `/advertise` | planned | clearly labelled "Not yet live · Build phase N" |
| `/api/search`, `/api/search/count`, `/api/vehicles` | live | rate-limited, cache headers |
| `/api/enquiries`, `/api/reports` | validated | demo: validated, not delivered; live delivery = Phase 5/6 (returns 501 `unfinished`) |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest` | live | demo/staging is `noindex` unless `NEXT_PUBLIC_ALLOW_INDEXING=true` |

## Database

28 core tables + supporting tables. Key relationships:

```
auth.users 1─1 profiles ─< user_roles >─ role_permissions          (RBAC)
dealerships ─< dealership_locations, dealership_staff(user, role)  (multi-site, staff permissions)
manufacturers ─< models ─< derivatives
vehicles (VRM, spec) ─1 vehicle_specifications, ─< vehicle_equipment >─ equipment_items, ─< vehicle_history_checks
advertisements (price, status, seller, package) ─> vehicles
  ─< vehicle_media, price_history, saved_vehicles, enquiries, conversations, reports, advertisement_analytics_daily
conversations ─< messages ; user_blocks
ad_packages, subscription_plans ─< subscriptions ; payments ─ invoices ; stripe_events
notifications, push_subscriptions, valuations, audit_logs (append-only), platform_settings, email_templates, content_pages, postcode_districts
```

* **Vehicle vs advertisement** are separate so a car can be relisted and price history survives.
* **Status workflow** enforced by trigger `guard_advertisement`: sellers can only create `draft`/`pending_review`; moderators/service role publish; sellers can pause/resume/sell/remove but cannot self-feature, self-approve or edit counters.
* **Price history** recorded by trigger on every price change → price-drop alerts + dealer price-adjustment history.
* **Search**: `listing_search` view (security_invoker, so RLS applies) + `listing_matches(row, jsonb)` predicate shared by `search_listings` and `count_listings`. Partial indexes on active ads; bounding-box prefilter for radius.
* **RLS**: deny-by-default on every table; tested by `supabase/tests/rls_smoke.sql`.
* **Configurable commerce**: package prices, durations, photo limits and dealer plan limits live in `ad_packages` / `subscription_plans`; app settings in `platform_settings`.

## Accounts & sync (Phase 2)

* Session is read client-side (`AuthProvider` → `/api/me`) so public pages stay statically cacheable; account pages are `force-dynamic`.
* Saved vehicles, recently viewed and saved searches live in localStorage for everyone. When a user signs in, `AuthProvider` posts the device lists to `/api/me/sync` (→ `merge_device_lists`), replaces the local lists with the account's, then mirrors each local change to the API. Components only ever use `useLocalList()`.
* Saved searches store the canonical query string (for links) **and** a resolved jsonb filter (postcode → lat/lng) so `listing_matches()` can evaluate alerts in SQL.
* Notifications: price drops via trigger on `price_history`; saved-search matches via `process_saved_search_alerts(freq)` on pg_cron. Email/push delivery is Phase 5.

## UK-specific rules baked in

* GBP, miles, UK postcodes (validation + area centroids; postcodes.io for precise lookup), UK VRM formats and plate identifiers.
* Demo registrations use the never-issued `ZZ` prefix so they can't match a real vehicle.
* Category S/N disclosed on cards and adverts; filter to include/exclude/only.
* Trade vs private clearly labelled with Consumer Rights Act note.
* **Finance / FCA**: monthly figures are labelled *illustrative — not a finance offer*; no "apply" journey; `finance.regulated_features_enabled=false`. Enabling quotes/applications requires FCA authorisation (credit broking) or an appointed-representative/introducer arrangement with an authorised firm, plus compliant representative examples. Monthly-budget search uses the same illustrative maths to derive a price ceiling.
* **Price assessments** only when ≥ 5 comparable active listings (same make/model, ±2 years), normalised for age and mileage. Otherwise no badge.
* **GDPR/PECR**: cookie banner with equal "Reject"; non-essential scripts must check consent; legal pages are drafts flagged for solicitor review.

## Security (status)

| Item | Status |
|---|---|
| RLS + role/permission helpers | done, tested |
| API validation (zod), honeypot | done |
| Rate limiting | in-memory (dev). **Phase 8: Upstash Redis** for multi-instance |
| Security headers | done (`next.config.ts`); CSP to add in Phase 8 |
| Secure uploads | bucket MIME/size limits + per-user folder policy; virus scan/EXIF strip in Phase 3 |
| Stripe webhooks | schema ready (`stripe_events`); handler Phase 6 (verify signature, idempotent) |
| Audit logging | append-only table + `log_admin_action()`; admin UI Phase 6 |
| Backups | Supabase PITR (Pro plan) — enable at launch |
| Error logging | `error.tsx` hook; Sentry in Phase 8 |

## Future modules

`src/modules/` will hold self-contained marketplace verticals (commercial vehicles, motorcycles, classics, performance, caravans/motorhomes, salvage, auctions, dealer-to-dealer, parts). The schema already has `vehicle_category` and `body_type` values for van/motorcycle; each module adds its own taxonomy, filters and routes without touching the car marketplace.
