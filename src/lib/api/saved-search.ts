import "server-only";
import { geocodePostcode } from "@/lib/geo/postcodes";
import { effectivePriceMax } from "@/lib/search/engine";
import { parseSearchParams, toQueryString } from "@/lib/search/schema";

/** Turns a canonical query string into the jsonb filter object stored in saved_searches.query (postcode resolved to lat/lng). */
export async function resolveSavedSearch(qs: string) {
  const f = parseSearchParams(new URLSearchParams(qs));
  const { page: _p, view: _v, sort: _s, monthlyMax: _m, postcode, ...rest } = f;
  void _p; void _v; void _s; void _m;
  const origin = postcode ? await geocodePostcode(postcode) : null;
  return {
    queryString: toQueryString({ ...f, page: undefined, view: undefined }),
    query: { ...rest, priceMax: effectivePriceMax(f), ...(origin && f.radius ? { lat: origin.lat, lng: origin.lng, radius: f.radius } : {}) },
  };
}
