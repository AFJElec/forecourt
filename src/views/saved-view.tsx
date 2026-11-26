"use client";
import { Bell, Heart, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { CompareButton } from "@/components/vehicle/compare-button";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { fetchSummaries } from "@/lib/search/client";
import { readList, replaceList, useLocalList, type SavedSearch } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";
import type { VehicleSummary } from "@/types/vehicle";

const FREQ_LABEL = { instant: "As they're listed", daily: "Daily", weekly: "Weekly", off: "Off" } as const;

async function setFrequency(s: SavedSearch, alertFrequency: NonNullable<SavedSearch["alertFrequency"]>) {
  replaceList("searches", readList<SavedSearch>("searches").map((x) => (x.id === s.id ? { ...x, alertFrequency } : x)));
  if (s.serverId) await fetch(`/api/me/searches/${s.serverId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ alertFrequency }) }).catch(() => {});
}

export function SavedView() {
  const { user, configured } = useAuth();
  const [tab, setTab] = useState<"vehicles" | "searches">("vehicles");
  useEffect(() => { if (/[?&]tab=searches/.test(window.location.search + window.location.hash)) setTab("searches"); }, []);
  const { list: ids, clear } = useLocalList<string>("saved");
  const { list: searches, remove } = useLocalList<SavedSearch>("searches");
  const [items, setItems] = useState<VehicleSummary[] | null>(null);
  const key = ids.join(",");
  useEffect(() => { fetchSummaries(key ? key.split(",") : []).then(setItems); }, [key]);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold">Saved</h1>
      {user ? (
        <p className="mt-1 text-sm text-success-600">Synced to your account — available on all your devices, with price-drop alerts on.</p>
      ) : configured ? (
        <p className="mt-1 text-sm text-muted">Saved on this device. <Link href="/sign-in?next=/saved" className="font-semibold text-electric-600 underline">Sign in</Link> to keep them on all your devices and get price-drop alerts.</p>
      ) : (
        <p className="mt-1 text-sm text-muted">Saved on this device. Account sync switches on once accounts are enabled for this site.</p>
      )}
      <div className="mt-6 inline-flex rounded-full bg-mist-100 p-1 text-sm font-semibold" role="tablist">
        {(["vehicles", "searches"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-5 py-2 capitalize", tab === t ? "bg-white shadow-sm" : "text-muted")}>
            {t} ({t === "vehicles" ? ids.length : searches.length})
          </button>
        ))}
      </div>

      {tab === "vehicles" ? (
        ids.length === 0 ? (
          <Empty icon={<Heart className="size-10" />} title="No saved vehicles yet" body="Tap the heart on any vehicle to keep it here." />
        ) : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(items ?? []).map((v) => (
                <div key={v.id} className="space-y-1.5">
                  <VehicleCard v={v} />
                  <CompareButton id={v.id} compact />
                </div>
              ))}
            </div>
            <button onClick={clear} className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-danger-600"><Trash2 className="size-4" />Clear saved vehicles</button>
          </>
        )
      ) : searches.length === 0 ? (
        <Empty icon={<Search className="size-10" />} title="No saved searches" body="Use “Save search” on the results page to keep a search here." />
      ) : (
        <ul className="mt-6 divide-y divide-mist-200 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
          {searches.map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <Bell className="size-5 text-electric-500" />
              <div className="min-w-0 flex-1">
                <Link href={`/used-cars${s.query ? `?${s.query}` : ""}`} className="block truncate font-semibold text-ink-900 hover:underline">{s.name}</Link>
                <p className="text-xs text-muted">Saved {new Date(s.createdAt).toLocaleDateString("en-GB")}{!user && " · sign in to get alerts"}</p>
              </div>
              {user && (
                <label className="hidden items-center gap-2 text-xs text-muted sm:flex">
                  Alerts
                  <select value={s.alertFrequency ?? "daily"} onChange={(e) => setFrequency(s, e.target.value as NonNullable<SavedSearch["alertFrequency"]>)}
                    className="h-9 rounded-lg border border-mist-300 bg-white px-2 text-sm text-ink-900">
                    {(Object.keys(FREQ_LABEL) as (keyof typeof FREQ_LABEL)[]).map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
                  </select>
                </label>
              )}
              <button onClick={() => remove((x) => x.id === s.id)} className="rounded-full p-2 text-muted hover:bg-mist-100 hover:text-danger-600" aria-label={`Delete saved search ${s.name}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-mist-300 bg-white px-6 py-16 text-center text-muted">
      {icon}
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-1">{body}</p>
      <Link href="/used-cars" className={cn(buttonVariants(), "mt-6")}>Search cars</Link>
    </div>
  );
}
