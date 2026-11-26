/**
 * Page data loaders. Server pages call these; views stay pure/presentational.
 * Keeping loaders separate from React lets the same data feed the web app,
 * a JSON API for native apps, and tests.
 */
import { dealers, listings, taxonomy } from "@/lib/repositories";
import type { SearchFilters } from "@/lib/search/schema";
import type { HomeData } from "@/views/home-view";
import type { SearchViewData } from "@/views/search-view";
import { searchHeading } from "@/views/search-view";
import type { VehicleViewData } from "@/views/vehicle-view";

export async function loadHome(): Promise<HomeData> {
  const repo = listings();
  const [makes, models, stats, featured, recent, featuredDealers] = await Promise.all([
    taxonomy().manufacturers(), taxonomy().models(), repo.stats(), repo.getFeatured(8), repo.getRecent(8), dealers().list({ featured: true }),
  ]);
  return { makes, models, stats, featured, recent, dealers: featuredDealers, isDemo: repo.source === "demo" };
}

export async function loadFilterOptions() {
  const [makes, models, equipment] = await Promise.all([taxonomy().manufacturers(), taxonomy().models(), taxonomy().equipment()]);
  const colours = ["black", "white", "silver", "grey", "blue", "red", "green", "orange", "bronze"];
  return { makes: [...makes].sort((a, b) => a.name.localeCompare(b.name)), models: [...models].sort((a, b) => a.name.localeCompare(b.name)), equipment, colours };
}

export async function loadSearch(filters: SearchFilters): Promise<SearchViewData> {
  const repo = listings();
  const [result, options] = await Promise.all([repo.search(filters), loadFilterOptions()]);
  const { heading, makeName, modelName } = searchHeading(filters, options);
  const intro = modelName
    ? `Browse used ${makeName} ${modelName} cars from dealers and private sellers across the UK. Compare prices, mileage and specs, and save your search to be notified of new listings.`
    : makeName
      ? `Find used ${makeName} cars for sale near you. Filter by model, price, year, fuel type and more.`
      : undefined;
  return { filters, result, options, heading, intro, isDemo: repo.source === "demo" };
}

export async function loadVehicle(slug: string): Promise<VehicleViewData | null> {
  const repo = listings();
  const vehicle = await repo.getBySlug(slug);
  if (!vehicle) return null;
  const [dealer, similar, assessment, equipment] = await Promise.all([
    vehicle.dealershipId ? dealers().getById(vehicle.dealershipId) : Promise.resolve(null),
    repo.getSimilar(vehicle, 8),
    repo.getPriceAssessment(vehicle),
    taxonomy().equipment(),
  ]);
  return { vehicle, dealer, similar, assessment, equipmentNames: Object.fromEntries(equipment.map((e) => [e.slug, e.name])) };
}

export async function loadDealerDirectory() {
  const list = await dealers().list();
  const counts: Record<string, number> = {};
  await Promise.all(list.map(async (d) => { counts[d.id] = (await dealers().stock(d.id)).length; }));
  return { dealers: list, stockCounts: counts };
}

export async function loadDealer(slug: string) {
  const dealer = await dealers().getBySlug(slug);
  if (!dealer) return null;
  return { dealer, stock: await dealers().stock(dealer.id) };
}
