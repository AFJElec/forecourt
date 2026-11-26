import { SearchX } from "lucide-react";
import Link from "next/link";
import { DemoNotice } from "@/components/common/demo-notice";
import { ActiveFilters } from "@/components/search/active-filters";
import { FilterPanel, type FilterOptions } from "@/components/search/filter-panel";
import { Pagination } from "@/components/search/pagination";
import { ResultsToolbar } from "@/components/search/results-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { formatNumber } from "@/lib/format";
import type { SearchResult } from "@/lib/search/engine";
import type { SearchFilters } from "@/lib/search/schema";
import { cn } from "@/lib/utils";

export interface SearchViewData {
  filters: SearchFilters;
  result: SearchResult;
  options: FilterOptions;
  heading: string;
  intro?: string;
  isDemo: boolean;
}

export function searchHeading(f: SearchFilters, options: FilterOptions): { heading: string; makeName?: string; modelName?: string } {
  const make = options.makes.find((m) => m.slug === f.make);
  const model = options.models.find((m) => m.manufacturerId === make?.id && m.slug === f.model);
  const subject = [make?.name, model?.name].filter(Boolean).join(" ");
  const place = f.postcode ? ` near ${f.postcode}` : "";
  return { heading: `Used ${subject ? `${subject} ` : ""}cars for sale${place}`, makeName: make?.name, modelName: model?.name };
}

export function SearchView({ data }: { data: SearchViewData }) {
  const { filters, result, options, heading, intro, isDemo } = data;
  const { makeName, modelName } = searchHeading(filters, options);
  const view = filters.view ?? "grid";
  return (
    <div className="container-page pb-10 pt-6 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted">
        <Link href="/" className="hover:text-ink-900">Home</Link> <span className="mx-1">/</span>
        <Link href="/used-cars" className="hover:text-ink-900">Used cars</Link>
        {makeName && <><span className="mx-1">/</span><Link href={`/used-cars/${filters.make}`} className="hover:text-ink-900">{makeName}</Link></>}
        {modelName && <><span className="mx-1">/</span><span className="text-ink-900">{modelName}</span></>}
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-[15px] text-muted" aria-live="polite"><strong className="text-ink-900">{formatNumber(result.total)}</strong> vehicle{result.total === 1 ? "" : "s"} found</p>
          {intro && <p className="mt-2 max-w-3xl text-sm text-muted">{intro}</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
            <FilterPanel filters={filters} options={options} facets={result.facets} />
          </div>
        </aside>
        <div className="min-w-0">
          <ResultsToolbar filters={filters} total={result.total} options={options} facets={result.facets} title={heading} />
          <div className="mt-4"><ActiveFilters filters={filters} makeName={makeName} modelName={modelName} /></div>
          {isDemo && <DemoNotice compact className="mt-4" />}

          {result.items.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-mist-300 bg-white px-6 py-16 text-center">
              <SearchX className="size-10 text-muted" />
              <h2 className="mt-4 text-xl font-bold">No vehicles match those filters</h2>
              <p className="mt-2 max-w-md text-muted">Try widening your price range or distance, or remove a filter. You can also save this search to be alerted when matching cars are listed.</p>
              <Link href="/used-cars" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>Clear all filters</Link>
            </div>
          ) : (
            <div className={cn("mt-5 grid gap-5", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
              {result.items.map((v, i) => <VehicleCard key={v.id} v={v} layout={view} priority={i < 3} />)}
            </div>
          )}
          <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
          <p className="mt-8 text-xs leading-relaxed text-muted">
            *Monthly figures are illustrative estimates (10% deposit, 48 months, 9.9% APR) to help you budget and are not finance offers. Price assessments compare each vehicle with similar listings and are shown only when there is enough market data.
          </p>
        </div>
      </div>
    </div>
  );
}
