import "server-only";
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/clients";

type Db = Awaited<ReturnType<typeof import("@/lib/supabase/server")["supabaseServer"]>>;

/** Runs a handler with the signed-in user's RLS-scoped client, or returns 401/503. */
export async function withUser(fn: (db: Db, userId: string) => Promise<Response>): Promise<Response> {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Accounts are not configured" }, { status: 503 });
  const { supabaseServer } = await import("@/lib/supabase/server");
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    return await fn(db, user.id);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.includes("application/json")) return {};
  return ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
}
