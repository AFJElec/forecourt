"use client";
import { BellPlus, Check, LayoutGrid, Link2, List, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { formatNumber, formatPrice } from "@/lib/format";
import type { Facets } from "@/lib/search/engine";
import { activeFilterCount, SORT_LABELS, SORTS, toQueryString, type SearchFilters, type SortKey } from "@/lib/search/schema";
import { useLocalList, type SavedSearch } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";
import { FilterPanel, type FilterOptions } from "./filter-panel";

export function describeSearch(f: SearchFilters, makeName?: string, modelName?: string): string {
  const parts = [makeName, modelName].filter(Boolean).join(" ") || "Used cars";
  const extra = [f.priceMax && `under ${formatPrice(f.priceMax)}`, f.fuel?.length && f.fuel.join("/"), f.postcode && `near ${f.postcode}`].filter(Boolean);
  return [parts, ...extra].join(", ");
}

export function ResultsToolbar({ filters, total, options, facets, title }: { filters: SearchFilters; total: number; options: FilterOptions; facets: Facets; title: string }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const { list: searches, add } = useLocalList<SavedSearch>("searches");
  const qs = toQueryString({ ...filters, page: undefined, view: undefined });
  const isSaved = searches.some((s) => s.query === qs);
  const go = (patch: Partial<SearchFilters>) => {
    const next = toQueryString({ ...filters, ...patch });
    router.push(`/used-cars${next ? `?${next}` : ""}`, { scroll: false });
  };
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const share = async () => {
    const url = `${location.origin}/used-cars${qs ? `?${qs}` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };
  const count = activeFilterCount(filters);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Button variant="outline" className="lg:hidden" onClick={() => setDrawer(true)}>
          <SlidersHorizontal /> Filters{count > 0 && <span className="rounded-full bg-electric-500 px-1.5 text-xs text-white">{count}</span>}
        </Button>
        <div className="flex-1 sm:flex-none">
          <label className="sr-only" htmlFor="sort">Sort results</label>
          <Select id="sort" value={filters.sort ?? "relevance"} onChange={(e) => go({ sort: e.target.value as SortKey, page: undefined })} className="h-11 min-w-52 text-sm">
            {SORTS.map((s) => <option key={s} value={s} disabled={s === "distance" && !filters.postcode}>{SORT_LABELS[s]}{s === "distance" && !filters.postcode ? " (add postcode)" : ""}</option>)}
          </Select>
        </div>
        <div className="ml-auto hidden items-center rounded-[var(--radius-control)] border border-mist-300 bg-white p-1 sm:flex" role="group" aria-label="Layout">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => go({ view: v })} aria-pressed={(filters.view ?? "grid") === v} aria-label={`${v} view`}
              className={cn("flex size-9 items-center justify-center rounded-lg", (filters.view ?? "grid") === v ? "bg-ink-900 text-white" : "text-muted hover:text-ink-900")}>
              {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
          ))}
        </div>
        <Button variant="outline" size="md" onClick={share} aria-label="Share this search" className="px-3.5">
          {copied ? <Check /> : <Link2 />}<span className="hidden md:inline">{copied ? "Link copied" : "Share"}</span>
        </Button>
        <Button variant={isSaved ? "subtle" : "secondary"} onClick={() => !isSaved && add({ id: crypto.randomUUID(), name: title, query: qs, createdAt: new Date().toISOString() })}>
          {isSaved ? <Check /> : <BellPlus />}{isSaved ? "Search saved" : "Save search"}
        </Button>
      </div>

      {/* Mobile filter drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", drawer ? "" : "pointer-events-none")} aria-hidden={!drawer}>
        <div className={cn("absolute inset-0 bg-ink-950/50 transition-opacity", drawer ? "opacity-100" : "opacity-0")} onClick={() => setDrawer(false)} />
        <div role="dialog" aria-label="Filters" className={cn("absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[24px] bg-white transition-transform duration-300", drawer ? "translate-y-0" : "translate-y-full")}>
          <div className="flex items-center justify-between border-b border-mist-200 px-5 py-3">
            <span className="mx-auto h-1.5 w-10 rounded-full bg-mist-300" />
            <button onClick={() => setDrawer(false)} className="absolute right-4 top-3 flex size-9 items-center justify-center rounded-full hover:bg-mist-100" aria-label="Close filters"><X className="size-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <FilterPanel filters={filters} options={options} facets={facets} />
          </div>
          <div className="border-t border-mist-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button className="w-full" size="lg" onClick={() => setDrawer(false)}>Show {formatNumber(total)} result{total === 1 ? "" : "s"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
