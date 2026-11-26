-- =====================================================================
-- 0004 BUYER ENGAGEMENT: saved, searches, messaging, enquiries, reviews
-- =====================================================================

create table public.saved_vehicles (
  user_id uuid not null references auth.users (id) on delete cascade,
  advertisement_id uuid not null references public.advertisements (id) on delete cascade,
  price_at_save integer,
  notify_price_drop boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, advertisement_id)
);
create index saved_vehicles_ad_idx on public.saved_vehicles (advertisement_id);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  query jsonb not null,                       -- validated SearchFilters object
  query_string text not null,                 -- canonical URL query for sharing
  alert_frequency text not null default 'daily' check (alert_frequency in ('off', 'instant', 'daily', 'weekly')),
  last_alerted_at timestamptz,
  created_at timestamptz not null default now()
);
create index saved_searches_user_idx on public.saved_searches (user_id);
create index saved_searches_alert_idx on public.saved_searches (alert_frequency, last_alerted_at);

create table public.recently_viewed (
  user_id uuid not null references auth.users (id) on delete cascade,
  advertisement_id uuid not null references public.advertisements (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, advertisement_id)
);
create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

-- ---------- Messaging -----------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid references public.advertisements (id) on delete set null,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  seller_user_id uuid references auth.users (id) on delete cascade,
  dealership_id uuid references public.dealerships (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now(),
  constraint conversation_has_seller check (seller_user_id is not null or dealership_id is not null),
  unique (advertisement_id, buyer_id)
);
create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_idx on public.conversations (seller_user_id, last_message_at desc);
create index conversations_dealer_idx on public.conversations (dealership_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  attachments jsonb not null default '[]'::jsonb,
  spam_score real not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.bump_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
create trigger messages_bump after insert on public.messages for each row execute function public.bump_conversation();

create table public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ---------- Enquiries / leads --------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements (id) on delete cascade,
  dealership_id uuid references public.dealerships (id) on delete cascade,
  seller_user_id uuid references auth.users (id) on delete cascade,
  buyer_id uuid references auth.users (id) on delete set null,     -- null = guest enquiry
  kind public.enquiry_kind not null default 'contact',
  status public.enquiry_status not null default 'new',
  name text not null,
  email citext not null,
  phone text,
  message text not null default '',
  preferred_viewing_at timestamptz,
  part_exchange jsonb,                          -- {vrm, mileage, notes}
  assigned_to uuid references auth.users (id),
  source text not null default 'web',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger enquiries_updated before update on public.enquiries for each row execute function public.set_updated_at();
create index enquiries_dealer_idx on public.enquiries (dealership_id, status, created_at desc);
create index enquiries_seller_idx on public.enquiries (seller_user_id, created_at desc);
create index enquiries_buyer_idx on public.enquiries (buyer_id, created_at desc);

-- ---------- Reviews ------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null default '',
  verified_purchase boolean not null default false,
  dealer_response text,
  dealer_responded_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (dealership_id, author_id)
);
create index reviews_dealer_idx on public.reviews (dealership_id, status, created_at desc);

create or replace function public.refresh_dealer_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare d uuid := coalesce(new.dealership_id, old.dealership_id);
begin
  update public.dealerships set
    rating_avg = (select round(avg(rating)::numeric, 2) from public.reviews where dealership_id = d and status = 'published'),
    rating_count = (select count(*) from public.reviews where dealership_id = d and status = 'published')
  where id = d;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_dealer_rating();
