/**
 * Data-access contract. UI code depends only on this interface, so the
 * demo dataset, Supabase, or a future dedicated search service can be
 * swapped without touching pages or components. The same interface will
 * back a public REST API for native iOS/Android apps.
 */
import type { SearchFilters } from "@/lib/search/schema";
import type { SearchResult } from "@/lib/search/engine";
import type { AssessmentResult } from "@/lib/pricing/assessment";
import type { Dealership, Manufacturer, Vehicle, VehicleModel, VehicleSummary } from "@/types/vehicle";

export interface ListingRepository {
  readonly source: "demo" | "supabase";
  search(filters: SearchFilters): Promise<SearchResult>;
  count(filters: SearchFilters): Promise<number>;
  getBySlug(slug: string): Promise<Vehicle | null>;
  /** Full details for several adverts (compare page). Unknown ids are skipped; order follows `ids`. */
  getByIds(ids: string[]): Promise<Vehicle[]>;
  getSummaries(ids: string[]): Promise<VehicleSummary[]>;
  getSimilar(vehicle: Vehicle, limit?: number): Promise<VehicleSummary[]>;
  getFeatured(limit?: number): Promise<VehicleSummary[]>;
  getRecent(limit?: number): Promise<VehicleSummary[]>;
  getPriceAssessment(vehicle: Vehicle): Promise<AssessmentResult | null>;
  stats(): Promise<{ total: number; byMake: Record<string, number>; byBody: Record<string, number>; byFuel: Record<string, number> }>;
}

export interface TaxonomyRepository {
  manufacturers(): Promise<Manufacturer[]>;
  models(makeSlug?: string): Promise<VehicleModel[]>;
  equipment(): Promise<{ slug: string; name: string; category: string }[]>;
}

export interface DealerRepository {
  list(opts?: { featured?: boolean }): Promise<Dealership[]>;
  getBySlug(slug: string): Promise<Dealership | null>;
  getById(id: string): Promise<Dealership | null>;
  stock(dealerId: string): Promise<VehicleSummary[]>;
}
