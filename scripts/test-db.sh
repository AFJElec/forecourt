#!/usr/bin/env bash
# Applies all migrations + seed to a scratch Postgres (with a minimal Supabase auth/storage shim),
# then runs the SQL↔engine parity check and the RLS smoke test.
# Usage: PGURL="-h localhost -p 5432 -U postgres" scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PG=${PGURL:-"-h /tmp -p 54329 -U postgres"}
psql $PG -q -c "drop database if exists forecourt_test" -c "create database forecourt_test"
DB="psql $PG -d forecourt_test -q -v ON_ERROR_STOP=1"
psql $PG -d forecourt_test -q -f supabase/tests/local-auth-shim.sql 2>/dev/null || true
for f in supabase/migrations/*.sql supabase/seed.sql; do $DB -f "$f" >/dev/null; echo "applied $(basename "$f")"; done
$DB -c "grant select, insert, update, delete on all tables in schema public to anon, authenticated; grant usage, select on all sequences in schema public to anon, authenticated;"
PSQL="psql $PG -d forecourt_test" npx tsx scripts/check-sql-parity.ts
SELLER=$($DB -At -c "select seller_user_id from advertisements where seller_type='private' order by slug limit 1")
AD=$($DB -At -c "select id from advertisements where seller_user_id='$SELLER'")
psql $PG -d forecourt_test -At -v seller="$SELLER" -v ad="$AD" -f supabase/tests/rls_smoke.sql
