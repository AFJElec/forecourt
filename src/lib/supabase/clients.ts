import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

let publicClient: SupabaseClient | null = null;

/**
 * Cookie-less anon client for PUBLIC reads (listings, taxonomy, dealers).
 * RLS limits it to active adverts, so it is safe to use anywhere — including
 * sitemap generation and cached server components.
 */
export function supabasePublic(): SupabaseClient {
  publicClient ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

/** Service-role client. SERVER ONLY — bypasses RLS. Use for webhooks, jobs and account deletion. */
export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("supabaseAdmin() must never run in the browser");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const mediaUrl = (path: string | null | undefined) =>
  !path ? "/demo-vehicles/hatchback-silver-0.svg"
    : path.startsWith("demo:") ? path.slice(5) // demo renders are served from /public
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${path}`;
