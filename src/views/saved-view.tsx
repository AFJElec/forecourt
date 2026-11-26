"use client";
import { Bell, Heart, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { fetchSummaries } from "@/lib/search/client";
import { useLocalList, type SavedSearch } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";
import type { VehicleSummary } from "@/types/vehicle";

export function SavedView() {
  const [tab, setTab] = useState<"vehicles" | "searches">("vehicles");
  const { list: ids, clear } = useLocalList<string>("saved");
  const { list: searches, remove } = useLocalList<SavedSearch>("searches");
  const [items, setItems] = useState<VehicleSummary[] | null>(null);
  const key = ids.join(",");
  useEffect(() => { fetchSummaries(key ? key.split(",") : []).then(setItems); }, [key]);

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold">Saved</h1>
      <p className="mt-1 text-sm text-muted">Saved on this device. Create an account (coming in build phase 2) to sync across devices and get price-drop alerts.</p>
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
              {(items ?? []).map((v) => <VehicleCard key={v.id} v={v} />)}
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
                <p className="text-xs text-muted">Saved {new Date(s.createdAt).toLocaleDateString("en-GB")} · email alerts available once accounts launch</p>
              </div>
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
