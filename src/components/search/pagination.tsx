import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toQueryString, type SearchFilters } from "@/lib/search/schema";
import { cn } from "@/lib/utils";

/** Crawlable link-based pagination (better for SEO than infinite scroll). */
export function Pagination({ filters, page, pageCount }: { filters: SearchFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = toQueryString({ ...filters, page: p });
    return `/used-cars${qs ? `?${qs}` : ""}`;
  };
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const cell = "flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? <Link href={href(page - 1)} rel="prev" className={cn(cell, "border border-mist-300 bg-white hover:border-ink-900")} aria-label="Previous page"><ChevronLeft className="size-4" /></Link> : <span className={cn(cell, "opacity-40")}><ChevronLeft className="size-4" /></span>}
      {sorted.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - sorted[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
          {p === page
            ? <span aria-current="page" className={cn(cell, "bg-ink-900 text-white")}>{p}</span>
            : <Link href={href(p)} className={cn(cell, "border border-mist-300 bg-white hover:border-ink-900")}>{p}</Link>}
        </span>
      ))}
      {page < pageCount ? <Link href={href(page + 1)} rel="next" className={cn(cell, "border border-mist-300 bg-white hover:border-ink-900")} aria-label="Next page"><ChevronRight className="size-4" /></Link> : <span className={cn(cell, "opacity-40")}><ChevronRight className="size-4" /></span>}
    </nav>
  );
}
