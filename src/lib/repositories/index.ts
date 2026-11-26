import { dataSource } from "@/config/site";
import { demoDealers, demoListings, demoTaxonomy } from "./demo";
import { supabaseDealers, supabaseListings, supabaseTaxonomy } from "./supabase";
import type { DealerRepository, ListingRepository, TaxonomyRepository } from "./types";

/**
 * Repository registry. Pages call `listings()` etc. and never import an
 * implementation directly. DATA_SOURCE=supabase (with Supabase env vars) switches everything.
 */
export function listings(): ListingRepository {
  return dataSource() === "supabase" ? supabaseListings : demoListings;
}
export function taxonomy(): TaxonomyRepository {
  return dataSource() === "supabase" ? supabaseTaxonomy : demoTaxonomy;
}
export function dealers(): DealerRepository {
  return dataSource() === "supabase" ? supabaseDealers : demoDealers;
}

export type { DealerRepository, ListingRepository, TaxonomyRepository };
