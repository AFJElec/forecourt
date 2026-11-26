-- =====================================================================
-- 0003 VEHICLES, ADVERTISEMENTS, MEDIA, PRICE HISTORY
-- A "vehicle" is the physical car (VRM, spec). An "advertisement" is
-- one listing of it (price, status, seller). A vehicle can be relisted.
-- =====================================================================

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vrm text,                                     -- normalised registration mark
  vin text,
  manufacturer_id uuid not null references public.manufacturers (id),
  model_id uuid not null references public.models (id),
  derivative_id uuid references public.derivatives (id),
  derivative_text text not null default '',     -- free text when no derivative match
  category public.vehicle_category not null default 'car',
  first_registered date,
  year smallint not null check (year between 1900 and 2100),
  plate_identifier text,                        -- e.g. '71'
  fuel_type public.fuel_type not null,
  transmission public.transmission not null,
  body_type public.body_type not null,
  engine_cc integer check (engine_cc >= 0),
  power_bhp integer check (power_bhp >= 0),
  colour text not null,
  doors smallint check (doors between 0 and 7),
  seats smallint check (seats between 1 and 20),
  insurance_group smallint check (insurance_group between 1 and 50),
  ulez_compliant boolean,                       -- null = unverified
  ulez_verified_at timestamptz,
  write_off_category public.write_off_category not null default 'none',
  owners smallint,
  created_by uuid references auth.users (id) on delete set null,
  dealership_id uuid references public.dealerships (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger vehicles_updated before update on public.vehicles for each row execute function public.set_updated_at();
create index vehicles_vrm_idx on public.vehicles (vrm);
create index vehicles_make_model_idx on public.vehicles (manufacturer_id, model_id);

-- Technical specs + running costs (1:1). Populated from an authorised provider when configured.
create table public.vehicle_specifications (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  co2_g_km integer,
  mpg_combined numeric(5, 1),
  electric_range_miles integer,
  battery_kwh numeric(5, 1),
  annual_tax_gbp integer,
  acceleration_0_62 numeric(4, 1),
  top_speed_mph integer,
  length_mm integer, width_mm integer, height_mm integer,
  boot_litres integer,
  kerb_weight_kg integer,
  euro_status text,
  source text not null default 'seller',        -- seller | dvla | provider:<name>
  raw jsonb
);

create table public.vehicle_equipment (
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  equipment_id integer not null references public.equipment_items (id) on delete cascade,
  primary key (vehicle_id, equipment_id)
);
create index vehicle_equipment_equipment_idx on public.vehicle_equipment (equipment_id);

-- MOT / history snapshots from DVSA / history provider.
create table public.vehicle_history_checks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  provider text not null,                       -- dvsa_mot | history:<name>
  result jsonb not null,
  mot_expiry date,
  checked_at timestamptz not null default now()
);
create index vehicle_history_vehicle_idx on public.vehicle_history_checks (vehicle_id, checked_at desc);

-- ---------- Advertisement packages (configurable in admin) -----------
create table public.ad_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                    -- basic | standard | premium | featured_upgrade
  audience public.seller_type not null,
  name text not null,
  price_pence integer not null default 0 check (price_pence >= 0),
  duration_days integer not null check (duration_days > 0),
  max_photos integer not null default 20,
  allows_video boolean not null default false,
  is_featured boolean not null default false,
  search_boost smallint not null default 0,
  is_active boolean not null default true,
  stripe_price_id text,
  sort_order integer not null default 100
);

create table public.advertisements (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  seller_type public.seller_type not null,
  seller_user_id uuid references auth.users (id) on delete set null,   -- private sellers
  dealership_id uuid references public.dealerships (id) on delete cascade,
  dealership_location_id uuid references public.dealership_locations (id) on delete set null,
  status public.listing_status not null default 'draft',
  package_id uuid references public.ad_packages (id),
  is_featured boolean not null default false,
  featured_until timestamptz,
  is_demo boolean not null default false,
  title text not null,
  description text not null default '',
  description_ai_assisted boolean not null default false,
  price_gbp integer not null check (price_gbp between 1 and 10000000),
  price_negotiable boolean not null default false,
  mileage integer not null check (mileage between 0 and 2000000),
  service_history public.service_history not null default 'partial',
  condition public.vehicle_condition not null default 'good',
  -- location: dealers inherit site; private sellers give postcode (only outward code shown)
  postcode text not null,
  town text,
  county text,
  lat double precision not null,
  lng double precision not null,
  contact_phone text,
  show_phone boolean not null default true,
  video_url text,
  -- illustrative finance figures (no regulated activity — see FCA notes in docs)
  finance_example jsonb,
  -- denormalised counters (updated by analytics jobs)
  views_count integer not null default 0,
  saves_count integer not null default 0,
  enquiries_count integer not null default 0,
  search_document tsvector,
  moderation_notes text,
  moderated_by uuid references auth.users (id),
  moderated_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_seller_consistency check (
    (seller_type = 'trade' and dealership_id is not null) or
    (seller_type = 'private' and seller_user_id is not null and dealership_id is null)
  )
);
create trigger advertisements_updated before update on public.advertisements for each row execute function public.set_updated_at();

-- Search/filter indexes. Partial on active ads — that's what the public search scans.
create index ads_active_price_idx on public.advertisements (price_gbp) where status = 'active';
create index ads_active_mileage_idx on public.advertisements (mileage) where status = 'active';
create index ads_active_published_idx on public.advertisements (published_at desc) where status = 'active';
create index ads_active_geo_idx on public.advertisements (lat, lng) where status = 'active';
create index ads_vehicle_idx on public.advertisements (vehicle_id);
create index ads_dealer_status_idx on public.advertisements (dealership_id, status);
create index ads_seller_status_idx on public.advertisements (seller_user_id, status);
create index ads_search_doc_idx on public.advertisements using gin (search_document);
create index ads_featured_idx on public.advertisements (is_featured, published_at desc) where status = 'active';
create index ads_expires_idx on public.advertisements (expires_at) where status = 'active';
create index vehicles_filter_idx on public.vehicles (fuel_type, body_type, transmission, year);

create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements (id) on delete cascade,
  kind public.media_kind not null default 'photo',
  storage_path text not null,                   -- bucket path in Supabase Storage
  width integer, height integer,
  alt text not null default '',
  position smallint not null default 0,
  is_primary boolean not null default false,
  moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index vehicle_media_ad_idx on public.vehicle_media (advertisement_id, position);
create unique index vehicle_media_one_primary on public.vehicle_media (advertisement_id) where is_primary;

create table public.price_history (
  id bigserial primary key,
  advertisement_id uuid not null references public.advertisements (id) on delete cascade,
  old_price_gbp integer,
  new_price_gbp integer not null,
  changed_by uuid references auth.users (id),
  changed_at timestamptz not null default now()
);
create index price_history_ad_idx on public.price_history (advertisement_id, changed_at desc);

-- Record price changes (feeds price-drop alerts and dealer price-adjustment history).
create or replace function public.track_price_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.price_history (advertisement_id, old_price_gbp, new_price_gbp, changed_by)
    values (new.id, null, new.price_gbp, auth.uid());
  elsif new.price_gbp is distinct from old.price_gbp then
    insert into public.price_history (advertisement_id, old_price_gbp, new_price_gbp, changed_by)
    values (new.id, old.price_gbp, new.price_gbp, auth.uid());
  end if;
  return new;
end $$;
create trigger advertisements_price_history after insert or update of price_gbp on public.advertisements
  for each row execute function public.track_price_change();
