import { dataSource } from "@/config/site";
import { demoDealers, demoListings, demoTaxonomy } from "./demo";
import { supabaseListings } from "./supabase";
import type { DealerRepository, ListingRepository, TaxonomyRepository } from "./types";

/**
 * Repository registry. Pages call `listings()` etc. and never import an
 * implementation directly. Taxonomy + dealers move to Supabase in Phase 2.
 */
export function listings(): ListingRepository {
  return dataSource() === "supabase" ? supabaseListings : demoListings;
}
export function taxonomy(): TaxonomyRepository { return demoTaxonomy; }
export function dealers(): DealerRepository { return demoDealers; }

export type { DealerRepository, ListingRepository, TaxonomyRepository };
