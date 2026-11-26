/**
 * UK postcode validation + geocoding.
 * - Live: postcodes.io (open data, no key) via `geocodePostcode` on the server.
 * - Offline/demo: postcode AREA centroids below (accurate to ~10–20 miles).
 *   Production should load ONS district centroids into public.postcode_districts.
 */

const FULL = /^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})$/;
const OUTWARD = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/;

export function normalisePostcode(input: string): string {
  const v = input.toUpperCase().replace(/\s+/g, "");
  const m = v.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})$/);
  return m ? `${m[1]} ${m[2]}` : v;
}

export function isValidPostcode(input: string, allowOutward = true): boolean {
  const v = normalisePostcode(input);
  return FULL.test(v) || (allowOutward && OUTWARD.test(v));
}

export function outwardCode(input: string): string {
  const v = normalisePostcode(input);
  return v.includes(" ") ? v.split(" ")[0]! : v;
}

export function postcodeArea(input: string): string {
  return outwardCode(input).match(/^[A-Z]{1,2}/)?.[0] ?? "";
}

// Approximate centroids of UK postcode areas.
const AREA_CENTROIDS: Record<string, [number, number]> = {
  AB: [57.15, -2.11], AL: [51.76, -0.33], B: [52.48, -1.9], BA: [51.38, -2.36], BB: [53.75, -2.48], BD: [53.79, -1.75],
  BH: [50.73, -1.88], BL: [53.58, -2.43], BN: [50.83, -0.14], BR: [51.4, 0.03], BS: [51.45, -2.59], BT: [54.6, -5.93],
  CA: [54.89, -2.93], CB: [52.2, 0.12], CF: [51.48, -3.18], CH: [53.19, -2.89], CM: [51.73, 0.47], CO: [51.89, 0.9],
  CR: [51.37, -0.1], CT: [51.28, 1.08], CV: [52.41, -1.51], CW: [53.1, -2.44], DA: [51.44, 0.21], DD: [56.46, -2.97],
  DE: [52.92, -1.48], DG: [55.07, -3.6], DH: [54.78, -1.57], DL: [54.52, -1.55], DN: [53.52, -1.13], DT: [50.71, -2.44],
  DY: [52.51, -2.08], E: [51.53, -0.03], EC: [51.52, -0.09], EH: [55.95, -3.19], EN: [51.65, -0.08], EX: [50.72, -3.53],
  FK: [56.0, -3.78], FY: [53.82, -3.05], G: [55.86, -4.25], GL: [51.86, -2.24], GU: [51.24, -0.57], HA: [51.58, -0.34],
  HD: [53.65, -1.78], HG: [54.0, -1.54], HP: [51.75, -0.74], HR: [52.06, -2.72], HU: [53.74, -0.33], HX: [53.72, -1.86],
  IG: [51.56, 0.08], IP: [52.06, 1.15], IV: [57.48, -4.22], KA: [55.61, -4.5], KT: [51.39, -0.3], KW: [58.44, -3.09],
  KY: [56.11, -3.16], L: [53.41, -2.98], LA: [54.05, -2.8], LD: [52.24, -3.38], LE: [52.64, -1.13], LL: [53.12, -3.8],
  LN: [53.23, -0.54], LS: [53.8, -1.55], LU: [51.88, -0.42], M: [53.48, -2.24], ME: [51.38, 0.52], MK: [52.04, -0.76],
  ML: [55.78, -3.98], N: [51.57, -0.11], NE: [54.97, -1.61], NG: [52.95, -1.15], NN: [52.24, -0.9], NP: [51.59, -3.0],
  NR: [52.63, 1.3], NW: [51.55, -0.18], OL: [53.54, -2.12], OX: [51.75, -1.26], PA: [55.85, -4.43], PE: [52.57, -0.24],
  PH: [56.4, -3.43], PL: [50.38, -4.14], PO: [50.8, -1.09], PR: [53.76, -2.7], RG: [51.45, -0.97], RH: [51.12, -0.18],
  RM: [51.57, 0.18], S: [53.38, -1.47], SA: [51.62, -3.94], SE: [51.47, -0.06], SG: [51.9, -0.2], SK: [53.41, -2.15],
  SL: [51.51, -0.6], SM: [51.36, -0.19], SN: [51.56, -1.78], SO: [50.9, -1.4], SP: [51.07, -1.79], SR: [54.9, -1.38],
  SS: [51.54, 0.71], ST: [53.0, -2.18], SW: [51.46, -0.17], SY: [52.71, -2.75], TA: [51.02, -3.1], TD: [55.6, -2.43],
  TF: [52.68, -2.45], TN: [51.13, 0.26], TQ: [50.46, -3.53], TR: [50.26, -5.05], TS: [54.57, -1.23], TW: [51.45, -0.34],
  UB: [51.53, -0.45], W: [51.51, -0.2], WA: [53.39, -2.59], WC: [51.52, -0.12], WD: [51.66, -0.4], WF: [53.68, -1.5],
  WN: [53.55, -2.63], WR: [52.19, -2.22], WS: [52.59, -1.98], WV: [52.59, -2.13], YO: [53.96, -1.08], ZE: [60.15, -1.15],
};

export interface GeoPoint { lat: number; lng: number; precision: "postcode" | "area" }

/** Synchronous, offline approximation. */
export function approximateLocation(postcode: string): GeoPoint | null {
  if (!isValidPostcode(postcode)) return null;
  const c = AREA_CENTROIDS[postcodeArea(postcode)];
  return c ? { lat: c[0], lng: c[1], precision: "area" } : null;
}

/** Server-side precise lookup via postcodes.io, falling back to area centroid. */
export async function geocodePostcode(postcode: string): Promise<GeoPoint | null> {
  if (!isValidPostcode(postcode)) return null;
  const base = process.env.POSTCODES_API_URL;
  if (base) {
    const v = normalisePostcode(postcode);
    const path = v.includes(" ") ? `/postcodes/${encodeURIComponent(v)}` : `/outcodes/${encodeURIComponent(v)}`;
    try {
      const res = await fetch(`${base}${path}`, { next: { revalidate: 60 * 60 * 24 * 30 } } as RequestInit);
      if (res.ok) {
        const json = (await res.json()) as { result?: { latitude?: number; longitude?: number } };
        if (json.result?.latitude != null && json.result.longitude != null) {
          return { lat: json.result.latitude, lng: json.result.longitude, precision: "postcode" };
        }
      }
    } catch {
      /* fall through to approximation */
    }
  }
  return approximateLocation(postcode);
}

export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
