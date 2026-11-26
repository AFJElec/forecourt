/**
 * In-memory implementation of the search contract. Used by the demo
 * repository and by tests. Semantics must match public.listing_matches()
 * in supabase/migrations/*_search.sql.
 */
import { pagination } from "@/config/site";
import { illustrativeMonthly, maxPriceForMonthly } from "@/lib/finance/representative";
import { approximateLocation, distanceMiles, type GeoPoint } from "@/lib/geo/postcodes";
import { assessPrice, type PricePoint } from "@/lib/pricing/assessment";
import type { Dealership, Vehicle, VehicleSummary } from "@/types/vehicle";
import type { SearchFilters } from "./schema";

export interface Facets {
  make: Record<string, number>;
  body: Record<string, number>;
  fuel: Record<string, number>;
  transmission: Record<string, number>;
  seller: Record<string, number>;
}

export interface SearchResult {
  items: VehicleSummary[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  origin: GeoPoint | null;
  facets: Facets;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function effectivePriceMax(f: SearchFilters): number | undefined {
  const fromMonthly = f.monthlyMax ? maxPriceForMonthly(f.monthlyMax) : undefined;
  if (f.priceMax != null && fromMonthly != null) return Math.min(f.priceMax, fromMonthly);
  return f.priceMax ?? fromMonthly;
}

function matchesText(v: Vehicle, q: string): boolean {
  const hay = `${v.make} ${v.model} ${v.derivative} ${v.colour} ${v.fuelType.replace(/_/g, " ")} ${v.bodyType} ${v.description}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
}

export function matches(v: Vehicle, f: SearchFilters, origin: GeoPoint | null, opts: { ignore?: (keyof SearchFilters)[] } = {}): boolean {
  const skip = new Set(opts.ignore ?? []);
  const on = (k: keyof SearchFilters) => !skip.has(k) && f[k] !== undefined;
  const priceMax = skip.has("priceMax") ? undefined : effectivePriceMax(f);

  if (v.status !== "active") return false;
  if (on("make") && slug(v.make) !== f.make) return false;
  if (on("model") && slug(v.model) !== f.model) return false;
  if (on("derivative") && !v.derivative.toLowerCase().includes(f.derivative!.toLowerCase())) return false;
  if (on("priceMin") && v.price < f.priceMin!) return false;
  if (priceMax !== undefined && v.price > priceMax) return false;
  if (on("yearMin") && v.year < f.yearMin!) return false;
  if (on("yearMax") && v.year > f.yearMax!) return false;
  if (on("mileageMax") && v.mileage > f.mileageMax!) return false;
  if (on("fuel") && f.fuel!.length && !f.fuel!.includes(v.fuelType)) return false;
  if (on("body") && f.body!.length && !f.body!.includes(v.bodyType as never)) return false;
  if (on("colour") && f.colour!.length && !f.colour!.includes(v.colour.toLowerCase())) return false;
  if (on("transmission") && v.transmission !== f.transmission) return false;
  if (on("engineMin") && (v.engineSizeLitres == null || v.engineSizeLitres < f.engineMin! - 0.05)) return false;
  if (on("engineMax") && (v.engineSizeLitres == null || v.engineSizeLitres > f.engineMax! + 0.05)) return false;
  if (on("powerMin") && v.enginePowerBhp < f.powerMin!) return false;
  if (on("powerMax") && v.enginePowerBhp > f.powerMax!) return false;
  if (on("doors") && v.doors !== f.doors) return false;
  if (on("seatsMin") && v.seats < f.seatsMin!) return false;
  if (on("ulez") && f.ulez && !v.ulezCompliant) return false;
  if (on("insuranceMax") && v.insuranceGroup > f.insuranceMax!) return false;
  if (on("seller") && v.sellerType !== f.seller) return false;
  if (on("serviceHistory") && v.serviceHistory !== f.serviceHistory) return false;
  if (on("condition") && v.condition !== f.condition) return false;
  if (on("writeOff")) {
    if (f.writeOff === "exclude" && v.writeOffCategory !== "none") return false;
    if (f.writeOff === "only" && v.writeOffCategory === "none") return false;
  }
  if (on("equipment") && f.equipment!.length && !f.equipment!.every((e) => v.equipment.includes(e))) return false;
  if (on("q") && !matchesText(v, f.q!)) return false;
  if (!skip.has("radius") && origin && f.radius && distanceMiles(origin, v.location) > f.radius) return false;
  return true;
}

const marketCache = new WeakMap<Vehicle[], PricePoint[]>();
function market(all: Vehicle[]): PricePoint[] {
  let m = marketCache.get(all);
  if (!m) {
    m = all.filter((v) => v.status === "active").map((v) => ({ id: v.id, makeModel: `${v.make}|${v.model}`, year: v.year, mileage: v.mileage, price: v.price }));
    marketCache.set(all, m);
  }
  return m;
}

export function toSummary(v: Vehicle, all: Vehicle[], dealers: Dealership[], origin: GeoPoint | null): VehicleSummary {
  const assessment = assessPrice({ id: v.id, makeModel: `${v.make}|${v.model}`, year: v.year, mileage: v.mileage, price: v.price }, market(all));
  return {
    id: v.id, slug: v.slug, isDemo: v.isDemo, make: v.make, model: v.model, derivative: v.derivative, year: v.year,
    registrationYearLabel: v.registrationYearLabel, mileage: v.mileage, price: v.price, previousPrice: v.previousPrice,
    fuelType: v.fuelType, transmission: v.transmission, bodyType: v.bodyType, sellerType: v.sellerType, location: v.location,
    featured: v.featured, listedAt: v.listedAt, dealershipId: v.dealershipId, enginePowerBhp: v.enginePowerBhp,
    writeOffCategory: v.writeOffCategory, ulezCompliant: v.ulezCompliant,
    image: v.images[0]!, imageCount: v.images.length,
    dealershipName: dealers.find((d) => d.id === v.dealershipId)?.name ?? null,
    distanceMiles: origin ? Math.round(distanceMiles(origin, v.location)) : null,
    monthlyFinance: illustrativeMonthly(v.price),
    priceAssessment: assessment?.assessment ?? null,
  };
}

function compare(sort: SearchFilters["sort"], origin: GeoPoint | null) {
  return (a: Vehicle, b: Vehicle): number => {
    switch (sort) {
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "mileage_asc": return a.mileage - b.mileage;
      case "year_desc": return b.year - a.year || a.mileage - b.mileage;
      case "recent": return b.listedAt.localeCompare(a.listedAt);
      case "distance":
        if (origin) return distanceMiles(origin, a.location) - distanceMiles(origin, b.location);
        return b.listedAt.localeCompare(a.listedAt);
      default:
        return Number(b.featured) - Number(a.featured) || b.listedAt.localeCompare(a.listedAt) || a.id.localeCompare(b.id);
    }
  };
}

function countBy(rows: Vehicle[], key: (v: Vehicle) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1;
  return out;
}

export function resolveOrigin(f: SearchFilters): GeoPoint | null {
  return f.postcode ? approximateLocation(f.postcode) : null;
}

export function searchVehicles(all: Vehicle[], dealers: Dealership[], f: SearchFilters, origin = resolveOrigin(f), pageSize: number = pagination.pageSize): SearchResult {
  const matched = all.filter((v) => matches(v, f, origin)).sort(compare(f.sort, origin));
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(f.page ?? 1, 1), pageCount);
  const slice = matched.slice((page - 1) * pageSize, page * pageSize);

  // Facets are "disjunctive": each facet ignores its own filter so options stay visible.
  const facetRows = (ignore: (keyof SearchFilters)[]) => all.filter((v) => matches(v, f, origin, { ignore }));
  const facets: Facets = {
    make: countBy(facetRows(["make", "model", "derivative"]), (v) => slug(v.make)),
    body: countBy(facetRows(["body"]), (v) => v.bodyType),
    fuel: countBy(facetRows(["fuel"]), (v) => v.fuelType),
    transmission: countBy(facetRows(["transmission"]), (v) => v.transmission),
    seller: countBy(facetRows(["seller"]), (v) => v.sellerType),
  };

  return { items: slice.map((v) => toSummary(v, all, dealers, origin)), total, page, pageSize, pageCount, origin, facets };
}

export function countVehicles(all: Vehicle[], f: SearchFilters): number {
  const origin = resolveOrigin(f);
  return all.filter((v) => matches(v, f, origin)).length;
}
