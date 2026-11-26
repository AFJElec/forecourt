/**
 * Single source of truth for search filters.
 * - Parses/validates URL query strings (shareable search URLs).
 * - Serialises filters back to a canonical, stable query string.
 * - The same object is passed as jsonb to public.search_listings().
 */
import { z } from "zod";

export const SORTS = ["relevance", "price_asc", "price_desc", "mileage_asc", "year_desc", "recent", "distance"] as const;
export type SortKey = (typeof SORTS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Relevance",
  price_asc: "Price: lowest first",
  price_desc: "Price: highest first",
  mileage_asc: "Mileage: lowest first",
  year_desc: "Age: newest first",
  recent: "Most recently listed",
  distance: "Distance: nearest first",
};

const csv = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === "string" ? v.split(",").filter(Boolean) : v), z.array(item).max(20)).optional();
const int = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(min).max(max).optional());
const num = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(min).max(max).optional());
const bool = z.preprocess((v) => (v === "true" || v === "1" || v === true ? true : v === "false" || v === "0" ? false : undefined), z.boolean().optional());
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,60}$/).optional();

export const fuelValues = ["petrol", "diesel", "hybrid", "plug_in_hybrid", "electric"] as const;
export const bodyValues = ["hatchback", "saloon", "estate", "suv", "coupe", "convertible", "mpv", "pickup"] as const;

export const searchFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  make: slug,
  model: slug,
  derivative: z.string().trim().max(80).optional(),
  priceMin: int(0, 10_000_000),
  priceMax: int(0, 10_000_000),
  monthlyMax: int(0, 50_000),
  yearMin: int(1950, 2100),
  yearMax: int(1950, 2100),
  mileageMax: int(0, 2_000_000),
  fuel: csv(z.enum(fuelValues)),
  transmission: z.enum(["manual", "automatic"]).optional(),
  engineMin: num(0, 10),
  engineMax: num(0, 10),
  powerMin: int(0, 2000),
  powerMax: int(0, 2000),
  body: csv(z.enum(bodyValues)),
  colour: csv(z.string().trim().toLowerCase().regex(/^[a-z]{2,20}$/)),
  doors: int(2, 5),
  seatsMin: int(2, 9),
  ulez: bool,
  insuranceMax: int(1, 50),
  seller: z.enum(["trade", "private"]).optional(),
  postcode: z.string().trim().toUpperCase().max(8).optional(),
  radius: int(1, 1000),
  serviceHistory: z.enum(["full", "partial", "none"]).optional(),
  condition: z.enum(["excellent", "good", "fair"]).optional(),
  writeOff: z.enum(["include", "exclude", "only"]).optional(),
  equipment: csv(z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/)),
  sort: z.enum(SORTS).optional(),
  page: int(1, 1000),
  view: z.enum(["grid", "list"]).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

/** Order used for canonical query strings (stable for caching + saved searches). */
const KEY_ORDER: (keyof SearchFilters)[] = [
  "q", "make", "model", "derivative", "priceMin", "priceMax", "monthlyMax", "yearMin", "yearMax", "mileageMax", "fuel",
  "transmission", "engineMin", "engineMax", "powerMin", "powerMax", "body", "colour", "doors", "seatsMin", "ulez",
  "insuranceMax", "seller", "postcode", "radius", "serviceHistory", "condition", "writeOff", "equipment", "sort", "page", "view",
];

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

/** Lenient parse: invalid individual params are dropped rather than failing the whole search. */
export function parseSearchParams(input: RawParams): SearchFilters {
  const raw: Record<string, unknown> = {};
  if (input instanceof URLSearchParams) input.forEach((v, k) => (raw[k] = v));
  else for (const [k, v] of Object.entries(input)) raw[k] = Array.isArray(v) ? v.join(",") : v;

  const out: Record<string, unknown> = {};
  const shape = searchFiltersSchema.shape as Record<string, z.ZodTypeAny>;
  for (const key of Object.keys(shape)) {
    if (raw[key] === undefined || raw[key] === "") continue;
    const r = shape[key]!.safeParse(raw[key]);
    if (r.success && r.data !== undefined && !(Array.isArray(r.data) && r.data.length === 0)) out[key] = r.data;
  }
  return out as SearchFilters;
}

export function toQueryString(f: SearchFilters, overrides: Partial<SearchFilters> = {}): string {
  const merged: Record<string, unknown> = { ...f, ...overrides };
  const parts: string[] = [];
  for (const key of KEY_ORDER) {
    const v = merged[key];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    if (key === "page" && v === 1) continue;
    if (key === "sort" && v === "relevance") continue;
    if (key === "view" && v === "grid") continue;
    const value = Array.isArray(v) ? [...v].sort().join(",") : String(v);
    parts.push(`${key}=${encodeURIComponent(value).replace(/%2C/gi, ",").replace(/%20/g, "+")}`);
  }
  return parts.join("&");
}

export function activeFilterCount(f: SearchFilters): number {
  const ignore = new Set(["sort", "page", "view", "radius"]);
  return Object.entries(f).filter(([k, v]) => !ignore.has(k) && v !== undefined && !(Array.isArray(v) && !v.length)).length;
}
