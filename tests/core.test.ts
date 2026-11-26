import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dealerships } from "@/data/demo/catalogue";
import { demoVehicles } from "@/data/demo/vehicles";
import { calculateFinance, illustrativeMonthly, maxPriceForMonthly } from "@/lib/finance/representative";
import { approximateLocation, distanceMiles, isValidPostcode, normalisePostcode, outwardCode } from "@/lib/geo/postcodes";
import { assessPrice } from "@/lib/pricing/assessment";
import { countVehicles, searchVehicles } from "@/lib/search/engine";
import { activeFilterCount, parseSearchParams, toQueryString } from "@/lib/search/schema";
import { formatVrm, isValidVrm, plateIdentifier, plateToDateRange } from "@/lib/uk/registration";
import { enquirySchema } from "@/lib/validation/enquiry";

describe("UK registration", () => {
  it("validates current and older formats", () => {
    for (const ok of ["AB12 CDE", "ab12cde", "A123 BCD", "ABC 123D", "1 ABC"]) assert.ok(isValidVrm(ok), ok);
    for (const bad of ["", "AB12CDEF", "!!", "QQ12 ABC"]) assert.ok(!isValidVrm(bad), bad);
  });
  it("derives plate identifiers", () => {
    assert.equal(plateIdentifier(new Date(Date.UTC(2021, 2, 1))), "21");
    assert.equal(plateIdentifier(new Date(Date.UTC(2021, 8, 1))), "71");
    assert.equal(plateIdentifier(new Date(Date.UTC(2022, 1, 15))), "71");
    assert.equal(plateToDateRange("71")?.from.toISOString().slice(0, 10), "2021-09-01");
    assert.equal(formatVrm("ab12cde"), "AB12 CDE");
  });
});

describe("UK postcodes", () => {
  it("validates and normalises", () => {
    assert.ok(isValidPostcode("cf101aa"));
    assert.equal(normalisePostcode("cf101aa"), "CF10 1AA");
    assert.equal(outwardCode("SW1A 1AA"), "SW1A");
    assert.ok(isValidPostcode("M1"));
    assert.ok(!isValidPostcode("12345"));
  });
  it("approximates location and distance", () => {
    const cardiff = approximateLocation("CF10 1AA")!;
    const london = approximateLocation("SW1A 1AA")!;
    const d = distanceMiles(cardiff, london);
    assert.ok(d > 120 && d < 160, `Cardiff–London ${d}`);
  });
});

describe("illustrative finance", () => {
  it("amortises correctly", () => {
    const r = calculateFinance({ price: 10000, deposit: 1000, termMonths: 48, apr: 0 });
    assert.equal(r.monthly, 187.5);
    const r2 = calculateFinance({ price: 10000, deposit: 1000, termMonths: 48, apr: 9.9 });
    assert.ok(r2.monthly > 187.5 && r2.monthly < 230);
    assert.equal(Math.round(r2.totalPayable - r2.totalInterest), 10000);
  });
  it("inverts monthly budget to a max price", () => {
    const max = maxPriceForMonthly(300);
    assert.ok(illustrativeMonthly(max)! <= 300);
    assert.ok(illustrativeMonthly(max + 200)! > 300);
  });
});

describe("search URL schema", () => {
  it("round-trips canonical query strings and drops invalid params", () => {
    const f = parseSearchParams(new URLSearchParams("make=Ford&fuel=petrol,bogus&priceMax=abc&body=suv,hatchback&page=1&sort=relevance&ulez=true"));
    assert.equal(f.make, "ford");
    assert.equal(f.fuel, undefined); // whole csv rejected because one value invalid
    assert.equal(f.priceMax, undefined);
    assert.deepEqual(f.body, ["suv", "hatchback"]);
    assert.equal(toQueryString(f), "make=ford&body=hatchback,suv&ulez=true");
    assert.equal(activeFilterCount(f), 3);
  });
});

describe("demo dataset", () => {
  it("has 50+ clearly-flagged listings with safe registrations", () => {
    assert.ok(demoVehicles.length >= 50);
    assert.ok(demoVehicles.every((v) => v.isDemo));
    assert.ok(demoVehicles.every((v) => v.registration.startsWith("ZZ")));
    assert.equal(new Set(demoVehicles.map((v) => v.slug)).size, demoVehicles.length);
    assert.ok(new Set(demoVehicles.map((v) => v.make)).size >= 15);
    assert.ok(new Set(demoVehicles.map((v) => v.dealershipId).filter(Boolean)).size >= 8);
    assert.ok(demoVehicles.some((v) => v.writeOffCategory === "S") && demoVehicles.some((v) => v.writeOffCategory === "N"));
  });
});

describe("search engine", () => {
  const all = demoVehicles;
  it("filters by make/model and price", () => {
    const r = searchVehicles(all, dealerships, { make: "volkswagen", model: "golf", priceMax: 30000 });
    assert.ok(r.total > 0);
    assert.ok(r.items.every((v) => v.make === "Volkswagen" && v.model === "Golf" && v.price <= 30000));
  });
  it("sorts by price and mileage", () => {
    const asc = searchVehicles(all, dealerships, { sort: "price_asc" }, null, 100).items.map((v) => v.price);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    const mil = searchVehicles(all, dealerships, { sort: "mileage_asc" }, null, 100).items.map((v) => v.mileage);
    assert.deepEqual(mil, [...mil].sort((a, b) => a - b));
  });
  it("applies radius from a postcode and sorts by distance", () => {
    const r = searchVehicles(all, dealerships, { postcode: "CF10 1AA", radius: 40, sort: "distance" });
    assert.ok(r.total > 0);
    const d = r.items.map((v) => v.distanceMiles!);
    assert.ok(d.every((x) => x <= 41));
    assert.deepEqual(d, [...d].sort((a, b) => a - b));
  });
  it("paginates", () => {
    const p1 = searchVehicles(all, dealerships, { page: 1 }, null, 24);
    const p2 = searchVehicles(all, dealerships, { page: 2 }, null, 24);
    assert.equal(p1.items.length, 24);
    assert.notEqual(p1.items[0]!.id, p2.items[0]!.id);
    assert.equal(p1.pageCount, Math.ceil(all.length / 24));
  });
  it("monthly budget maps to price ceiling", () => {
    const n = countVehicles(all, { monthlyMax: 200 });
    assert.equal(n, all.filter((v) => v.price <= maxPriceForMonthly(200)).length);
  });
  it("equipment requires all selected items", () => {
    const r = searchVehicles(all, dealerships, { equipment: ["heated-seats", "sat-nav"] }, null, 100);
    assert.ok(r.items.length > 0);
    assert.ok(r.items.every((s) => { const v = all.find((x) => x.id === s.id)!; return v.equipment.includes("heated-seats") && v.equipment.includes("sat-nav"); }));
  });
  it("facets ignore their own filter", () => {
    const r = searchVehicles(all, dealerships, { fuel: ["electric"] });
    assert.ok(Object.keys(r.facets.fuel).length > 1);
  });
});

describe("price assessment", () => {
  const p = (id: string, price: number, year = 2020, mileage = 30000) => ({ id, makeModel: "X|Y", year, mileage, price });
  it("returns null without enough comparables", () => {
    assert.equal(assessPrice(p("s", 10000), [p("a", 10000), p("b", 10000)]), null);
  });
  it("classifies against the normalised median", () => {
    const market = [p("a", 10000), p("b", 10200), p("c", 9800), p("d", 10100), p("e", 9900)];
    assert.equal(assessPrice(p("s", 8800), market)?.assessment, "excellent");
    assert.equal(assessPrice(p("s", 9600), market)?.assessment, "good");
    assert.equal(assessPrice(p("s", 10100), market)?.assessment, "fair");
    assert.equal(assessPrice(p("s", 11500), market)?.assessment, "above");
  });
  it("only badges a minority of demo listings (insufficient data elsewhere)", () => {
    const r = searchVehicles(demoVehicles, dealerships, {}, null, 200);
    const badged = r.items.filter((v) => v.priceAssessment).length;
    assert.ok(badged > 0 && badged < r.items.length / 2, `badged ${badged}`);
  });
});

describe("enquiry validation", () => {
  it("requires name/email and PX registration for part-exchange", () => {
    assert.ok(!enquirySchema.safeParse({ kind: "contact", advertisementId: "x", name: "A", email: "bad" }).success);
    assert.ok(enquirySchema.safeParse({ kind: "contact", advertisementId: "x", name: "Alex", email: "a@b.co" }).success);
    assert.ok(!enquirySchema.safeParse({ kind: "part_exchange", advertisementId: "x", name: "Alex", email: "a@b.co" }).success);
    assert.ok(enquirySchema.safeParse({ kind: "part_exchange", advertisementId: "x", name: "Alex", email: "a@b.co", pxRegistration: "AB12 CDE", pxMileage: "40000" }).success);
  });
});
