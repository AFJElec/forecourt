import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/clients";

export async function POST(req: Request) {
  if (supabaseConfigured()) {
    const { supabaseServer } = await import("@/lib/supabase/server");
    await (await supabaseServer()).auth.signOut();
  }
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
