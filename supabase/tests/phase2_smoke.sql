-- Phase 2 smoke test. Usage: psql ... -v buyer=<uuid> -v ad=<active trade ad uuid> -f phase2_smoke.sql
\set ON_ERROR_STOP 0
set role authenticated;
select set_config('request.jwt.claim.sub', :'buyer', false);
-- merge device lists (one bogus id is ignored)
select public.merge_device_lists(array[:'ad'::uuid, gen_random_uuid()], array[:'ad'::uuid]);
select 'saved after merge (expect 1)', count(*) from saved_vehicles;
select 'recent after merge (expect 1)', count(*) from recently_viewed;
insert into saved_searches (user_id, name, query, query_string, alert_frequency)
  values (:'buyer', 'Any Ford', '{"make":"ford"}', 'make=ford', 'daily');
update profiles set is_suspended = true where id = :'buyer';          -- expect ERROR (guard)
update profiles set display_name = 'Test Buyer' where id = :'buyer';   -- ok
select 'export has keys', (select count(*) from jsonb_object_keys(public.export_my_data()));
select 'buyer cannot run alerts (expect ERROR)';
select public.process_saved_search_alerts('daily');
reset role;
-- dealer drops the price (as service role / owner)
update advertisements set price_gbp = price_gbp - 250 where id = :'ad';
select 'price drop notifications (expect 1)', count(*) from notifications where kind = 'price_drop' and user_id = :'buyer';
-- a new Ford gets published after the search was saved
update saved_searches set created_at = now() - interval '1 hour' where user_id = :'buyer';
update advertisements set published_at = now() where id = (select a.id from listing_search a where a.make_slug = 'ford' limit 1);
select 'alerts sent (expect 1)', public.process_saved_search_alerts('daily');
select 'saved search notification', title from notifications where kind = 'saved_search' and user_id = :'buyer';
select 'second run sends nothing (expect 0)', public.process_saved_search_alerts('daily');
