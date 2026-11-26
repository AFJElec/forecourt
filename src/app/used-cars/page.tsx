import { resolveFilters, SearchPage, searchMetadata, type SP } from "@/lib/pages/search-page";

export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  return searchMetadata(await resolveFilters(searchParams));
}

export default async function UsedCarsPage({ searchParams }: { searchParams: SP }) {
  return <SearchPage filters={await resolveFilters(searchParams)} />;
}
