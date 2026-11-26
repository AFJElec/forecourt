import { brand } from "./brand";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brand.domain}`;

/** Which repository implementation to use. Falls back to demo when Supabase isn't configured. */
export function dataSource(): "demo" | "supabase" {
  const wanted = process.env.DATA_SOURCE;
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return wanted === "supabase" && hasSupabase ? "supabase" : "demo";
}

export type NavItem = { label: string; href: string; status: "live" | "planned"; phase?: number };

export const mainNav: NavItem[] = [
  { label: "Used Cars", href: "/used-cars", status: "live" },
  { label: "New Cars", href: "/new-cars", status: "planned", phase: 7 },
  { label: "Vans", href: "/vans", status: "planned", phase: 7 },
  { label: "Motorcycles", href: "/motorcycles", status: "planned", phase: 7 },
  { label: "Sell Your Vehicle", href: "/sell", status: "planned", phase: 3 },
  { label: "Vehicle Valuation", href: "/valuation", status: "planned", phase: 7 },
  { label: "Find a Dealer", href: "/dealers", status: "live" },
];

export const accountNav: NavItem[] = [
  { label: "Saved Vehicles", href: "/saved", status: "live" },
  { label: "My Account", href: "/account", status: "live" },
  { label: "Compare", href: "/compare", status: "live" },
];

export const pagination = { pageSize: 24, maxPageSize: 60 } as const;

/** Minimum number of comparable listings before a price assessment is shown. */
export const PRICE_ASSESSMENT_MIN_COMPARABLES = 5;
