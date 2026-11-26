import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { loadFilterOptions, loadSearch } from "@/lib/pages/loaders";
import { parseSearchParams, toQueryString, type SearchFilters } from "@/lib/search/schema";
import { SearchView, searchHeading } from "@/views/search-view";

export type SP = Promise<Record<string, string | string[] | undefined>>;

/** Shared by /used-cars, /used-cars/[make] and /used-cars/[make]/[model] (SEO landing pages). */
export async function resolveFilters(searchParams: SP, path: { make?: string; model?: string } = {}): Promise<SearchFilters> {
  const filters = parseSearchParams(await searchParams);
  if (path.make) filters.make = path.make.toLowerCase();
  if (path.model) filters.model = path.model.toLowerCase();
  if (path.make) {
    const { makes, models } = await loadFilterOptions();
    const make = makes.find((m) => m.slug === filters.make);
    if (!make) notFound();
    if (path.model && !models.some((m) => m.manufacturerId === make.id && m.slug === filters.model)) notFound();
  }
  return filters;
}

export async function searchMetadata(filters: SearchFilters, total?: number): Promise<Metadata> {
  const options = await loadFilterOptions();
  const { heading } = searchHeading(filters, options);
  // Canonical: landing-page path for pure make/model searches; otherwise /used-cars with canonical query.
  const onlyPath = Object.keys(filters).every((k) => ["make", "model"].includes(k));
  const canonical = onlyPath && filters.make
    ? `/used-cars/${filters.make}${filters.model ? `/${filters.model}` : ""}`
    : `/used-cars${toQueryString({ ...filters, page: undefined, view: undefined }) ? `?${toQueryString({ ...filters, page: undefined, view: undefined })}` : ""}`;
  const deep = Object.keys(filters).filter((k) => !["make", "model", "page", "sort", "view"].includes(k)).length > 1;
  return {
    title: heading,
    description: `${total != null ? `${total} ` : ""}${heading.toLowerCase()} on ${brand.name}. Compare prices, mileage and history from dealers and private sellers.`,
    alternates: { canonical },
    // avoid indexing infinite filter combinations
    robots: deep ? { index: false, follow: true } : undefined,
  };
}

export async function SearchPage({ filters }: { filters: SearchFilters }) {
  const data = await loadSearch(filters);
  return <SearchView data={data} />;
}
