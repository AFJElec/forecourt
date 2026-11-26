import { dealerships, equipmentCatalogue, manufacturers, modelsFromCatalogue } from "@/data/demo/catalogue";
import { demoVehicles } from "@/data/demo/vehicles";
import { assessPrice } from "@/lib/pricing/assessment";
import { countVehicles, searchVehicles, toSummary } from "@/lib/search/engine";
import type { DealerRepository, ListingRepository, TaxonomyRepository } from "./types";

const all = demoVehicles;
const sum = (ids: string[]) =>
  ids.map((id) => all.find((v) => v.id === id)).filter((v) => !!v).map((v) => toSummary(v!, all, dealerships, null));
const tally = (key: (v: (typeof all)[number]) => string) =>
  all.reduce<Record<string, number>>((acc, v) => ((acc[key(v)] = (acc[key(v)] ?? 0) + 1), acc), {});

export const demoListings: ListingRepository = {
  source: "demo",
  async search(filters) { return searchVehicles(all, dealerships, filters); },
  async count(filters) { return countVehicles(all, filters); },
  async getBySlug(slug) { return all.find((v) => v.slug === slug) ?? null; },
  async getSummaries(ids) { return sum(ids); },
  async getByIds(ids) { return ids.map((id) => all.find((v) => v.id === id)).filter((v): v is (typeof all)[number] => !!v); },
  async getSimilar(vehicle, limit = 8) {
    const scored = all
      .filter((v) => v.id !== vehicle.id)
      .map((v) => ({
        v,
        score: (v.model === vehicle.model ? 4 : 0) + (v.make === vehicle.make ? 2 : 0) + (v.bodyType === vehicle.bodyType ? 2 : 0) +
          (v.fuelType === vehicle.fuelType ? 1 : 0) - Math.abs(v.price - vehicle.price) / Math.max(vehicle.price, 1) * 3,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored.map(({ v }) => toSummary(v, all, dealerships, null));
  },
  async getFeatured(limit = 8) { return sum(all.filter((v) => v.featured).slice(0, limit).map((v) => v.id)); },
  async getRecent(limit = 8) {
    return sum([...all].sort((a, b) => b.listedAt.localeCompare(a.listedAt)).slice(0, limit).map((v) => v.id));
  },
  async getPriceAssessment(v) {
    const market = all.map((x) => ({ id: x.id, makeModel: `${x.make}|${x.model}`, year: x.year, mileage: x.mileage, price: x.price }));
    return assessPrice({ id: v.id, makeModel: `${v.make}|${v.model}`, year: v.year, mileage: v.mileage, price: v.price }, market);
  },
  async stats() {
    return {
      total: all.length,
      byMake: tally((v) => v.make.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      byBody: tally((v) => v.bodyType),
      byFuel: tally((v) => v.fuelType),
    };
  },
};

export const demoTaxonomy: TaxonomyRepository = {
  async manufacturers() { return manufacturers; },
  async models(makeSlug) {
    const models = modelsFromCatalogue();
    return makeSlug ? models.filter((m) => m.manufacturerId === `mk-${makeSlug}`) : models;
  },
  async equipment() { return equipmentCatalogue; },
};

export const demoDealers: DealerRepository = {
  async list(opts) { return opts?.featured ? dealerships.filter((d) => d.featured) : dealerships; },
  async getBySlug(slug) { return dealerships.find((d) => d.slug === slug) ?? null; },
  async getById(id) { return dealerships.find((d) => d.id === id) ?? null; },
  async stock(dealerId) { return sum(all.filter((v) => v.dealershipId === dealerId).map((v) => v.id)); },
};
