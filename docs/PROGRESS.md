# Development progress

_Last updated: 26 Nov 2026 · Current phase: **1 (complete, pending first `next build` on a machine with npm access)**_

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 | Design system, homepage, navigation, search, listing pages | ✅ Built |
| 2 | Database, auth, buyer accounts, saved vehicles | 🟡 Schema + RLS + seed done and tested; auth UI/wiring not started |
| 3 | Private seller advertising + dashboard | ⬜ Schema ready (packages, status workflow, media) |
| 4 | Dealer portal + stock management | ⬜ Schema ready (locations, staff roles, subscriptions) |
| 5 | Messaging, enquiries, notifications | 🟡 Enquiry form + validation done (demo: not delivered); schema ready |
| 6 | Payments, subscriptions, admin | ⬜ Schema ready (Stripe tables, audit log, RBAC permissions) |
| 7 | External data, valuations, advanced | ⬜ |
| 8 | Security testing, performance, deployment | ⬜ |

## Completed (Phase 1 + groundwork)

- Architecture, folder structure, repository pattern, design tokens and component library.
- **Database**: 8 migrations — profiles/roles/permissions, dealers (multi-site, staff roles), taxonomy, vehicles/specs/equipment/history, advertisements + media + price history, saved vehicles/searches, recently viewed, conversations/messages/blocks, enquiries, reviews (auto rating), packages/plans/subscriptions/payments/invoices/stripe_events, notifications/push, analytics, valuations, reports, audit logs (append-only), settings, email templates, content pages, postcode districts, storage buckets.
- **RLS** on every table + advert status/feature guard trigger. Smoke-tested: anon read-only, sellers can't self-approve/feature, audit log not writable.
- **Search**: SQL RPCs and in-memory engine with identical semantics — **verified equal on 28 filter combinations** against a seeded Postgres.
- **Demo data**: 92 listings, 19 manufacturers, 10 fictional dealerships, private sellers, Cat S/N examples; every record `is_demo`; registrations use the never-issued `ZZ` prefix; 133 illustrative render files (body × colour × 4 angles).
- **Homepage**: hero search (make/model, min/max price, total vs monthly, postcode + radius, live matching count), featured, recently added, body types, EV/hybrid, popular makes, featured dealers, sell + valuation promos, recently viewed, footer with trade/FCA/demo disclosures.
- **Search page**: all 23 requested filters, 7 sorts (distance enabled with postcode), grid/list, pagination, active-filter chips, disjunctive facet counts, save search, share URL, canonical query strings, mobile bottom-sheet filters; make & model SEO landing pages.
- **Vehicle page**: gallery with swipe + full screen, price, illustrative finance calculator, key specs, description, equipment, technical spec, running costs, MOT/history panel, seller panel (trade vs private rights), contact form (message / viewing / part-exchange), call reveal, save, share, report, similar vehicles, fixed mobile contact bar, JSON-LD.
- **Dealers**: directory + public profile (logo, description, address, phone, hours, rating, stock, website, contact form).
- **PWA**: manifest, icons, service worker (offline shell + image cache), app-style bottom navigation.
- **SEO**: dynamic metadata, canonical URLs, sitemap, robots (staging = noindex), structured data, `noindex` on deep filter combos and demo adverts.
- **Compliance UI**: cookie consent (reject = accept prominence), Cat S/N disclosures, illustrative-finance labelling, draft legal pages.
- **Tests**: 19 unit tests (`npm test`), DB parity + RLS (`scripts/test-db.sh`).

## Outstanding (next up)

1. `npm install && npm run build` — the build environment used so far had no npm registry access, so the Next.js build has not been run yet. Type-checked with stubs; expect only minor fixes.
2. Phase 2: Supabase project, auth pages (sign up/in, magic link, reset), middleware session refresh, move saved/recent/searches from localStorage to tables (merge on sign-in), compare up to 4 vehicles, facet RPC for Supabase search, taxonomy/dealer repositories on Supabase.
3. Location landing pages (`/used-cars/in/[town]`) — listed in spec, not yet built.
4. Video playback on vehicle pages (schema supports `video_url`; UI shows placeholder).
5. Dealer reviews list UI (data model done).

## Required credentials

| Service | Env vars | Needed from |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Phase 3/6 |
| Resend | `RESEND_API_KEY`, verified sending domain | Phase 5 |
| DVLA Vehicle Enquiry Service | `DVLA_VES_API_KEY` | Phase 3 |
| DVSA MOT History API | client id/secret + API key | Phase 7 |
| Valuation / spec / history provider | commercial contract | Phase 7 |
| Anthropic (AI descriptions) | `ANTHROPIC_API_KEY` | Phase 3 |
| Upstash Redis (rate limiting) | `UPSTASH_REDIS_REST_URL/TOKEN` | Phase 8 |
| Sentry | `SENTRY_DSN` | Phase 8 |
| Web push | VAPID key pair | Phase 5 |

## Known issues / decisions to make

- **Brand name** is a placeholder ("Forecourt"). Check trademark availability before committing.
- **FCA**: decide between own credit-broking permission vs appointed-representative/introducer route before any finance quotes or "apply" buttons.
- Rate limiter is in-memory → not effective across Vercel instances until Redis is added.
- Postcode radius uses postcode-**area** centroids offline (±10–20 miles); production should load ONS district centroids or call postcodes.io (already wired in `geocodePostcode`).
- Price assessment model is deliberately simple (median of age/mileage-normalised comparables). Revisit with real market data volumes.
- Manufacturer logos are trademarks — using monograms until licensed.
- Legal pages are placeholders requiring solicitor review; ICO registration required.
- Demo images are illustrations, not photographs (no network access for licensed stock photography in this environment).
