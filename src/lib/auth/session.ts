import "server-only";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/clients";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

/** Current signed-in user, or null (also null when Supabase isn't configured). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!supabaseConfigured()) return null;
  const { supabaseServer } = await import("@/lib/supabase/server");
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser(); // verifies the JWT with Supabase Auth
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    db.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    db.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name || user.email?.split("@")[0] || "there",
    roles: (roles ?? []).map((r: { role: string }) => r.role),
  };
}

/** For account pages: returns the user or redirects to sign-in. */
export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

export { safeNext } from "./redirect";
