/**
 * Supabase-backed repositories (enabled with DATA_SOURCE=supabase + Supabase env vars).
 * Public reads use the cookie-less anon client; RLS restricts it to active adverts.
 * SQL behind these calls is verified locally (scripts/test-db.sh); the TypeScript
 * mapping still needs a first run against a live Supabase project.
 */
import { illustrativeMonthly } from "@/lib/finance/representative";
import { geocodePostcode } from "@/lib/geo/postcodes";
import { assessPrice, type PricePoint } from "@/lib/pricing/assessment";
import { effectivePriceMax, resolveOrigin, type Facets, type SearchResult } from "@/lib/search/engine";
import type { SearchFilters } from "@/lib/search/schema";
import { mediaUrl, supabasePublic } from "@/lib/supabase/clients";
import { registrationYearLabel } from "@/lib/uk/registration";
import type { Dealership, Manufacturer, Vehicle, VehicleModel, VehicleSummary } from "@/types/vehicle";
import type { DealerRepository, ListingRepository, TaxonomyRepository } from "./types";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const PAGE_SIZE = 24;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

// ---------- mapping ------------------------------------------------------
function summaryFromSearchRow(r: Row, distance: number | null): VehicleSummary {
  const price = Number(r.price_gbp);
  return {
    id: String(r.id), slug: String(r.slug), isDemo: Boolean(r.is_demo),
    make: String(r.make), model: String(r.model), derivative: String(r.derivative ?? ""),
    year: Number(r.year), registrationYearLabel: `${r.year}${r.plate_identifier ? ` (${r.plate_identifier} reg)` : ""}`,
    mileage: Number(r.mileage), price, previousPrice: r.previous_price_gbp ? Number(r.previous_price_gbp) : null,
    fuelType: r.fuel_type, transmission: r.transmission, bodyType: r.body_type, sellerType: r.seller_type,
    location: { town: String(r.town ?? ""), county: String(r.county ?? ""), postcode: String(r.postcode ?? "").split(" ")[0]!, lat: Number(r.lat), lng: Number(r.lng) },
    featured: Boolean(r.is_featured), listedAt: String(r.published_at ?? ""), dealershipId: r.dealership_id ?? null,
    enginePowerBhp: Number(r.power_bhp ?? 0), writeOffCategory: r.write_off_category, ulezCompliant: r.ulez_compliant === true,
    image: { src: mediaUrl(r.primary_image), alt: `${r.make} ${r.model}`, width: 1200, height: 900 },
    imageCount: Number(r.image_count ?? 0),
    dealershipName: r.dealership_name ?? null,
    distanceMiles: distance == null ? null : Math.round(distance),
    monthlyFinance: illustrativeMonthly(price),
    priceAssessment: null,
  };
}

const DETAIL_SELECT = `
  id, slug, status, is_demo, is_featured, seller_type, seller_user_id, dealership_id, title, description, price_gbp, mileage,
  service_history, condition, postcode, town, county, lat, lng, video_url, views_count, saves_count, published_at,
  package:ad_packages(code),
  vehicle:vehicles(
    id, vrm, year, plate_identifier, first_registered, fuel_type, transmission, body_type, engine_cc, power_bhp, colour, doors, seats,
    insurance_group, ulez_compliant, write_off_category, owners, derivative_text, manufacturer_id, model_id,
    manufacturer:manufacturers(name, slug), model:models(name, slug),
    spec:vehicle_specifications(*),
    equipment:vehicle_equipment(item:equipment_items(slug)),
    history:vehicle_history_checks(mot_expiry, checked_at)
  ),
  media:vehicle_media(storage_path, alt, width, height, position, kind, moderation_status),
  prices:price_history(old_price_gbp, new_price_gbp, changed_at)`;

function vehicleFromDetail(r: Row): Vehicle {
  const v = r.vehicle as Row;
  const spec = (Array.isArray(v.spec) ? v.spec[0] : v.spec) ?? {};
  const photos = ((r.media ?? []) as Row[])
    .filter((m) => m.kind === "photo" && m.moderation_status === "approved")
    .sort((a, b) => a.position - b.position);
  const drops = ((r.prices ?? []) as Row[]).filter((p) => p.old_price_gbp && p.old_price_gbp > p.new_price_gbp)
    .sort((a, b) => String(b.changed_at).localeCompare(String(a.changed_at)));
  const mot = ((v.history ?? []) as Row[]).map((h) => h.mot_expiry).filter(Boolean).sort().pop() ?? null;
  const reg = v.first_registered ? new Date(v.first_registered) : null;
  return {
    id: r.id, slug: r.slug, isDemo: r.is_demo, status: r.status,
    manufacturerId: v.manufacturer_id, modelId: v.model_id,
    make: v.manufacturer?.name ?? "", model: v.model?.name ?? "", derivative: v.derivative_text ?? "",
    registration: v.vrm ?? "", year: v.year,
    registrationYearLabel: reg ? registrationYearLabel(reg) : `${v.year}${v.plate_identifier ? ` (${v.plate_identifier} reg)` : ""}`,
    mileage: r.mileage, price: r.price_gbp, previousPrice: drops[0]?.old_price_gbp ?? null,
    fuelType: v.fuel_type, transmission: v.transmission, bodyType: v.body_type,
    engineSizeLitres: v.engine_cc ? Math.round(v.engine_cc / 100) / 10 : null, enginePowerBhp: v.power_bhp ?? 0,
    colour: v.colour, doors: v.doors ?? 5, seats: v.seats ?? 5, ulezCompliant: v.ulez_compliant === true,
    insuranceGroup: v.insurance_group ?? 0, sellerType: r.seller_type, dealershipId: r.dealership_id,
    privateSellerName: r.seller_type === "private" ? "Private seller" : null,
    location: { town: r.town ?? "", county: r.county ?? "", postcode: String(r.postcode ?? "").split(" ")[0]!, lat: r.lat, lng: r.lng },
    serviceHistory: r.service_history, condition: r.condition === "poor" ? "fair" : r.condition, writeOffCategory: v.write_off_category,
    owners: v.owners ?? 1, motExpiry: mot,
    equipment: ((v.equipment ?? []) as Row[]).map((e) => e.item?.slug).filter(Boolean),
    description: r.description ?? "",
    images: (photos.length ? photos : [{ storage_path: null, alt: r.title }]).map((m) => ({ src: mediaUrl(m.storage_path), alt: m.alt || r.title, width: m.width ?? 1200, height: m.height ?? 900 })),
    videoUrl: r.video_url, featured: r.is_featured, adPackage: r.package?.code?.replace(/^private_/, "") ?? "standard",
    listedAt: r.published_at ?? "", views: r.views_count, saves: r.saves_count,
    co2GPerKm: spec.co2_g_km ?? null, mpgCombined: spec.mpg_combined != null ? Number(spec.mpg_combined) : null,
    electricRangeMiles: spec.electric_range_miles ?? null, batteryKwh: spec.battery_kwh != null ? Number(spec.battery_kwh) : null,
    annualTaxGbp: spec.annual_tax_gbp ?? 0, acceleration0to62: spec.acceleration_0_62 != null ? Number(spec.acceleration_0_62) : null,
    topSpeedMph: spec.top_speed_mph ?? null,
  };
}

async function rpcFilters(f: SearchFilters) {
  const origin = f.postcode ? (await geocodePostcode(f.postcode)) ?? resolveOrigin(f) : null;
  const { page: _p, view: _v, postcode: _pc, monthlyMax: _m, ...rest } = f;
  void _p; void _v; void _pc; void _m;
  return { origin, filters: { ...rest, priceMax: effectivePriceMax(f), lat: origin?.lat, lng: origin?.lng, radius: origin ? f.radius : undefined } };
}

async function searchRows(filters: Record<string, unknown>, page: number, pageSize: number) {
  const { data, error } = await supabasePublic().rpc("search_listings", { filters, page, page_size: pageSize });
  throwIf(error);
  return (data ?? []) as { listing: Row; distance_miles: number | null; total_count: number }[];
}

async function summariesWhere(build: (q: any) => any, limit: number): Promise<VehicleSummary[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data, error } = await build(supabasePublic().from("listing_search").select("*").eq("status", "active")).limit(limit);
  throwIf(error);
  return ((data ?? []) as Row[]).map((r) => summaryFromSearchRow(r, null));
}

// ---------- listings --------------------------------------------------
export const supabaseListings: ListingRepository = {
  source: "supabase",

  async search(f) {
    const { origin, filters } = await rpcFilters(f);
    const page = f.page ?? 1;
    const [rows, facetsRes] = await Promise.all([
      searchRows(filters, page, PAGE_SIZE),
      supabasePublic().rpc("listing_facets", { f: filters }),
    ]);
    throwIf(facetsRes.error);
    const total = Number(rows[0]?.total_count ?? 0);
    const result: SearchResult = {
      items: rows.map((r) => summaryFromSearchRow(r.listing, r.distance_miles)),
      total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), origin,
      facets: (facetsRes.data ?? { make: {}, body: {}, fuel: {}, transmission: {}, seller: {} }) as Facets,
    };
    return result;
  },

  async count(f) {
    const { filters } = await rpcFilters(f);
    const { data, error } = await supabasePublic().rpc("count_listings", { filters });
    throwIf(error);
    return Number(data ?? 0);
  },

  async getBySlug(slug) {
    const { data, error } = await supabasePublic().from("advertisements").select(DETAIL_SELECT).eq("slug", slug).maybeSingle();
    throwIf(error);
    return data ? vehicleFromDetail(data as Row) : null;
  },

  async getByIds(ids) {
    const valid = ids.filter((id) => UUID.test(id)).slice(0, 4);
    if (!valid.length) return [];
    const { data, error } = await supabasePublic().from("advertisements").select(DETAIL_SELECT).in("id", valid);
    throwIf(error);
    const byId = new Map(((data ?? []) as Row[]).map((r) => [r.id, vehicleFromDetail(r)]));
    return valid.map((id) => byId.get(id)).filter((v): v is Vehicle => !!v);
  },

  async getSummaries(ids) {
    const valid = ids.filter((id) => UUID.test(id));
    if (!valid.length) return [];
    const { data, error } = await supabasePublic().from("listing_search").select("*").in("id", valid);
    throwIf(error);
    const byId = new Map(((data ?? []) as Row[]).map((r) => [r.id, summaryFromSearchRow(r, null)]));
    return valid.map((id) => byId.get(id)).filter((x): x is VehicleSummary => !!x); // keep caller's order
  },

  async getSimilar(v, limit = 8) {
    const same = await summariesWhere((q) => q.eq("model", v.model).neq("id", v.id).order("published_at", { ascending: false }), limit);
    if (same.length >= limit) return same;
    const more = await summariesWhere((q) => q.eq("body_type", v.bodyType).neq("id", v.id)
      .gte("price_gbp", Math.round(v.price * 0.7)).lte("price_gbp", Math.round(v.price * 1.3)).order("published_at", { ascending: false }), limit);
    const seen = new Set(same.map((s) => s.id));
    return [...same, ...more.filter((m) => !seen.has(m.id))].slice(0, limit);
  },

  async getFeatured(limit = 8) {
    return summariesWhere((q) => q.eq("is_featured", true).order("published_at", { ascending: false }), limit);
  },

  async getRecent(limit = 8) {
    return summariesWhere((q) => q.order("published_at", { ascending: false }), limit);
  },

  async getPriceAssessment(v) {
    // Pull the comparable set (same make/model, ±2 years) and reuse the shared assessment logic.
    const { data, error } = await supabasePublic().from("listing_search").select("id, year, mileage, price_gbp")
      .eq("status", "active").eq("make", v.make).eq("model", v.model).gte("year", v.year - 2).lte("year", v.year + 2).limit(500);
    throwIf(error);
    const market: PricePoint[] = ((data ?? []) as Row[]).map((r) => ({ id: r.id, makeModel: "x", year: r.year, mileage: r.mileage, price: r.price_gbp }));
    return assessPrice({ id: v.id, makeModel: "x", year: v.year, mileage: v.mileage, price: v.price }, market);
  },

  async stats() {
    const { data, error } = await supabasePublic().rpc("listing_facets", { f: {} });
    throwIf(error);
    const f = (data ?? {}) as Facets;
    const total = Object.values(f.fuel ?? {}).reduce((a, b) => a + Number(b), 0);
    return { total, byMake: f.make ?? {}, byBody: f.body ?? {}, byFuel: f.fuel ?? {} };
  },
};

// ---------- taxonomy --------------------------------------------------
export const supabaseTaxonomy: TaxonomyRepository = {
  async manufacturers() {
    const { data, error } = await supabasePublic().from("manufacturers").select("id, slug, name, country, is_popular").order("sort_order").order("name");
    throwIf(error);
    return ((data ?? []) as Row[]).map((m): Manufacturer => ({ id: m.id, slug: m.slug, name: m.name, country: m.country ?? "", popular: m.is_popular }));
  },
  async models(makeSlug) {
    let q = supabasePublic().from("models").select("id, slug, name, manufacturer_id, manufacturer:manufacturers!inner(slug)").order("name");
    if (makeSlug) q = q.eq("manufacturer.slug", makeSlug);
    const { data, error } = await q;
    throwIf(error);
    return ((data ?? []) as Row[]).map((m): VehicleModel => ({ id: m.id, manufacturerId: m.manufacturer_id, slug: m.slug, name: m.name }));
  },
  async equipment() {
    const { data, error } = await supabasePublic().from("equipment_items").select("slug, name, category").order("id");
    throwIf(error);
    return (data ?? []) as { slug: string; name: string; category: string }[];
  },
};

// ---------- dealers ---------------------------------------------------
const DEALER_SELECT = "id, slug, name, description, phone, website, rating_avg, rating_count, is_verified, is_featured, brand_color, locations:dealership_locations(town, county, postcode, lat, lng, opening_hours, is_primary)";

function dealerFromRow(d: Row): Dealership {
  const loc = ((d.locations ?? []) as Row[]).sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0] ?? {};
  const hours = Array.isArray(loc.opening_hours) ? loc.opening_hours : [];
  return {
    id: d.id, slug: d.slug, name: d.name, description: d.description ?? "",
    location: { town: loc.town ?? "", county: loc.county ?? "", postcode: loc.postcode ?? "", lat: loc.lat ?? 0, lng: loc.lng ?? 0 },
    phone: d.phone ?? "", website: d.website, rating: d.rating_avg != null ? Number(d.rating_avg) : null, reviewCount: d.rating_count ?? 0,
    verified: d.is_verified, featured: d.is_featured,
    logoInitials: String(d.name).split(" ").filter((w: string) => /^[A-Z]/.test(w)).slice(0, 2).map((w: string) => w[0]).join(""),
    logoColor: d.brand_color ?? "#1f2a44",
    openingHours: hours.map((h: Row) => ({ day: h.day, hours: h.hours ?? (h.open ? `${h.open} – ${h.close}` : "Closed") })),
  };
}

export const supabaseDealers: DealerRepository = {
  async list(opts) {
    let q = supabasePublic().from("dealerships").select(DEALER_SELECT).eq("status", "active").order("name");
    if (opts?.featured) q = q.eq("is_featured", true);
    const { data, error } = await q;
    throwIf(error);
    return ((data ?? []) as Row[]).map(dealerFromRow);
  },
  async getBySlug(slug) {
    const { data, error } = await supabasePublic().from("dealerships").select(DEALER_SELECT).eq("slug", slug).maybeSingle();
    throwIf(error);
    return data ? dealerFromRow(data as Row) : null;
  },
  async getById(id) {
    if (!UUID.test(id)) return null;
    const { data, error } = await supabasePublic().from("dealerships").select(DEALER_SELECT).eq("id", id).maybeSingle();
    throwIf(error);
    return data ? dealerFromRow(data as Row) : null;
  },
  async stock(dealerId) {
    return summariesWhere((q) => q.eq("dealership_id", dealerId).order("published_at", { ascending: false }), 200);
  },
};
