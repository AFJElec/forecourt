import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

/** Handles email confirmation, magic links and password-reset links (PKCE code exchange). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code) {
    const db = await supabaseServer();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
}
