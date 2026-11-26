import { resolveFilters, SearchPage, searchMetadata, type SP } from "@/lib/pages/search-page";

type P = { params: Promise<{ make: string }>; searchParams: SP };

export async function generateMetadata({ params, searchParams }: P) {
  return searchMetadata(await resolveFilters(searchParams, await params));
}

/** Manufacturer landing page, e.g. /used-cars/volkswagen */
export default async function MakePage({ params, searchParams }: P) {
  return <SearchPage filters={await resolveFilters(searchParams, await params)} />;
}
