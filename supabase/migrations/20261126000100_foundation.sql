-- =====================================================================
-- 0001 FOUNDATION: extensions, enums, profiles, roles, helpers
-- Target: Supabase Postgres 15+. auth.users is provided by Supabase Auth.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists citext;

-- ---------- Enums ----------------------------------------------------
create type public.app_role as enum ('buyer', 'private_seller', 'dealer_staff', 'support', 'moderator', 'admin', 'super_admin');
create type public.dealer_staff_role as enum ('owner', 'manager', 'sales', 'viewer');
create type public.fuel_type as enum ('petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric');
create type public.transmission as enum ('manual', 'automatic');
create type public.body_type as enum ('hatchback', 'saloon', 'estate', 'suv', 'coupe', 'convertible', 'mpv', 'pickup', 'van', 'motorcycle');
create type public.vehicle_category as enum ('car', 'van', 'motorcycle', 'motorhome', 'caravan');
create type public.seller_type as enum ('trade', 'private');
create type public.write_off_category as enum ('none', 'S', 'N');
create type public.service_history as enum ('full', 'partial', 'none');
create type public.vehicle_condition as enum ('excellent', 'good', 'fair', 'poor');
create type public.listing_status as enum ('draft', 'pending_review', 'active', 'paused', 'sold', 'expired', 'removed', 'rejected');
create type public.media_kind as enum ('photo', 'video');
create type public.enquiry_kind as enum ('contact', 'viewing', 'part_exchange', 'callback', 'finance');
create type public.enquiry_status as enum ('new', 'contacted', 'qualified', 'won', 'lost', 'spam');
create type public.report_status as enum ('open', 'investigating', 'actioned', 'dismissed');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'incomplete');
create type public.notification_kind as enum ('message', 'enquiry', 'price_drop', 'saved_search', 'ad_expiry', 'ad_approved', 'ad_rejected', 'review', 'system');

-- ---------- Generic helpers -----------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Great-circle distance in miles (no PostGIS dependency; swap for PostGIS later if needed).
create or replace function public.distance_miles(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable parallel safe as $$
  select 3958.7613 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- UK VRM normaliser: uppercase, strip spaces.
create or replace function public.normalise_vrm(v text) returns text
language sql immutable parallel safe as $$ select upper(regexp_replace(coalesce(v, ''), '\s', '', 'g')) $$;

-- ---------- Profiles & roles ----------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  first_name text,
  last_name text,
  phone text,
  postcode text,
  avatar_url text,
  marketing_opt_in boolean not null default false,
  notification_prefs jsonb not null default '{"email": true, "push": false, "price_drops": true, "saved_searches": true}'::jsonb,
  is_suspended boolean not null default false,
  suspended_reason text,
  risk_score smallint not null default 0 check (risk_score between 0 and 100),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Fine-grained admin permissions (RBAC). e.g. 'ads.approve', 'payments.refund'.
create table public.role_permissions (
  role public.app_role not null,
  permission text not null,
  primary key (role, permission)
);

create or replace function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid()
                 and role in ('support', 'moderator', 'admin', 'super_admin'))
$$;

create or replace function public.has_permission(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = auth.uid() and (rp.permission = p or rp.permission = '*')
  )
$$;

-- Create a profile + buyer role when a user signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'buyer');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Platform settings (configurable by admin) ---------------
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);
create trigger platform_settings_updated before update on public.platform_settings for each row execute function public.set_updated_at();
