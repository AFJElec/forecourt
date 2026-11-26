-- =====================================================================
-- 0009 PHASE 2: buyer accounts
--   * profile guard (users can't unsuspend themselves or edit risk fields)
--   * price-drop notifications for saved vehicles
--   * saved-search alerts (new matching listings)
--   * disjunctive facet counts for search
--   * merge of device-local lists into an account on sign-in
--   * GDPR data export
-- =====================================================================

-- ---------- Profile guard ------------------------------------------
create or replace function public.guard_profile() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if public.is_service_role() or public.has_permission('users.manage') then return new; end if;
  if new.is_suspended is distinct from old.is_suspended
     or new.suspended_reason is distinct from old.suspended_reason
     or new.risk_score is distinct from old.risk_score then
    raise exception 'Protected profile fields cannot be changed';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile();

-- Replace the self-update policy: suspended users cannot edit their profile at all.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update
  using (id = auth.uid() and not is_suspended) with check (id = auth.uid());

-- ---------- Price-drop notifications --------------------------------
create or replace function public.notify_price_drop() returns trigger
language plpgsql security definer set search_path = public as $$
declare ad record;
begin
  if new.old_price_gbp is null or new.new_price_gbp >= new.old_price_gbp then return new; end if;
  select a.slug, a.title, a.status into ad from public.advertisements a where a.id = new.advertisement_id;
  if ad.status is distinct from 'active' then return new; end if;
  insert into public.notifications (user_id, kind, title, body, link, data)
  select s.user_id, 'price_drop',
         'Price drop on a saved vehicle',
         format('%s is now £%s (was £%s).', ad.title, to_char(new.new_price_gbp, 'FM999,999,999'), to_char(new.old_price_gbp, 'FM999,999,999')),
         '/vehicle/' || ad.slug,
         jsonb_build_object('advertisement_id', new.advertisement_id, 'old', new.old_price_gbp, 'new', new.new_price_gbp)
  from public.saved_vehicles s
  join public.profiles p on p.id = s.user_id
  where s.advertisement_id = new.advertisement_id
    and s.notify_price_drop
    and coalesce((p.notification_prefs ->> 'price_drops')::boolean, true);
  return new;
end $$;
create trigger price_history_notify after insert on public.price_history
  for each row execute function public.notify_price_drop();

-- ---------- Saved-search alerts -------------------------------------
-- Run on a schedule (pg_cron below) per frequency. Creates one notification
-- per saved search that has new matching listings since it last alerted.
create or replace function public.process_saved_search_alerts(p_frequency text)
returns integer language plpgsql security definer set search_path = public as $$
declare s record; n integer; sent integer := 0; since timestamptz;
begin
  for s in
    select ss.* from public.saved_searches ss
    join public.profiles p on p.id = ss.user_id
    where ss.alert_frequency = p_frequency
      and not p.is_suspended
      and coalesce((p.notification_prefs ->> 'saved_searches')::boolean, true)
  loop
    since := coalesce(s.last_alerted_at, s.created_at);
    select count(*) into n from public.listing_search l
    where l.published_at > since and public.listing_matches(l, s.query);
    if n > 0 then
      insert into public.notifications (user_id, kind, title, body, link, data)
      values (s.user_id, 'saved_search',
              format('%s new match%s for "%s"', n, case when n = 1 then '' else 'es' end, s.name),
              'New vehicles matching your saved search have been listed.',
              '/used-cars' || case when s.query_string <> '' then '?' || s.query_string else '' end,
              jsonb_build_object('saved_search_id', s.id, 'count', n));
      sent := sent + 1;
    end if;
    update public.saved_searches set last_alerted_at = now() where id = s.id;
  end loop;
  return sent;
end $$;
revoke execute on function public.process_saved_search_alerts(text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('saved-search-instant', '*/15 * * * *', $c$select public.process_saved_search_alerts('instant')$c$);
    perform cron.schedule('saved-search-daily', '0 7 * * *', $c$select public.process_saved_search_alerts('daily')$c$);
    perform cron.schedule('saved-search-weekly', '0 7 * * 1', $c$select public.process_saved_search_alerts('weekly')$c$);
  end if;
end $$;

-- ---------- Search facets (disjunctive) ----------------------------
create or replace function public.listing_facets(f jsonb)
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'make', coalesce((select jsonb_object_agg(k, n) from (
        select make_slug::text k, count(*) n from public.listing_search l
        where public.listing_matches(l, f - 'make' - 'model' - 'derivative') group by 1) x), '{}'::jsonb),
    'body', coalesce((select jsonb_object_agg(k, n) from (
        select body_type::text k, count(*) n from public.listing_search l
        where public.listing_matches(l, f - 'body') group by 1) x), '{}'::jsonb),
    'fuel', coalesce((select jsonb_object_agg(k, n) from (
        select fuel_type::text k, count(*) n from public.listing_search l
        where public.listing_matches(l, f - 'fuel') group by 1) x), '{}'::jsonb),
    'transmission', coalesce((select jsonb_object_agg(k, n) from (
        select transmission::text k, count(*) n from public.listing_search l
        where public.listing_matches(l, f - 'transmission') group by 1) x), '{}'::jsonb),
    'seller', coalesce((select jsonb_object_agg(k, n) from (
        select seller_type::text k, count(*) n from public.listing_search l
        where public.listing_matches(l, f - 'seller') group by 1) x), '{}'::jsonb)
  )
$$;
grant execute on function public.listing_facets(jsonb) to anon, authenticated;

-- ---------- Merge device lists into the account on sign-in ----------
-- Inputs are advertisement ids (uuid strings); unknown/inactive ids are ignored.
create or replace function public.merge_device_lists(p_saved uuid[], p_recent uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.saved_vehicles (user_id, advertisement_id, price_at_save)
  select auth.uid(), a.id, a.price_gbp from public.advertisements a
  where a.id = any(coalesce(p_saved, '{}')) and a.status = 'active'
  on conflict do nothing;
  insert into public.recently_viewed (user_id, advertisement_id, viewed_at)
  select auth.uid(), a.id, now() - (ord || ' seconds')::interval
  from unnest(coalesce(p_recent, '{}')) with ordinality as r(id, ord)
  join public.advertisements a on a.id = r.id and a.status = 'active'
  on conflict (user_id, advertisement_id) do update set viewed_at = greatest(recently_viewed.viewed_at, excluded.viewed_at);
  -- keep recently viewed bounded
  delete from public.recently_viewed rv where rv.user_id = auth.uid() and rv.advertisement_id not in (
    select advertisement_id from public.recently_viewed where user_id = auth.uid() order by viewed_at desc limit 30);
end $$;
grant execute on function public.merge_device_lists(uuid[], uuid[]) to authenticated;

-- ---------- GDPR: export everything we hold about the caller ---------
create or replace function public.export_my_data()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'risk_score' from public.profiles p where p.id = auth.uid()),
    'roles', (select coalesce(jsonb_agg(role), '[]') from public.user_roles where user_id = auth.uid()),
    'saved_vehicles', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.saved_vehicles s where s.user_id = auth.uid()),
    'saved_searches', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.saved_searches s where s.user_id = auth.uid()),
    'recently_viewed', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from public.recently_viewed r where r.user_id = auth.uid()),
    'enquiries', (select coalesce(jsonb_agg(to_jsonb(e) - 'ip_hash'), '[]') from public.enquiries e where e.buyer_id = auth.uid()),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(n)), '[]') from public.notifications n where n.user_id = auth.uid()),
    'valuations', (select coalesce(jsonb_agg(to_jsonb(v)), '[]') from public.valuations v where v.user_id = auth.uid())
  )
$$;
grant execute on function public.export_my_data() to authenticated;

create index if not exists saved_vehicles_user_idx on public.saved_vehicles (user_id, created_at desc);

-- ---------- Sign-up: record marketing consent from sign-up metadata ----
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, marketing_opt_in)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
          coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false));
  insert into public.user_roles (user_id, role) values (new.id, 'buyer');
  return new;
end $$;
