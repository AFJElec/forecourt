import { Bell, ChevronRight, Heart, Search, Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { AccountUnavailable } from "@/components/account/account-unavailable";
import { requireUser } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  if (!supabaseConfigured()) return <AccountUnavailable />;
  const user = await requireUser("/account");
  const { supabaseServer } = await import("@/lib/supabase/server");
  const db = await supabaseServer();
  const [saved, searches, unread, latest] = await Promise.all([
    db.from("saved_vehicles").select("advertisement_id", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    db.from("notifications").select("id, title, body, link, created_at, read_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);
  const tiles = [
    { href: "/saved", icon: Heart, label: "Saved vehicles", n: saved.count ?? 0 },
    { href: "/saved?tab=searches", icon: Search, label: "Saved searches", n: searches.count ?? 0 },
    { href: "/account/notifications", icon: Bell, label: "Unread notifications", n: unread.count ?? 0 },
    { href: "/account/settings", icon: Settings, label: "Settings", n: null },
  ];
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <AccountNav active="/account" unread={unread.count ?? 0} />
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold">Hi {user.displayName}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(({ href, icon: Icon, label, n }) => (
            <Link key={href} href={href} className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 transition hover:-translate-y-0.5">
              <Icon className="size-6 text-electric-500" />
              {n != null && <p className="tabular mt-3 text-3xl font-extrabold text-ink-900">{n}</p>}
              <p className={n != null ? "text-sm text-muted" : "mt-3 font-semibold text-ink-900"}>{label}</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-10 text-xl font-bold">Latest notifications</h2>
        {(latest.data ?? []).length === 0 ? (
          <p className="mt-3 rounded-xl bg-white p-5 text-muted ring-1 ring-mist-200">Nothing yet. Save a vehicle or a search and we'll tell you about price drops and new matches.</p>
        ) : (
          <ul className="mt-3 divide-y divide-mist-200 overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-mist-200/70">
            {(latest.data ?? []).map((n: { id: string; title: string; body: string; link: string | null; read_at: string | null }) => (
              <li key={n.id}>
                <Link href={n.link ?? "/account/notifications"} className="flex items-center gap-3 p-4 hover:bg-mist-100/60">
                  {!n.read_at && <span className="size-2 shrink-0 rounded-full bg-electric-500" aria-label="Unread" />}
                  <span className="min-w-0 flex-1"><span className="block font-semibold text-ink-900">{n.title}</span><span className="block truncate text-sm text-muted">{n.body}</span></span>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
