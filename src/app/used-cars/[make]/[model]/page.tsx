import { resolveFilters, SearchPage, searchMetadata, type SP } from "@/lib/pages/search-page";

type P = { params: Promise<{ make: string; model: string }>; searchParams: SP };

export async function generateMetadata({ params, searchParams }: P) {
  return searchMetadata(await resolveFilters(searchParams, await params));
}

/** Model landing page, e.g. /used-cars/volkswagen/golf */
export default async function ModelPage({ params, searchParams }: P) {
  return <SearchPage filters={await resolveFilters(searchParams, await params)} />;
}
