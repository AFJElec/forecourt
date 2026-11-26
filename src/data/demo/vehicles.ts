/**
 * Deterministic generator for DEMONSTRATION listings (isDemo: true).
 * Same input → same output, so the demo dataset, seed.sql and tests agree.
 */
import type { BodyType, Vehicle } from "@/types/vehicle";
import { plateIdentifier, registrationYearLabel } from "@/lib/uk/registration";
import { dealerships, derivatives, equipmentCatalogue, makeSlugForKey, manufacturers, slugify, towns, type TownKey } from "./catalogue";

/** Fixed reference date so the dataset is stable. */
export const DEMO_REFERENCE_DATE = new Date(Date.UTC(2026, 10, 20));

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const plan: [string, number][] = [
  ["ford-fiesta", 8], ["vw-golf", 8], ["nissan-qashqai", 8], ["ford-focus", 3], ["ford-focus-estate", 1], ["ford-puma", 2],
  ["ford-kuga", 1], ["ford-ranger", 1], ["ford-s-max", 1], ["vw-polo", 2], ["vw-golf-gti", 1], ["vw-tiguan", 1], ["vw-id3", 1],
  ["vw-touran", 1], ["vauxhall-corsa", 3], ["vauxhall-astra", 1], ["vauxhall-mokka", 1], ["bmw-1", 1], ["bmw-3", 2],
  ["bmw-3-old", 1], ["bmw-x3", 1], ["bmw-i4", 1], ["bmw-4-conv", 1], ["audi-a3", 2], ["audi-a4-avant", 1], ["audi-q5", 1],
  ["audi-a5-coupe", 1], ["audi-q4", 1], ["merc-a", 1], ["merc-c", 1], ["merc-glc", 1], ["merc-eqa", 1], ["toyota-yaris", 2],
  ["toyota-corolla", 1], ["toyota-chr", 1], ["toyota-rav4", 1], ["nissan-juke", 1], ["nissan-leaf", 1], ["kia-sportage", 1],
  ["kia-niro", 1], ["kia-picanto", 1], ["hyundai-tucson", 1], ["hyundai-kona", 1], ["tesla-3", 2], ["tesla-y", 1],
  ["lr-evoque", 1], ["lr-defender", 1], ["volvo-xc40", 1], ["volvo-v60", 1], ["mini-hatch", 1], ["mini-countryman", 1],
  ["peugeot-208", 1], ["peugeot-3008", 1], ["skoda-octavia", 1], ["skoda-kodiaq", 1], ["honda-jazz", 1], ["honda-civic", 1],
  ["mazda-mx5", 1], ["mazda-cx5", 1], ["porsche-911", 1], ["porsche-macan", 1],
];

const colours = ["Black", "White", "Silver", "Grey", "Blue", "Red", "Blue", "Grey", "Black", "White", "Green", "Orange", "Bronze"];
const privateNames = ["Sarah", "James", "Rhys", "Priya", "Tom", "Megan", "Dafydd", "Aisha", "Callum", "Hannah", "Owen", "Zoe"];
const privateTowns: TownKey[] = ["swansea", "bridgend", "edinburgh", "newcastle", "liverpool", "sheffield", "nottingham", "norwich", "exeter", "miltonKeynes", "brighton", "guildford"];
const prestige = new Set(["bmw", "audi", "mercedes-benz", "porsche", "land-rover"]);

function pick<T>(rnd: () => number, arr: readonly T[]): T { return arr[Math.floor(rnd() * arr.length)]!; }
function roundPrice(p: number): number { return Math.max(995, Math.round(p / 250) * 250 - 5); }

function chooseDealer(rnd: () => number, makeSlug: string, fuel: string, body: BodyType): string {
  if ((fuel === "electric" || fuel === "plug_in_hybrid") && rnd() < 0.6) return "demo-dealer-03";
  if (prestige.has(makeSlug) && rnd() < 0.55) return "demo-dealer-02";
  if ((body === "suv" || body === "pickup") && rnd() < 0.3) return "demo-dealer-06";
  if ((body === "estate" || body === "mpv") && rnd() < 0.5) return "demo-dealer-10";
  return pick(rnd, dealerships).id;
}

function equipmentFor(rnd: () => number, newPrice: number, fuel: string): string[] {
  const base = ["apple-carplay", "android-auto", "led-headlights", "parking-sensors"];
  const mid = ["sat-nav", "reversing-camera", "climate-control", "keyless-entry", "heated-seats", "adaptive-cruise", "blind-spot"];
  const high = ["leather-seats", "panoramic-roof", "360-camera", "heated-steering-wheel", "head-up-display", "electric-tailgate", "wireless-charging", "premium-audio"];
  const out = base.filter(() => rnd() < 0.85);
  const midShare = newPrice > 25000 ? 0.75 : 0.35;
  const highShare = newPrice > 45000 ? 0.65 : newPrice > 32000 ? 0.3 : 0.05;
  out.push(...mid.filter(() => rnd() < midShare), ...high.filter(() => rnd() < highShare));
  if (fuel !== "electric" && rnd() < 0.12) out.push("tow-bar");
  return out.filter((e) => equipmentCatalogue.some((c) => c.slug === e));
}

function describe(v: Pick<Vehicle, "make" | "model" | "derivative" | "mileage" | "owners" | "serviceHistory" | "colour" | "sellerType" | "fuelType" | "electricRangeMiles" | "writeOffCategory">, equipmentNames: string[]): string {
  const history = { full: "full service history", partial: "partial service history", none: "no service history (priced accordingly)" }[v.serviceHistory];
  const lines = [
    `This ${v.colour.toLowerCase()} ${v.make} ${v.model} ${v.derivative} has covered ${v.mileage.toLocaleString("en-GB")} miles with ${v.owners} previous owner${v.owners === 1 ? "" : "s"} and comes with ${history}.`,
    v.fuelType === "electric" && v.electricRangeMiles ? `Official WLTP range of up to ${v.electricRangeMiles} miles, with rapid-charging capability.` : "",
    equipmentNames.length ? `Highlights include ${equipmentNames.slice(0, 5).join(", ").toLowerCase()}.` : "",
    v.sellerType === "trade"
      ? "Supplied with a fresh MOT where due, a full HPI check and a 3-month warranty. Part-exchange welcome and nationwide delivery available."
      : "Selling as I'm changing to a larger car. Genuine reason for sale; viewing welcome at my home address by appointment.",
    v.writeOffCategory !== "none" ? `IMPORTANT: this vehicle is recorded as Category ${v.writeOffCategory} (${v.writeOffCategory === "S" ? "structural" : "non-structural"} damage) and has been professionally repaired.` : "",
  ];
  return lines.filter(Boolean).join("\n\n");
}

export function generateDemoVehicles(): Vehicle[] {
  const rnd = mulberry32(20261126);
  const out: Vehicle[] = [];
  let n = 0;
  for (const [key, count] of plan) {
    const d = derivatives[key]!;
    const [modelName, derivative, fuel, trans, body, engineL, bhp, doors, seats, ins, newPrice, mpg, co2, range, kwh, accel, top] = d;
    const makeSlug = makeSlugForKey(key)!;
    const make = manufacturers.find((m) => m.slug === makeSlug)!;
    for (let i = 0; i < count; i++) {
      n++;
      const id = `demo-${String(n).padStart(3, "0")}`;
      const isEv = fuel === "electric";
      const minYear = isEv ? 2019 : key === "bmw-3-old" ? 2014 : 2016;
      // Popular models cluster in 2018–2022 (as in the real market), giving enough comparables for price assessment.
      const popular = key === "ford-fiesta" || key === "vw-golf" || key === "nissan-qashqai";
      const year = key === "bmw-3-old" ? 2014 : popular ? 2018 + Math.floor(rnd() * 5) : Math.min(2025, minYear + Math.floor(rnd() * (2026 - minYear)));
      const month = Math.floor(rnd() * 12);
      const firstReg = new Date(Date.UTC(year, month, 1 + Math.floor(rnd() * 27)));
      const ageYears = Math.max(0.4, (DEMO_REFERENCE_DATE.getTime() - firstReg.getTime()) / (365.25 * 864e5));
      const mileage = Math.round((ageYears * (4500 + rnd() * 7500)) / 10) * 10;
      const dep = 0.8 * Math.pow(0.86, ageYears - 1);
      const mileageAdj = 1 - Math.max(-0.12, Math.min(0.18, ((mileage - ageYears * 8000) / 1000) * 0.004));
      const noise = 0.9 + rnd() * 0.2; // ±10% — produces genuine price-assessment spread
      const price = roundPrice(newPrice * dep * mileageAdj * noise);
      const colour = pick(rnd, colours);
      const isTrade = rnd() < 0.78;
      const dealershipId = isTrade ? chooseDealer(rnd, makeSlug, fuel, body) : null;
      const dealer = dealerships.find((x) => x.id === dealershipId);
      const location = dealer ? { ...dealer.location } : { ...towns[pick(rnd, privateTowns)] };
      const owners = Math.max(1, Math.min(5, Math.round(ageYears / 3.5 + rnd())));
      const serviceHistory = rnd() < 0.72 ? "full" : rnd() < 0.8 ? "partial" : "none";
      const writeOffCategory = n === 23 || n === 58 ? "N" : n === 41 ? "S" : "none";
      const equipment = equipmentFor(rnd, newPrice, fuel);
      const equipmentNames = equipment.map((e) => equipmentCatalogue.find((c) => c.slug === e)!.name);
      const listedAt = new Date(DEMO_REFERENCE_DATE.getTime() - Math.floor(rnd() * 45 * 864e5) - Math.floor(rnd() * 864e5));
      const priceDrop = rnd() < 0.2 ? roundPrice(price + 300 + rnd() * 900) : null;
      // Euro 6 diesel from Sept 2015 and petrol from 2006 are ULEZ compliant; the 2014 diesel is not.
      const ulezCompliant = !(fuel === "diesel" && (year < 2015 || (year === 2015 && month < 8)));
      const ownerName = isTrade ? null : `${pick(rnd, privateNames)} (private seller)`;
      const plate = plateIdentifier(firstReg);
      const letters = "ABCDEFGHJKLMNPRSTUVWXY";
      const reg = `ZZ${plate}${letters[n % 22]}${letters[(n * 7) % 22]}${letters[(n * 13) % 22]}`; // "ZZ" prefix is never issued — cannot match a real vehicle
      const colourKey = colour.toLowerCase();
      const label = `${make.name} ${modelName}`;
      const images = [0, 1, 2, 3].map((variant) => ({
        src: `/demo-vehicles/${body}-${colourKey}-${variant}.svg`,
        alt: `${colour} ${label} — ${["side view", "side view (passenger side)", "front three-quarter detail", "rear detail"][variant]} (illustrative)`,
        width: 1200, height: 900,
      }));
      const partial = {
        make: make.name, model: modelName, derivative, mileage, owners, serviceHistory, colour, sellerType: isTrade ? "trade" : "private",
        fuelType: fuel, electricRangeMiles: range, writeOffCategory,
      } as const;
      const featured = !!dealer?.featured && rnd() < 0.35;
      out.push({
        id,
        slug: `${slugify(make.name)}-${slugify(modelName)}-${slugify(derivative)}-${id}`,
        isDemo: true,
        status: "active",
        manufacturerId: make.id,
        modelId: `md-${makeSlug}-${slugify(modelName)}`,
        make: make.name,
        model: modelName,
        derivative,
        registration: reg,
        year,
        registrationYearLabel: registrationYearLabel(firstReg),
        mileage,
        price,
        previousPrice: priceDrop,
        fuelType: fuel,
        transmission: trans,
        bodyType: body,
        engineSizeLitres: engineL,
        enginePowerBhp: bhp,
        colour,
        doors, seats,
        ulezCompliant,
        insuranceGroup: ins,
        sellerType: isTrade ? "trade" : "private",
        dealershipId,
        privateSellerName: ownerName,
        location: isTrade ? location : { ...location, lat: location.lat + (rnd() - 0.5) * 0.08, lng: location.lng + (rnd() - 0.5) * 0.08 },
        serviceHistory,
        condition: writeOffCategory !== "none" ? "fair" : ageYears < 3 ? "excellent" : rnd() < 0.7 ? "good" : "fair",
        writeOffCategory,
        owners,
        motExpiry: ageYears >= 3 ? new Date(Date.UTC(2027, (month + 2) % 12, 15)).toISOString().slice(0, 10) : null,
        equipment,
        description: describe(partial, equipmentNames),
        images,
        videoUrl: null,
        featured,
        adPackage: featured ? "premium" : isTrade ? "standard" : rnd() < 0.5 ? "basic" : "standard",
        listedAt: listedAt.toISOString(),
        views: Math.floor(rnd() * 900) + 40,
        saves: Math.floor(rnd() * 60),
        co2GPerKm: co2,
        mpgCombined: mpg,
        electricRangeMiles: range,
        batteryKwh: kwh,
        annualTaxGbp: newPrice > 40000 && ageYears < 6 ? 620 : 195,
        acceleration0to62: accel,
        topSpeedMph: top,
      });
    }
  }
  return out;
}

export const demoVehicles: Vehicle[] = generateDemoVehicles();

