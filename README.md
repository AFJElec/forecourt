# Forecourt — UK automotive marketplace (temporary brand)

Next.js 15 · TypeScript · Tailwind v4 · Supabase (Postgres) · Stripe · Resend · Vercel

## Quick start

```bash
npm install
cp .env.example .env.local     # leave Supabase blank to run on the built-in demo dataset
npm run dev                    # http://localhost:3000
npm test                       # unit tests
```

### With Supabase

```bash
supabase start                       # or link a hosted project
supabase db reset                    # applies supabase/migrations + supabase/seed.sql
# set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY and DATA_SOURCE=supabase in .env.local
```

### Regenerate demo data / renders

```bash
npm run db:seed:generate             # → supabase/seed.sql + public/demo-vehicles/*.svg
scripts/test-db.sh                   # migrations + seed + SQL/engine parity + RLS smoke test
```

### Static design preview

```bash
npm run preview:build                # → preview/dist (open index.html via any static server)
```

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, layering, schema, UK/FCA rules, security status
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — tokens, type, components, responsive rules
- [docs/PROGRESS.md](docs/PROGRESS.md) — what's done, what's next, credentials, known issues

All demonstration content is flagged `is_demo` and labelled in the UI. It must not be presented as genuine advertisements.
