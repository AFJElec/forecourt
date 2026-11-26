import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { AccountUnavailable } from "@/components/account/account-unavailable";
import { PrivacyControls, SettingsForm } from "@/components/account/settings-form";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { requireUser } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

export default async function SettingsPage() {
  if (!supabaseConfigured()) return <AccountUnavailable />;
  const user = await requireUser("/account/settings");
  const { supabaseServer } = await import("@/lib/supabase/server");
  const db = await supabaseServer();
  const { data: p } = await db.from("profiles").select("*").eq("id", user.id).single();
  const prefs = (p?.notification_prefs ?? {}) as Record<string, boolean>;
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <AccountNav active="/account/settings" />
      <div className="min-w-0 max-w-2xl space-y-10">
        <h1 className="text-3xl font-extrabold">Settings</h1>
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
          <SettingsForm profile={{
            email: user.email, displayName: p?.display_name ?? "", firstName: p?.first_name ?? "", lastName: p?.last_name ?? "",
            phone: p?.phone ?? "", postcode: p?.postcode ?? "", marketing: !!p?.marketing_opt_in,
            prefs: { email: prefs.email ?? true, price_drops: prefs.price_drops ?? true, saved_searches: prefs.saved_searches ?? true },
          }} />
        </div>
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
          <h2 className="mb-4 text-lg font-bold">Change password</h2>
          <ResetPasswordForm />
        </div>
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70"><PrivacyControls /></div>
      </div>
    </div>
  );
}
