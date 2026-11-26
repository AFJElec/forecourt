-- =====================================================================
-- 0006 SEARCH: full-text document, listing view, search + count RPCs
-- PostgreSQL FTS for launch. The RPC contract (jsonb filters in, rows
-- out) is what a later Typesense/Meilisearch/OpenSearch adapter replaces.
-- =====================================================================

create or replace function public.refresh_ad_search_document() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  mk text; md text; deriv text; colour text; fuel text; body text;
begin
  select m.name, mo.name, v.derivative_text, v.colour, v.fuel_type::text, v.body_type::text
    into mk, md, deriv, colour, fuel, body
  from public.vehicles v
  join public.manufacturers m on m.id = v.manufacturer_id
  join public.models mo on mo.id = v.model_id
  where v.id = new.vehicle_id;

  new.search_document :=
    setweight(to_tsvector('english', coalesce(mk, '') || ' ' || coalesce(md, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(deriv, '') || ' ' || coalesce(new.title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(colour, '') || ' ' || replace(coalesce(fuel, ''), '_', ' ') || ' ' || coalesce(body, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'D');
  return new;
end $$;

create trigger advertisements_search_doc before insert or update of title, description, vehicle_id on public.advertisements
  for each row execute function public.refresh_ad_search_document();

-- Flattened, public-safe projection used by search. security_invoker so RLS applies.
create or replace view public.listing_search with (security_invoker = true) as
select
  a.id, a.slug, a.status, a.is_demo, a.is_featured, a.seller_type, a.dealership_id,
  a.title, a.price_gbp, a.mileage, a.service_history, a.condition,
  a.postcode, a.town, a.county, a.lat, a.lng, a.published_at, a.search_document,
  a.views_count, a.saves_count,
  v.id as vehicle_id, v.year, v.plate_identifier, v.fuel_type, v.transmission, v.body_type,
  v.engine_cc, v.power_bhp, v.colour, v.doors, v.seats, v.insurance_group,
  v.ulez_compliant, v.write_off_category,
  m.slug as make_slug, m.name as make,
  mo.slug as model_slug, mo.name as model,
  v.derivative_text as derivative,
  d.name as dealership_name,
  (select vm.storage_path from public.vehicle_media vm
     where vm.advertisement_id = a.id and vm.kind = 'photo' and vm.moderation_status = 'approved'
     order by vm.is_primary desc, vm.position limit 1) as primary_image,
  (select count(*) from public.vehicle_media vm where vm.advertisement_id = a.id and vm.kind = 'photo')::int as image_count,
  (select ph.old_price_gbp from public.price_history ph
     where ph.advertisement_id = a.id and ph.old_price_gbp > ph.new_price_gbp
     order by ph.changed_at desc limit 1) as previous_price_gbp
from public.advertisements a
join public.vehicles v on v.id = a.vehicle_id
join public.manufacturers m on m.id = v.manufacturer_id
join public.models mo on mo.id = v.model_id
left join public.dealerships d on d.id = a.dealership_id;

-- Shared filter predicate. Keys mirror src/lib/search/schema.ts.
create or replace function public.listing_matches(l public.listing_search, f jsonb)
returns boolean language sql stable parallel safe as $$
  select
    l.status = 'active'
    and (f->>'make' is null or l.make_slug = (f->>'make')::citext)
    and (f->>'model' is null or l.model_slug = (f->>'model')::citext)
    and (f->>'derivative' is null or l.derivative ilike '%' || (f->>'derivative') || '%')
    and (f->>'priceMin' is null or l.price_gbp >= (f->>'priceMin')::int)
    and (f->>'priceMax' is null or l.price_gbp <= (f->>'priceMax')::int)
    and (f->>'yearMin' is null or l.year >= (f->>'yearMin')::int)
    and (f->>'yearMax' is null or l.year <= (f->>'yearMax')::int)
    and (f->>'mileageMax' is null or l.mileage <= (f->>'mileageMax')::int)
    and (f->'fuel' is null or jsonb_array_length(f->'fuel') = 0 or l.fuel_type::text in (select jsonb_array_elements_text(f->'fuel')))
    and (f->'body' is null or jsonb_array_length(f->'body') = 0 or l.body_type::text in (select jsonb_array_elements_text(f->'body')))
    and (f->'colour' is null or jsonb_array_length(f->'colour') = 0 or lower(l.colour) in (select lower(jsonb_array_elements_text(f->'colour'))))
    and (f->>'transmission' is null or l.transmission::text = f->>'transmission')
    and (f->>'engineMin' is null or l.engine_cc >= ((f->>'engineMin')::numeric * 1000 - 50))
    and (f->>'engineMax' is null or l.engine_cc <= ((f->>'engineMax')::numeric * 1000 + 50))
    and (f->>'powerMin' is null or l.power_bhp >= (f->>'powerMin')::int)
    and (f->>'powerMax' is null or l.power_bhp <= (f->>'powerMax')::int)
    and (f->>'doors' is null or l.doors = (f->>'doors')::int)
    and (f->>'seatsMin' is null or l.seats >= (f->>'seatsMin')::int)
    and (f->>'ulez' is null or (f->>'ulez')::boolean = false or l.ulez_compliant is true)
    and (f->>'insuranceMax' is null or l.insurance_group <= (f->>'insuranceMax')::int)
    and (f->>'seller' is null or l.seller_type::text = f->>'seller')
    and (f->>'serviceHistory' is null or l.service_history::text = f->>'serviceHistory')
    and (f->>'condition' is null or l.condition::text = f->>'condition')
    and (case coalesce(f->>'writeOff', 'include')
           when 'exclude' then l.write_off_category = 'none'
           when 'only' then l.write_off_category <> 'none'
           else true end)
    and (f->'equipment' is null or jsonb_array_length(f->'equipment') = 0 or (
          select count(distinct ei.slug) from public.vehicle_equipment ve
          join public.equipment_items ei on ei.id = ve.equipment_id
          where ve.vehicle_id = l.vehicle_id and ei.slug::text in (select jsonb_array_elements_text(f->'equipment'))
        ) = jsonb_array_length(f->'equipment'))
    and (f->>'q' is null or l.search_document @@ websearch_to_tsquery('english', f->>'q'))
    and (f->>'lat' is null or f->>'radius' is null or
         public.distance_miles((f->>'lat')::float8, (f->>'lng')::float8, l.lat, l.lng) <= (f->>'radius')::float8)
$$;

create or replace function public.search_listings(filters jsonb, page int default 1, page_size int default 24)
returns table (listing jsonb, distance_miles double precision, total_count bigint)
language sql stable security invoker set search_path = public as $$
  with matched as (
    select l.*,
      case when filters->>'lat' is not null
        then public.distance_miles((filters->>'lat')::float8, (filters->>'lng')::float8, l.lat, l.lng) end as dist
    from public.listing_search l
    where public.listing_matches(l, filters)
      -- cheap bounding-box prefilter so the geo index is usable
      and (filters->>'lat' is null or filters->>'radius' is null or (
        l.lat between (filters->>'lat')::float8 - (filters->>'radius')::float8 / 69.0
                  and (filters->>'lat')::float8 + (filters->>'radius')::float8 / 69.0))
  )
  select to_jsonb(m) - 'search_document' - 'dist', m.dist, count(*) over ()
  from matched m
  order by
    case when filters->>'sort' = 'price_asc' then m.price_gbp end asc,
    case when filters->>'sort' = 'price_desc' then m.price_gbp end desc,
    case when filters->>'sort' = 'mileage_asc' then m.mileage end asc,
    case when filters->>'sort' = 'year_desc' then m.year end desc,
    case when filters->>'sort' = 'recent' then m.published_at end desc,
    case when filters->>'sort' = 'distance' then m.dist end asc nulls last,
    -- relevance: featured first, then text rank, then freshness
    case when coalesce(filters->>'sort', 'relevance') = 'relevance' then m.is_featured end desc,
    case when coalesce(filters->>'sort', 'relevance') = 'relevance' and filters->>'q' is not null
      then ts_rank(m.search_document, websearch_to_tsquery('english', filters->>'q')) end desc nulls last,
    m.published_at desc, m.id
  limit least(greatest(page_size, 1), 60)
  offset (greatest(page, 1) - 1) * least(greatest(page_size, 1), 60)
$$;

create or replace function public.count_listings(filters jsonb)
returns bigint language sql stable security invoker set search_path = public as $$
  select count(*) from public.listing_search l where public.listing_matches(l, filters)
$$;

grant execute on function public.search_listings(jsonb, int, int) to anon, authenticated;
grant execute on function public.count_listings(jsonb) to anon, authenticated;

-- Market comparables for price assessment (same make/model, ±2 yrs, ±25% mileage).
create or replace function public.market_comparables(p_make text, p_model text, p_year int, p_mileage int)
returns table (n bigint, median_price numeric)
language sql stable security invoker set search_path = public as $$
  select count(*), percentile_cont(0.5) within group (order by price_gbp)::numeric
  from public.listing_search
  where status = 'active' and make_slug = p_make::citext and model_slug = p_model::citext
    and year between p_year - 2 and p_year + 2
    and mileage between (p_mileage * 0.75)::int and greatest((p_mileage * 1.25)::int, 5000)
$$;
grant execute on function public.market_comparables(text, text, int, int) to anon, authenticated;
