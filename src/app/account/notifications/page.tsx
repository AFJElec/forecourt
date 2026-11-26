import { Bell, Search, TrendingDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { AccountUnavailable } from "@/components/account/account-unavailable";
import { MarkAllRead } from "@/components/account/mark-all-read";
import { requireUser } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

type N = { id: string; kind: string; title: string; body: string; link: string | null; created_at: string; read_at: string | null };

export default async function NotificationsPage() {
  if (!supabaseConfigured()) return <AccountUnavailable />;
  const user = await requireUser("/account/notifications");
  const { supabaseServer } = await import("@/lib/supabase/server");
  const db = await supabaseServer();
  const { data } = await db.from("notifications").select("id, kind, title, body, link, created_at, read_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as N[];
  const unread = list.filter((n) => !n.read_at).length;
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <AccountNav active="/account/notifications" unread={unread} />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">Notifications</h1>
          {unread > 0 && <MarkAllRead />}
        </div>
        {list.length === 0 ? (
          <p className="mt-6 rounded-xl bg-white p-6 text-muted ring-1 ring-mist-200">No notifications yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-mist-200 overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-mist-200/70">
            {list.map((n) => {
              const Icon = n.kind === "price_drop" ? TrendingDown : n.kind === "saved_search" ? Search : Bell;
              return (
                <li key={n.id} className={n.read_at ? "" : "bg-electric-50/50"}>
                  <Link href={n.link ?? "#"} className="flex gap-3 p-4 hover:bg-mist-100/60">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-electric-600 ring-1 ring-mist-200"><Icon className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink-900">{n.title}</span>
                      <span className="block text-sm text-slate-ink">{n.body}</span>
                      <span className="mt-1 block text-xs text-muted">{new Date(n.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
