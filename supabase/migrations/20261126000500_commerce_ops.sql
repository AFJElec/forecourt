-- =====================================================================
-- 0005 COMMERCE (Stripe), NOTIFICATIONS, ANALYTICS, VALUATIONS,
--      REPORTS, AUDIT LOGS, CONTENT
-- =====================================================================

-- ---------- Subscriptions -------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                  -- starter | growth | enterprise
  name text not null,
  monthly_price_pence integer not null check (monthly_price_pence >= 0),
  stock_limit integer,                        -- null = unlimited
  featured_slots integer not null default 0,
  staff_seat_limit integer,
  location_limit integer,
  enhanced_profile boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  stripe_price_id text,
  is_active boolean not null default true,
  sort_order integer not null default 100
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status public.subscription_status not null default 'incomplete',
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();
create unique index subscriptions_one_live on public.subscriptions (dealership_id) where status in ('trialing', 'active', 'past_due');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  dealership_id uuid references public.dealerships (id) on delete set null,
  advertisement_id uuid references public.advertisements (id) on delete set null,
  purpose text not null,                      -- ad_package | featured_upgrade | renewal | subscription | history_check
  amount_pence integer not null check (amount_pence >= 0),
  currency char(3) not null default 'GBP',
  status public.payment_status not null default 'pending',
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  refunded_pence integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();
create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_dealer_idx on public.payments (dealership_id, created_at desc);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  dealership_id uuid references public.dealerships (id) on delete set null,
  payment_id uuid references public.payments (id) on delete set null,
  stripe_invoice_id text unique,
  subtotal_pence integer not null,
  vat_pence integer not null default 0,
  total_pence integer not null,
  pdf_url text,
  issued_at timestamptz not null default now()
);

-- Idempotency for Stripe webhooks.
create table public.stripe_events (
  id text primary key,                        -- Stripe event id
  type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

-- ---------- Notifications ------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null default '',
  link text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  emailed_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------- Analytics ---------------------------------------------
create table public.advertisement_analytics_daily (
  advertisement_id uuid not null references public.advertisements (id) on delete cascade,
  day date not null,
  search_impressions integer not null default 0,
  detail_views integer not null default 0,
  saves integer not null default 0,
  phone_reveals integer not null default 0,
  enquiries integer not null default 0,
  shares integer not null default 0,
  primary key (advertisement_id, day)
);

-- ---------- Valuations -------------------------------------------
create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  vrm text not null,
  mileage integer not null,
  condition public.vehicle_condition not null,
  service_history public.service_history not null,
  equipment jsonb not null default '[]'::jsonb,
  provider text not null,                      -- 'demo' or provider name
  is_demonstration boolean not null default true,
  private_value_gbp integer,
  retail_value_gbp integer,
  trade_value_gbp integer,
  suggested_price_gbp integer,
  comparables jsonb,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index valuations_user_idx on public.valuations (user_id, created_at desc);

-- ---------- Reports / moderation ---------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  advertisement_id uuid references public.advertisements (id) on delete cascade,
  reported_user_id uuid references auth.users (id) on delete cascade,
  message_id uuid references public.messages (id) on delete cascade,
  reason text not null check (reason in ('scam', 'incorrect_details', 'stolen', 'duplicate', 'offensive', 'sold', 'spam', 'other')),
  details text,
  status public.report_status not null default 'open',
  handled_by uuid references auth.users (id),
  handled_at timestamptz,
  resolution text,
  created_at timestamptz not null default now(),
  check (advertisement_id is not null or reported_user_id is not null or message_id is not null)
);
create index reports_status_idx on public.reports (status, created_at);

-- ---------- Audit log (append-only) -------------------------------
create table public.audit_logs (
  id bigserial primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  action text not null,                        -- e.g. 'ad.approve', 'user.suspend'
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create or replace function public.audit_logs_immutable() returns trigger
language plpgsql as $$ begin raise exception 'audit_logs is append-only'; end $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ---------- Content -----------------------------------------------
create table public.email_templates (
  key text primary key,                        -- 'enquiry.received', 'ad.expiring', ...
  subject text not null,
  html text not null,
  text_body text not null,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create table public.content_pages (
  slug citext primary key,
  title text not null,
  body_md text not null,
  meta_description text,
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

-- UK postcode outward-code centroids (loaded from ONS / postcodes.io data).
create table public.postcode_districts (
  outward_code text primary key,
  town text,
  county text,
  lat double precision not null,
  lng double precision not null
);
