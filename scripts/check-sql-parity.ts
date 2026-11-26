/**
 * Verifies the SQL search (public.count_listings) returns the same counts as
 * the in-memory engine for a matrix of filters. Requires a seeded database:
 *   PSQL="psql postgres://..." tsx scripts/check-sql-parity.ts
 */
import { execFileSync } from "node:child_process";
import { demoVehicles } from "../src/data/demo/vehicles";
import { effectivePriceMax, matches } from "../src/lib/search/engine";
import type { SearchFilters } from "../src/lib/search/schema";

const psql = (process.env.PSQL ?? "psql -h /tmp -p 54329 -U postgres -d fc").split(" ");
const cases: (SearchFilters & { lat?: number; lng?: number })[] = [
  {}, { make: "volkswagen" }, { make: "ford", model: "fiesta" }, { priceMin: 10000, priceMax: 20000 },
  { monthlyMax: 300 }, { yearMin: 2020 }, { mileageMax: 30000 }, { fuel: ["electric", "hybrid"] }, { transmission: "manual" },
  { engineMin: 1.4, engineMax: 2.0 }, { powerMin: 200 }, { body: ["suv"] }, { colour: ["blue", "red"] }, { doors: 5 }, { seatsMin: 7 },
  { ulez: true }, { insuranceMax: 15 }, { seller: "private" }, { serviceHistory: "full" }, { condition: "excellent" },
  { writeOff: "exclude" }, { writeOff: "only" }, { equipment: ["heated-seats", "sat-nav"] }, { derivative: "line" },
  { q: "golf" }, { radius: 50, lat: 51.48, lng: -3.18 }, { radius: 100, lat: 53.48, lng: -2.24, fuel: ["diesel"] },
  { make: "bmw", body: ["saloon"], transmission: "automatic", priceMax: 40000 },
];
let failures = 0;
for (const c of cases) {
  const { lat, lng, ...f } = c;
  const origin = lat != null ? { lat, lng: lng!, precision: "postcode" as const } : null;
  const expected = demoVehicles.filter((v) => matches(v, f, origin)).length;
  const rpc = { ...f, monthlyMax: undefined, priceMax: effectivePriceMax(f), lat, lng };
  const got = Number(execFileSync(psql[0]!, [...psql.slice(1), "-At", "-c", `select count_listings('${JSON.stringify(rpc).replace(/'/g, "''")}'::jsonb)`]).toString().trim());
  const ok = got === expected;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(c).padEnd(80)} engine=${expected} sql=${got}`);
}
console.log(failures ? `${failures} mismatches` : "SQL and in-memory search agree on all cases");
process.exit(failures ? 1 : 0);
