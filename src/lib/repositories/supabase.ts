/**
 * Supabase-backed listing repository (enabled with DATA_SOURCE=supabase).
 * search/count call the SQL RPCs in migrations/*_search.sql; the remaining
 * methods fall back to the demo repository until Phase 2 wiring lands.
 * STATUS: SQL validated against Postgres locally; not yet run against a live Supabase project.
 */
import { illustrativeMonthly } from "@/lib/finance/representative";
import { effectivePriceMax, resolveOrigin, type SearchResult } from "@/lib/search/engine";
import { geocodePostcode } from "@/lib/geo/postcodes";
import type { SearchFilters } from "@/lib/search/schema";
import type { VehicleSummary } from "@/types/vehicle";
import { demoListings } from "./demo";
import type { ListingRepository } from "./types";

type Row = Record<string, unknown>;

const mediaUrl = (path: string | null) =>
  !path ? "/demo-vehicles/hatchback-silver-0.svg"
    : path.startsWith("demo:") ? path.slice(5) // demo renders served from /public
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${path}`;

function rowToSummary(r: Row, distance: number | null): VehicleSummary {
  const price = Number(r.price_gbp);
  return {
    id: String(r.id), slug: String(r.slug), isDemo: Boolean(r.is_demo),
    make: String(r.make), model: String(r.model), derivative: String(r.derivative ?? ""),
    year: Number(r.year), registrationYearLabel: `${r.year}${r.plate_identifier ? ` (${r.plate_identifier} reg)` : ""}`,
    mileage: Number(r.mileage), price, previousPrice: r.previous_price_gbp ? Number(r.previous_price_gbp) : null,
    fuelType: r.fuel_type as VehicleSummary["fuelType"], transmission: r.transmission as VehicleSummary["transmission"],
    bodyType: r.body_type as VehicleSummary["bodyType"], sellerType: r.seller_type as VehicleSummary["sellerType"],
    location: { town: String(r.town ?? ""), county: String(r.county ?? ""), postcode: String(r.postcode).split(" ")[0]!, lat: Number(r.lat), lng: Number(r.lng) },
    featured: Boolean(r.is_featured), listedAt: String(r.published_at ?? ""), dealershipId: (r.dealership_id as string) ?? null,
    enginePowerBhp: Number(r.power_bhp ?? 0), writeOffCategory: r.write_off_category as VehicleSummary["writeOffCategory"],
    ulezCompliant: r.ulez_compliant === true,
    image: { src: mediaUrl(r.primary_image as string | null), alt: `${r.make} ${r.model}`, width: 1200, height: 900 },
    imageCount: Number(r.image_count ?? 0),
    dealershipName: (r.dealership_name as string) ?? null,
    distanceMiles: distance == null ? null : Math.round(distance),
    monthlyFinance: illustrativeMonthly(price),
    priceAssessment: null, // computed via market_comparables() in Phase 2
  };
}

async function rpcFilters(f: SearchFilters) {
  const origin = f.postcode ? (await geocodePostcode(f.postcode)) ?? resolveOrigin(f) : null;
  const { page: _p, view: _v, postcode: _pc, monthlyMax: _m, ...rest } = f;
  return { origin, filters: { ...rest, priceMax: effectivePriceMax(f), lat: origin?.lat, lng: origin?.lng, radius: origin ? f.radius : undefined } };
}

export const supabaseListings: ListingRepository = {
  ...demoListings,
  source: "supabase",
  async search(f) {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const db = await supabaseServer();
    const { origin, filters } = await rpcFilters(f);
    const pageSize = 24;
    const { data, error } = await db.rpc("search_listings", { filters, page: f.page ?? 1, page_size: pageSize });
    if (error) throw error;
    const rows = (data ?? []) as { listing: Row; distance_miles: number | null; total_count: number }[];
    const total = Number(rows[0]?.total_count ?? 0);
    const result: SearchResult = {
      items: rows.map((r) => rowToSummary(r.listing, r.distance_miles)),
      total, page: f.page ?? 1, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), origin,
      facets: { make: {}, body: {}, fuel: {}, transmission: {}, seller: {} }, // facet RPC: Phase 2
    };
    return result;
  },
  async count(f) {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const db = await supabaseServer();
    const { filters } = await rpcFilters(f);
    const { data, error } = await db.rpc("count_listings", { filters });
    if (error) throw error;
    return Number(data ?? 0);
  },
};
