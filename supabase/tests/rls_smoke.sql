-- RLS smoke test. Usage: psql ... -v seller=<private seller uuid> -v ad=<their ad uuid> -f rls_smoke.sql
-- Expected: anon reads active ads only; seller cannot self-feature, self-approve or reactivate to draft; audit log is not writable.
\set ON_ERROR_STOP 0
set role anon;
select 'anon sees active ads', count(*) from advertisements;
select 'anon sees profiles (expect 0)', count(*) from profiles;
update advertisements set price_gbp = 1 where id = :'ad';
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'seller', false);
select 'seller sees own profile only (expect 1)', count(*) from profiles;
update advertisements set price_gbp = price_gbp - 100 where id = :'ad';
select 'price history rows (one more than before)', count(*) from price_history where advertisement_id = :'ad';
update advertisements set is_featured = true where id = :'ad';                 -- expect ERROR
update advertisements set status = 'paused' where id = :'ad';                  -- ok
update advertisements set status = 'active' where id = :'ad';                  -- ok
update advertisements set status = 'draft' where id = :'ad';                   -- expect ERROR
insert into advertisements (slug, vehicle_id, seller_type, seller_user_id, status, title, price_gbp, mileage, postcode, lat, lng)
  select 'x-self-approve', vehicle_id, 'private', :'seller'::uuid, 'active', 'x', 1000, 1, 'CF10', 51, -3 from advertisements where id = :'ad';  -- expect ERROR
update advertisements set price_gbp = 1 where dealership_id is not null;       -- expect UPDATE 0
insert into audit_logs (action, entity_type) values ('x', 'y');                -- expect ERROR
reset role;
