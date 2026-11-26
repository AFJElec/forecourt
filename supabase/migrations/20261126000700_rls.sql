-- =====================================================================
-- 0007 ROW-LEVEL SECURITY
-- Principle: deny by default; every table has RLS on. The service role
-- (server-side webhooks/jobs) bypasses RLS; status/feature guards are
-- enforced by triggers so they also hold for direct API access.
-- =====================================================================

create or replace function public.is_service_role() returns boolean
language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
      or current_user in ('postgres', 'service_role', 'supabase_admin')
$$;

create or replace function public.can_manage_ad(ad_seller uuid, ad_dealer uuid, min_role public.dealer_staff_role default 'sales')
returns boolean language sql stable security definer set search_path = public as $$
  select (ad_seller is not null and ad_seller = auth.uid())
      or (ad_dealer is not null and public.is_dealer_member(ad_dealer, min_role))
      or public.has_permission('ads.manage')
$$;

create or replace function public.can_view_vehicle(v uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.advertisements a
    where a.vehicle_id = v and (a.status = 'active' or public.can_manage_ad(a.seller_user_id, a.dealership_id, 'viewer'))
  ) or exists (select 1 from public.vehicles x where x.id = v and x.created_by = auth.uid())
$$;

-- Guard: sellers cannot self-approve, self-feature or mark demo.
-- NOTE: deliberately SECURITY INVOKER so current_user reflects the real caller.
create or replace function public.guard_advertisement() returns trigger
language plpgsql security invoker set search_path = public as $$
declare privileged boolean := public.is_service_role() or public.has_permission('ads.approve');
begin
  if privileged then return new; end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending_review') then
      raise exception 'New advertisements must be draft or pending_review';
    end if;
    if new.is_featured or new.is_demo then
      raise exception 'Featured/demo flags are set by the platform';
    end if;
    return new;
  end if;

  if new.is_featured is distinct from old.is_featured or new.is_demo is distinct from old.is_demo
     or new.featured_until is distinct from old.featured_until
     or new.views_count is distinct from old.views_count or new.saves_count is distinct from old.saves_count then
    raise exception 'Protected advertisement fields cannot be changed by the seller';
  end if;

  -- allowed seller transitions
  if new.status is distinct from old.status and not (
       (old.status = 'draft' and new.status = 'pending_review')
    or (old.status = 'active' and new.status in ('paused', 'sold', 'removed'))
    or (old.status = 'paused' and new.status in ('active', 'sold', 'removed'))
    or (old.status in ('expired', 'rejected') and new.status in ('pending_review', 'removed'))
    or (old.status = 'pending_review' and new.status in ('draft', 'removed'))
  ) then
    raise exception 'Status change % -> % not permitted', old.status, new.status;
  end if;
  return new;
end $$;
create trigger advertisements_guard before insert or update on public.advertisements
  for each row execute function public.guard_advertisement();

-- ---------- Enable RLS everywhere -----------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','role_permissions','platform_settings','dealerships','dealership_locations','dealership_staff',
    'manufacturers','models','derivatives','equipment_items','vehicles','vehicle_specifications','vehicle_equipment',
    'vehicle_history_checks','ad_packages','advertisements','vehicle_media','price_history','saved_vehicles','saved_searches',
    'recently_viewed','conversations','messages','user_blocks','enquiries','reviews','subscription_plans','subscriptions',
    'payments','invoices','stripe_events','notifications','push_subscriptions','advertisement_analytics_daily','valuations',
    'reports','audit_logs','email_templates','content_pages','postcode_districts']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------- Public reference data -----------------------------------
create policy "read taxonomy" on public.manufacturers for select using (true);
create policy "read models" on public.models for select using (true);
create policy "read derivatives" on public.derivatives for select using (true);
create policy "read equipment" on public.equipment_items for select using (true);
create policy "read packages" on public.ad_packages for select using (is_active or public.is_staff());
create policy "read plans" on public.subscription_plans for select using (is_active or public.is_staff());
create policy "read postcodes" on public.postcode_districts for select using (true);
create policy "read public settings" on public.platform_settings for select using (is_public or public.is_staff());
create policy "read published pages" on public.content_pages for select using (is_published or public.is_staff());

create policy "admin taxonomy" on public.manufacturers for all using (public.has_permission('taxonomy.manage')) with check (public.has_permission('taxonomy.manage'));
create policy "admin models" on public.models for all using (public.has_permission('taxonomy.manage')) with check (public.has_permission('taxonomy.manage'));
create policy "admin derivatives" on public.derivatives for all using (public.has_permission('taxonomy.manage')) with check (public.has_permission('taxonomy.manage'));
create policy "admin equipment" on public.equipment_items for all using (public.has_permission('taxonomy.manage')) with check (public.has_permission('taxonomy.manage'));
create policy "admin packages" on public.ad_packages for all using (public.has_permission('billing.manage')) with check (public.has_permission('billing.manage'));
create policy "admin plans" on public.subscription_plans for all using (public.has_permission('billing.manage')) with check (public.has_permission('billing.manage'));
create policy "admin settings" on public.platform_settings for all using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
create policy "admin pages" on public.content_pages for all using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));
create policy "admin email" on public.email_templates for all using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));
create policy "admin postcodes" on public.postcode_districts for all using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- ---------- Profiles & roles ----------------------------------------
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and is_suspended = false);
create policy "staff profile update" on public.profiles for update using (public.has_permission('users.manage'));
create policy "own roles read" on public.user_roles for select using (user_id = auth.uid() or public.is_staff());
create policy "admin roles" on public.user_roles for all using (public.has_permission('users.roles')) with check (public.has_permission('users.roles'));
create policy "staff read perms" on public.role_permissions for select using (public.is_staff());
create policy "super admin perms" on public.role_permissions for all using (public.has_role('super_admin')) with check (public.has_role('super_admin'));

-- ---------- Dealerships ---------------------------------------------
create policy "public dealers" on public.dealerships for select using (status = 'active' or public.is_dealer_member(id) or public.is_staff());
create policy "dealer manager update" on public.dealerships for update using (public.is_dealer_member(id, 'manager')) with check (public.is_dealer_member(id, 'manager'));
create policy "admin dealers" on public.dealerships for all using (public.has_permission('dealers.manage')) with check (public.has_permission('dealers.manage'));
create policy "public locations" on public.dealership_locations for select using (true);
create policy "dealer locations" on public.dealership_locations for all using (public.is_dealer_member(dealership_id, 'manager')) with check (public.is_dealer_member(dealership_id, 'manager'));
create policy "members read staff" on public.dealership_staff for select using (user_id = auth.uid() or public.is_dealer_member(dealership_id) or public.is_staff());
create policy "owner manages staff" on public.dealership_staff for all using (public.is_dealer_member(dealership_id, 'owner') or public.has_permission('dealers.manage'))
  with check (public.is_dealer_member(dealership_id, 'owner') or public.has_permission('dealers.manage'));

-- ---------- Vehicles & ads ------------------------------------------
create policy "view vehicles" on public.vehicles for select using (public.can_view_vehicle(id));
create policy "create vehicles" on public.vehicles for insert to authenticated
  with check (created_by = auth.uid() and (dealership_id is null or public.is_dealer_member(dealership_id, 'sales')));
create policy "update own vehicles" on public.vehicles for update
  using (created_by = auth.uid() or (dealership_id is not null and public.is_dealer_member(dealership_id, 'sales')) or public.has_permission('ads.manage'));

create policy "view specs" on public.vehicle_specifications for select using (public.can_view_vehicle(vehicle_id));
create policy "manage specs" on public.vehicle_specifications for all
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.created_by = auth.uid() or (v.dealership_id is not null and public.is_dealer_member(v.dealership_id, 'sales')))))
  with check (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.created_by = auth.uid() or (v.dealership_id is not null and public.is_dealer_member(v.dealership_id, 'sales')))));
create policy "view equipment" on public.vehicle_equipment for select using (public.can_view_vehicle(vehicle_id));
create policy "manage equipment" on public.vehicle_equipment for all
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.created_by = auth.uid() or (v.dealership_id is not null and public.is_dealer_member(v.dealership_id, 'sales')))))
  with check (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.created_by = auth.uid() or (v.dealership_id is not null and public.is_dealer_member(v.dealership_id, 'sales')))));
create policy "view history" on public.vehicle_history_checks for select using (public.can_view_vehicle(vehicle_id));

create policy "public active ads" on public.advertisements for select
  using (status = 'active' or public.can_manage_ad(seller_user_id, dealership_id, 'viewer') or public.is_staff());
create policy "create own ads" on public.advertisements for insert to authenticated
  with check ((seller_type = 'private' and seller_user_id = auth.uid())
           or (seller_type = 'trade' and public.is_dealer_member(dealership_id, 'sales')));
create policy "update own ads" on public.advertisements for update
  using (public.can_manage_ad(seller_user_id, dealership_id)) with check (public.can_manage_ad(seller_user_id, dealership_id));
create policy "moderate ads" on public.advertisements for update using (public.has_permission('ads.approve'));
create policy "delete drafts" on public.advertisements for delete using (status = 'draft' and public.can_manage_ad(seller_user_id, dealership_id));

create policy "public media" on public.vehicle_media for select using (exists (
  select 1 from public.advertisements a where a.id = advertisement_id
  and ((a.status = 'active' and moderation_status = 'approved') or public.can_manage_ad(a.seller_user_id, a.dealership_id, 'viewer'))));
create policy "manage media" on public.vehicle_media for all
  using (exists (select 1 from public.advertisements a where a.id = advertisement_id and public.can_manage_ad(a.seller_user_id, a.dealership_id)))
  with check (exists (select 1 from public.advertisements a where a.id = advertisement_id and public.can_manage_ad(a.seller_user_id, a.dealership_id)));

create policy "public price history" on public.price_history for select using (exists (
  select 1 from public.advertisements a where a.id = advertisement_id
  and (a.status = 'active' or public.can_manage_ad(a.seller_user_id, a.dealership_id, 'viewer'))));

-- ---------- Buyer-owned rows ----------------------------------------
create policy "own saved" on public.saved_vehicles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own searches" on public.saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own recent" on public.recently_viewed for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications read" on public.notifications for select using (user_id = auth.uid());
create policy "own notifications mark" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own push" on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own blocks" on public.user_blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "own valuations" on public.valuations for select using (user_id = auth.uid());
create policy "create valuations" on public.valuations for insert with check (user_id is null or user_id = auth.uid());

-- ---------- Messaging -----------------------------------------------
create or replace function public.is_conversation_participant(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations x where x.id = c and (
    x.buyer_id = auth.uid() or x.seller_user_id = auth.uid()
    or (x.dealership_id is not null and public.is_dealer_member(x.dealership_id, 'sales'))))
$$;

create policy "participants read conversations" on public.conversations for select
  using (public.is_conversation_participant(id) or public.has_permission('support.messages'));
create policy "buyer starts conversation" on public.conversations for insert to authenticated with check (buyer_id = auth.uid());
create policy "participants update read markers" on public.conversations for update using (public.is_conversation_participant(id));

create policy "participants read messages" on public.messages for select
  using ((public.is_conversation_participant(conversation_id) and not is_hidden) or public.has_permission('support.messages'));
create policy "participants send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
  and not exists (   -- blocked by the other side?
    select 1 from public.conversations c join public.user_blocks b
      on b.blocked_id = auth.uid() and b.blocker_id in (c.buyer_id, c.seller_user_id)
    where c.id = conversation_id));

-- ---------- Enquiries -----------------------------------------------
-- Guest enquiries allowed; the API route rate-limits and validates first.
create policy "anyone can enquire" on public.enquiries for insert with check (
  (buyer_id is null or buyer_id = auth.uid())
  and exists (select 1 from public.advertisements a where a.id = advertisement_id and a.status = 'active'));
create policy "parties read enquiries" on public.enquiries for select using (
  buyer_id = auth.uid() or seller_user_id = auth.uid()
  or (dealership_id is not null and public.is_dealer_member(dealership_id, 'sales')) or public.is_staff());
create policy "seller updates enquiries" on public.enquiries for update using (
  seller_user_id = auth.uid() or (dealership_id is not null and public.is_dealer_member(dealership_id, 'sales')));

-- ---------- Reviews -------------------------------------------------
create policy "public reviews" on public.reviews for select using (status = 'published' or author_id = auth.uid() or public.is_dealer_member(dealership_id) or public.is_staff());
create policy "write review" on public.reviews for insert to authenticated with check (author_id = auth.uid() and status = 'pending');
create policy "moderate reviews" on public.reviews for update using (public.has_permission('reviews.moderate'));

-- ---------- Billing (writes via service role only) ------------------
create policy "dealer subscriptions" on public.subscriptions for select using (public.is_dealer_member(dealership_id, 'manager') or public.has_permission('billing.view'));
create policy "own payments" on public.payments for select using (user_id = auth.uid() or (dealership_id is not null and public.is_dealer_member(dealership_id, 'manager')) or public.has_permission('billing.view'));
create policy "own invoices" on public.invoices for select using (user_id = auth.uid() or (dealership_id is not null and public.is_dealer_member(dealership_id, 'manager')) or public.has_permission('billing.view'));
-- stripe_events: no policies => only service role.

-- ---------- Analytics ----------------------------------------------
create policy "seller analytics" on public.advertisement_analytics_daily for select using (exists (
  select 1 from public.advertisements a where a.id = advertisement_id and public.can_manage_ad(a.seller_user_id, a.dealership_id, 'viewer'))
  or public.has_permission('analytics.view'));

-- ---------- Reports & audit ----------------------------------------
create policy "file report" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy "own reports" on public.reports for select using (reporter_id = auth.uid() or public.has_permission('reports.manage'));
create policy "handle reports" on public.reports for update using (public.has_permission('reports.manage'));
create policy "read audit" on public.audit_logs for select using (public.has_permission('audit.view'));

-- Staff actions go through this so actor + role are always captured.
create or replace function public.log_admin_action(p_action text, p_entity_type text, p_entity_id text, p_before jsonb default null, p_after jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() and not public.is_service_role() then
    raise exception 'not permitted';
  end if;
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before, after)
  values (auth.uid(),
          (select string_agg(role::text, ',') from public.user_roles where user_id = auth.uid()),
          p_action, p_entity_type, p_entity_id, p_before, p_after);
end $$;

-- ---------- Default permissions ------------------------------------
insert into public.role_permissions (role, permission) values
  ('super_admin', '*'),
  ('admin', 'users.manage'), ('admin', 'users.roles'), ('admin', 'dealers.manage'), ('admin', 'ads.manage'), ('admin', 'ads.approve'),
  ('admin', 'reports.manage'), ('admin', 'reviews.moderate'), ('admin', 'billing.view'), ('admin', 'billing.manage'),
  ('admin', 'taxonomy.manage'), ('admin', 'content.manage'), ('admin', 'settings.manage'), ('admin', 'analytics.view'), ('admin', 'audit.view'),
  ('admin', 'support.messages'),
  ('moderator', 'ads.approve'), ('moderator', 'reports.manage'), ('moderator', 'reviews.moderate'), ('moderator', 'ads.manage'),
  ('support', 'users.manage'), ('support', 'support.messages'), ('support', 'billing.view')
on conflict do nothing;
