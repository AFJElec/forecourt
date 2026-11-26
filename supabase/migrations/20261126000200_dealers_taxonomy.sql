-- =====================================================================
-- 0002 DEALERSHIPS + VEHICLE TAXONOMY
-- =====================================================================

create table public.dealerships (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  legal_name text,
  companies_house_number text,
  fca_frn text,                        -- dealer's own FCA reference, if they broker credit
  description text not null default '',
  logo_url text,
  banner_url text,
  brand_color text,
  website text,
  email citext,
  phone text,
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users (id),
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  rating_avg numeric(3, 2),
  rating_count integer not null default 0,
  stripe_customer_id text unique,
  status text not null default 'active' check (status in ('pending', 'active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger dealerships_updated before update on public.dealerships for each row execute function public.set_updated_at();

-- Multiple sites per dealer group.
create table public.dealership_locations (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  name text not null,
  address_line1 text not null,
  address_line2 text,
  town text not null,
  county text,
  postcode text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  opening_hours jsonb not null default '[]'::jsonb,   -- [{day:'Mon', open:'09:00', close:'18:00'}]
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index dealership_locations_dealer_idx on public.dealership_locations (dealership_id);
create unique index dealership_locations_one_primary on public.dealership_locations (dealership_id) where is_primary;

create table public.dealership_staff (
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.dealer_staff_role not null default 'sales',
  location_ids uuid[] not null default '{}',   -- empty = all locations
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (dealership_id, user_id)
);
create index dealership_staff_user_idx on public.dealership_staff (user_id);

create or replace function public.is_dealer_member(d uuid, min_role public.dealer_staff_role default 'viewer')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.dealership_staff s
    where s.dealership_id = d and s.user_id = auth.uid()
      and array_position(array['viewer','sales','manager','owner']::public.dealer_staff_role[], s.role)
          >= array_position(array['viewer','sales','manager','owner']::public.dealer_staff_role[], min_role)
  )
$$;

-- ---------- Taxonomy -------------------------------------------------
create table public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null unique,
  country text,
  logo_url text,
  is_popular boolean not null default false,
  sort_order integer not null default 100,
  seo_intro text,
  created_at timestamptz not null default now()
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete restrict,
  slug citext not null,
  name text not null,
  category public.vehicle_category not null default 'car',
  first_year smallint,
  last_year smallint,
  seo_intro text,
  unique (manufacturer_id, slug)
);
create index models_manufacturer_idx on public.models (manufacturer_id);

create table public.derivatives (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models (id) on delete restrict,
  name text not null,                      -- e.g. "1.5 TSI EVO Life 5dr"
  trim text,
  fuel_type public.fuel_type,
  transmission public.transmission,
  body_type public.body_type,
  engine_cc integer,
  power_bhp integer,
  doors smallint,
  seats smallint,
  insurance_group smallint check (insurance_group between 1 and 50),
  provider_ref text,                       -- external spec-provider id
  unique (model_id, name)
);
create index derivatives_model_idx on public.derivatives (model_id);

create table public.equipment_items (
  id serial primary key,
  slug citext not null unique,
  name text not null,
  category text not null default 'general'  -- comfort, safety, tech, exterior, performance
);
