/**
 * DEMONSTRATION reference data. Dealerships and sellers are fictional.
 * Specs are representative figures for demo purposes only.
 */
import type { BodyType, Dealership, FuelType, Manufacturer, Transmission, VehicleModel } from "@/types/vehicle";

export const towns = {
  london: { town: "London", county: "Greater London", postcode: "SW11", lat: 51.4645, lng: -0.1658 },
  manchester: { town: "Manchester", county: "Greater Manchester", postcode: "M1", lat: 53.4794, lng: -2.2453 },
  birmingham: { town: "Birmingham", county: "West Midlands", postcode: "B5", lat: 52.4735, lng: -1.8936 },
  leeds: { town: "Leeds", county: "West Yorkshire", postcode: "LS11", lat: 53.7811, lng: -1.5486 },
  bristol: { town: "Bristol", county: "Bristol", postcode: "BS1", lat: 51.4545, lng: -2.5879 },
  cardiff: { town: "Cardiff", county: "South Glamorgan", postcode: "CF10", lat: 51.4716, lng: -3.1735 },
  swansea: { town: "Swansea", county: "West Glamorgan", postcode: "SA1", lat: 51.6214, lng: -3.9436 },
  newport: { town: "Newport", county: "Gwent", postcode: "NP20", lat: 51.5842, lng: -2.9977 },
  bridgend: { town: "Bridgend", county: "Mid Glamorgan", postcode: "CF31", lat: 51.5072, lng: -3.5779 },
  glasgow: { town: "Glasgow", county: "Lanarkshire", postcode: "G2", lat: 55.8617, lng: -4.2583 },
  edinburgh: { town: "Edinburgh", county: "Midlothian", postcode: "EH3", lat: 55.9469, lng: -3.2039 },
  newcastle: { town: "Newcastle upon Tyne", county: "Tyne and Wear", postcode: "NE1", lat: 54.9733, lng: -1.614 },
  liverpool: { town: "Liverpool", county: "Merseyside", postcode: "L3", lat: 53.4084, lng: -2.9916 },
  sheffield: { town: "Sheffield", county: "South Yorkshire", postcode: "S1", lat: 53.3811, lng: -1.4701 },
  nottingham: { town: "Nottingham", county: "Nottinghamshire", postcode: "NG1", lat: 52.9536, lng: -1.1505 },
  reading: { town: "Reading", county: "Berkshire", postcode: "RG1", lat: 51.4543, lng: -0.9781 },
  southampton: { town: "Southampton", county: "Hampshire", postcode: "SO14", lat: 50.9049, lng: -1.4043 },
  norwich: { town: "Norwich", county: "Norfolk", postcode: "NR1", lat: 52.626, lng: 1.297 },
  exeter: { town: "Exeter", county: "Devon", postcode: "EX1", lat: 50.7256, lng: -3.5269 },
  miltonKeynes: { town: "Milton Keynes", county: "Buckinghamshire", postcode: "MK9", lat: 52.0406, lng: -0.7594 },
  brighton: { town: "Brighton", county: "East Sussex", postcode: "BN1", lat: 50.827, lng: -0.14 },
  guildford: { town: "Guildford", county: "Surrey", postcode: "GU1", lat: 51.2362, lng: -0.5704 },
} as const;
export type TownKey = keyof typeof towns;

const weekdays = (open: string, sat: string, sun: string) => [
  { day: "Monday", hours: open }, { day: "Tuesday", hours: open }, { day: "Wednesday", hours: open },
  { day: "Thursday", hours: open }, { day: "Friday", hours: open }, { day: "Saturday", hours: sat }, { day: "Sunday", hours: sun },
];

const dealer = (
  n: number, slug: string, name: string, town: TownKey, color: string, description: string,
  extra: Partial<Dealership> = {},
): Dealership => ({
  id: `demo-dealer-${String(n).padStart(2, "0")}`,
  slug, name, description,
  location: { ...towns[town] },
  phone: `01632 960${String(100 + n * 7).slice(-3)}`, // Ofcom drama/test range — not a real number
  website: null,
  rating: null, reviewCount: 0, verified: true, featured: false,
  logoInitials: name.split(" ").filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join(""),
  logoColor: color,
  openingHours: weekdays("09:00 – 18:00", "09:00 – 17:00", "Closed"),
  ...extra,
});

export const dealerships: Dealership[] = [
  dealer(1, "severn-bridge-motors", "Severn Bridge Motors", "newport", "#1e40af",
    "Family-run independent dealer specialising in quality used family cars, with every vehicle HPI-checked and prepared in our own workshop.",
    { featured: true, rating: 4.8, reviewCount: 312, openingHours: weekdays("08:30 – 18:00", "09:00 – 17:00", "10:00 – 16:00") }),
  dealer(2, "northgate-prestige", "Northgate Prestige", "manchester", "#111827",
    "Prestige and performance vehicles from BMW, Audi, Mercedes-Benz, Porsche and Land Rover, sourced with full service history.",
    { featured: true, rating: 4.7, reviewCount: 198 }),
  dealer(3, "capital-ev-centre", "Capital EV Centre", "london", "#0e7490",
    "Electric and hybrid specialists. Every EV comes with a battery state-of-health report and charging cable set.",
    { featured: true, rating: 4.9, reviewCount: 441 }),
  dealer(4, "pennine-car-sales", "Pennine Car Sales", "leeds", "#7c2d12",
    "Affordable, reliable used cars across Yorkshire. Part-exchange welcome on every vehicle.",
    { rating: 4.5, reviewCount: 156 }),
  dealer(5, "thamesview-motor-company", "Thamesview Motor Company", "reading", "#065f46",
    "Approved-standard used cars across the Thames Valley with nationwide delivery available.",
    { featured: true, rating: 4.6, reviewCount: 267 }),
  dealer(6, "clydeside-autos", "Clydeside Autos", "glasgow", "#4338ca",
    "Glasgow's friendly used car specialist — SUVs, 4x4s and pick-ups ready for Scottish roads.",
    { rating: 4.4, reviewCount: 89 }),
  dealer(7, "midlands-motor-hub", "Midlands Motor Hub", "birmingham", "#9d174d",
    "Over 150 cars in stock at our Birmingham site, all with a minimum 6-month warranty.",
    { rating: 4.3, reviewCount: 402 }),
  dealer(8, "harbourside-cars", "Harbourside Cars", "bristol", "#0f766e",
    "Hand-picked hatchbacks, estates and hybrids with transparent, no-haggle pricing.",
    { rating: 4.7, reviewCount: 133 }),
  dealer(9, "taff-valley-vehicles", "Taff Valley Vehicles", "cardiff", "#b45309",
    "Independent Cardiff dealership with an on-site MOT bay and in-house valeting.",
    { rating: 4.6, reviewCount: 74 }),
  dealer(10, "solent-motor-group", "Solent Motor Group", "southampton", "#1d4ed8",
    "Multi-site group across Hampshire offering estates, MPVs and family SUVs.",
    { rating: 4.5, reviewCount: 211, featured: true }),
];

export const manufacturers: Manufacturer[] = [
  ["ford", "Ford", "USA", true], ["volkswagen", "Volkswagen", "Germany", true], ["vauxhall", "Vauxhall", "UK", true],
  ["bmw", "BMW", "Germany", true], ["audi", "Audi", "Germany", true], ["mercedes-benz", "Mercedes-Benz", "Germany", true],
  ["toyota", "Toyota", "Japan", true], ["nissan", "Nissan", "Japan", true], ["kia", "Kia", "South Korea", true],
  ["hyundai", "Hyundai", "South Korea", false], ["tesla", "Tesla", "USA", true], ["land-rover", "Land Rover", "UK", true],
  ["volvo", "Volvo", "Sweden", false], ["mini", "MINI", "UK", false], ["peugeot", "Peugeot", "France", false],
  ["skoda", "Skoda", "Czech Republic", false], ["honda", "Honda", "Japan", false], ["mazda", "Mazda", "Japan", false],
  ["porsche", "Porsche", "Germany", false],
].map(([slug, name, country, popular]) => ({
  id: `mk-${slug}`, slug: slug as string, name: name as string, country: country as string, popular: popular as boolean,
}));

/** Derivative template: [model, derivative, fuel, trans, body, engineL, bhp, doors, seats, insGroup, newPriceGbp, mpg|null, co2, evRange|null, kWh|null, 0-62, top] */
type D = [string, string, FuelType, Transmission, BodyType, number | null, number, number, number, number, number, number | null, number, number | null, number | null, number, number];

export const derivatives: Record<string, D> = {
  "ford-fiesta": ["Fiesta", "1.0 EcoBoost Titanium 5dr", "petrol", "manual", "hatchback", 1.0, 100, 5, 5, 9, 19900, 56.5, 114, null, null, 10.5, 113],
  "ford-focus": ["Focus", "1.0 EcoBoost Hybrid mHEV ST-Line 5dr", "petrol", "manual", "hatchback", 1.0, 125, 5, 5, 15, 26500, 51.4, 124, null, null, 10.0, 127],
  "ford-focus-estate": ["Focus", "1.5 EcoBlue Titanium Estate", "diesel", "automatic", "estate", 1.5, 120, 5, 5, 14, 28100, 61.4, 119, null, null, 10.6, 119],
  "ford-puma": ["Puma", "1.0 EcoBoost Hybrid mHEV ST-Line X 5dr", "petrol", "manual", "suv", 1.0, 155, 5, 5, 17, 27600, 50.4, 127, null, null, 9.0, 124],
  "ford-kuga": ["Kuga", "2.5 PHEV ST-Line X 5dr CVT", "plug_in_hybrid", "automatic", "suv", 2.5, 225, 5, 5, 22, 38900, 201.8, 32, 35, 14.4, 9.2, 120],
  "ford-ranger": ["Ranger", "2.0 EcoBlue Wildtrak Double Cab Auto", "diesel", "automatic", "pickup", 2.0, 205, 4, 5, 41, 42900, 31.0, 239, null, null, 10.4, 112],
  "ford-s-max": ["S-Max", "2.5 FHEV Titanium 5dr CVT", "hybrid", "automatic", "mpv", 2.5, 190, 5, 7, 24, 38200, 43.5, 148, null, null, 9.8, 115],
  "vw-polo": ["Polo", "1.0 TSI Life 5dr", "petrol", "manual", "hatchback", 1.0, 95, 5, 5, 8, 21200, 53.3, 120, null, null, 10.8, 116],
  "vw-golf": ["Golf", "1.5 TSI Life 5dr", "petrol", "manual", "hatchback", 1.5, 130, 5, 5, 17, 27400, 52.3, 122, null, null, 9.2, 130],
  "vw-golf-gti": ["Golf", "2.0 TSI GTI 5dr DSG", "petrol", "automatic", "hatchback", 2.0, 245, 5, 5, 30, 38600, 39.2, 163, null, null, 6.3, 155],
  "vw-tiguan": ["Tiguan", "2.0 TDI R-Line 5dr DSG", "diesel", "automatic", "suv", 2.0, 150, 5, 5, 21, 37800, 47.1, 157, null, null, 9.3, 127],
  "vw-id3": ["ID.3", "Pro Performance 58kWh Life 5dr", "electric", "automatic", "hatchback", null, 204, 5, 5, 23, 36900, null, 0, 266, 58, 7.3, 99],
  "vw-touran": ["Touran", "1.5 TSI EVO SE Family 5dr DSG", "petrol", "automatic", "mpv", 1.5, 150, 5, 7, 16, 32400, 42.8, 150, null, null, 9.1, 129],
  "vauxhall-corsa": ["Corsa", "1.2 Turbo SRi 5dr", "petrol", "manual", "hatchback", 1.2, 100, 5, 5, 13, 20400, 51.4, 124, null, null, 9.9, 121],
  "vauxhall-astra": ["Astra", "1.2 Turbo Design 5dr", "petrol", "manual", "hatchback", 1.2, 130, 5, 5, 16, 25600, 50.4, 128, null, null, 9.7, 130],
  "vauxhall-mokka": ["Mokka", "Electric 50kWh GS 5dr", "electric", "automatic", "suv", null, 136, 5, 5, 23, 33900, null, 0, 209, 50, 9.0, 93],
  "bmw-1": ["1 Series", "118i M Sport 5dr Step Auto", "petrol", "automatic", "hatchback", 1.5, 136, 5, 5, 23, 31800, 47.9, 133, null, null, 8.5, 134],
  "bmw-3": ["3 Series", "320d M Sport 4dr Step Auto", "diesel", "automatic", "saloon", 2.0, 190, 4, 5, 30, 41200, 57.6, 128, null, null, 6.9, 149],
  "bmw-3-old": ["3 Series", "320d SE 4dr", "diesel", "manual", "saloon", 2.0, 184, 4, 5, 29, 30800, 62.8, 119, null, null, 7.5, 146],
  "bmw-x3": ["X3", "xDrive20d M Sport 5dr Step Auto", "diesel", "automatic", "suv", 2.0, 190, 5, 5, 34, 49800, 44.1, 168, null, null, 7.9, 132],
  "bmw-i4": ["i4", "eDrive40 M Sport 5dr Auto", "electric", "automatic", "coupe", null, 340, 5, 5, 45, 59900, null, 0, 365, 83.9, 5.7, 118],
  "bmw-4-conv": ["4 Series", "420i M Sport Convertible Step Auto", "petrol", "automatic", "convertible", 2.0, 184, 2, 4, 33, 49100, 40.9, 157, null, null, 7.9, 149],
  "audi-a3": ["A3", "35 TFSI S line 5dr S Tronic", "petrol", "automatic", "hatchback", 1.5, 150, 5, 5, 23, 33100, 49.6, 129, null, null, 8.4, 139],
  "audi-a4-avant": ["A4", "40 TDI S line Avant S Tronic", "diesel", "automatic", "estate", 2.0, 204, 5, 5, 31, 43600, 51.4, 144, null, null, 7.3, 147],
  "audi-q5": ["Q5", "40 TDI Quattro S line 5dr S Tronic", "diesel", "automatic", "suv", 2.0, 204, 5, 5, 37, 51700, 41.5, 178, null, null, 7.6, 137],
  "audi-a5-coupe": ["A5", "40 TFSI S line 2dr S Tronic", "petrol", "automatic", "coupe", 2.0, 204, 2, 4, 33, 44200, 40.4, 158, null, null, 7.1, 155],
  "audi-q4": ["Q4 e-tron", "40 Sport 82kWh 5dr Auto", "electric", "automatic", "suv", null, 204, 5, 5, 31, 50900, null, 0, 316, 82, 8.5, 99],
  "merc-a": ["A-Class", "A200 AMG Line 5dr Auto", "petrol", "automatic", "hatchback", 1.3, 163, 5, 5, 24, 32800, 47.1, 136, null, null, 8.2, 140],
  "merc-c": ["C-Class", "C220d AMG Line 4dr 9G-Tronic", "diesel", "automatic", "saloon", 2.0, 200, 4, 5, 33, 44900, 60.1, 123, null, null, 7.3, 152],
  "merc-glc": ["GLC", "GLC 300e 4Matic AMG Line 5dr Auto", "plug_in_hybrid", "automatic", "suv", 2.0, 313, 5, 5, 41, 64900, 353.1, 18, 74, 31.2, 6.7, 134],
  "merc-eqa": ["EQA", "EQA 250 AMG Line 66.5kWh 5dr Auto", "electric", "automatic", "suv", null, 190, 5, 5, 34, 48400, null, 0, 264, 66.5, 8.9, 99],
  "toyota-yaris": ["Yaris", "1.5 Hybrid Design 5dr CVT", "hybrid", "automatic", "hatchback", 1.5, 116, 5, 5, 14, 23800, 68.9, 92, null, null, 9.7, 109],
  "toyota-corolla": ["Corolla", "1.8 Hybrid Design 5dr CVT", "hybrid", "automatic", "hatchback", 1.8, 140, 5, 5, 17, 30200, 60.1, 106, null, null, 9.2, 111],
  "toyota-chr": ["C-HR", "1.8 Hybrid Design 5dr CVT", "hybrid", "automatic", "suv", 1.8, 122, 5, 5, 15, 29900, 57.6, 111, null, null, 11.0, 105],
  "toyota-rav4": ["RAV4", "2.5 PHEV Dynamic 5dr CVT", "plug_in_hybrid", "automatic", "suv", 2.5, 306, 5, 5, 37, 51900, 282.5, 22, 46, 18.1, 6.0, 112],
  "nissan-qashqai": ["Qashqai", "1.3 DiG-T MH N-Connecta 5dr", "petrol", "manual", "suv", 1.3, 140, 5, 5, 17, 29400, 44.8, 143, null, null, 10.2, 123],
  "nissan-juke": ["Juke", "1.0 DiG-T N-Connecta 5dr", "petrol", "manual", "suv", 1.0, 114, 5, 5, 12, 23900, 47.9, 134, null, null, 10.7, 112],
  "nissan-leaf": ["Leaf", "110kW N-Connecta 40kWh 5dr Auto", "electric", "automatic", "hatchback", null, 150, 5, 5, 21, 29800, null, 0, 168, 40, 7.9, 89],
  "kia-sportage": ["Sportage", "1.6 T-GDi HEV GT-Line 5dr Auto", "hybrid", "automatic", "suv", 1.6, 230, 5, 5, 26, 36400, 44.8, 143, null, null, 8.0, 119],
  "kia-niro": ["Niro", "EV 64.8kWh 3 5dr Auto", "electric", "automatic", "suv", null, 201, 5, 5, 28, 38700, null, 0, 285, 64.8, 7.8, 104],
  "kia-picanto": ["Picanto", "1.0 GT-Line 5dr", "petrol", "manual", "hatchback", 1.0, 66, 5, 4, 3, 15200, 58.9, 109, null, null, 13.8, 100],
  "hyundai-tucson": ["Tucson", "1.6 T-GDi HEV Premium 5dr Auto", "hybrid", "automatic", "suv", 1.6, 230, 5, 5, 25, 36200, 49.6, 131, null, null, 8.0, 119],
  "hyundai-kona": ["Kona", "Electric 64kWh Premium 5dr Auto", "electric", "automatic", "suv", null, 204, 5, 5, 24, 37900, null, 0, 300, 64, 7.9, 104],
  "tesla-3": ["Model 3", "Long Range AWD 4dr Auto", "electric", "automatic", "saloon", null, 498, 4, 5, 50, 49900, null, 0, 390, 75, 4.4, 145],
  "tesla-y": ["Model Y", "Long Range AWD 5dr Auto", "electric", "automatic", "suv", null, 514, 5, 5, 50, 52900, null, 0, 331, 75, 5.0, 135],
  "lr-evoque": ["Range Rover Evoque", "2.0 D200 R-Dynamic SE 5dr Auto", "diesel", "automatic", "suv", 2.0, 204, 5, 5, 34, 47900, 41.5, 178, null, null, 8.5, 130],
  "lr-defender": ["Defender", "3.0 D300 X-Dynamic SE 110 Auto", "diesel", "automatic", "suv", 3.0, 300, 5, 5, 44, 72900, 32.1, 230, null, null, 6.7, 119],
  "volvo-xc40": ["XC40", "2.0 B4P Plus Dark 5dr Auto", "petrol", "automatic", "suv", 2.0, 197, 5, 5, 31, 39900, 39.8, 160, null, null, 8.4, 112],
  "volvo-v60": ["V60", "2.0 B4D Plus Dark Estate Auto", "diesel", "automatic", "estate", 2.0, 197, 5, 5, 29, 41200, 53.3, 138, null, null, 7.9, 112],
  "mini-hatch": ["Hatch", "1.5 Cooper Sport 5dr", "petrol", "manual", "hatchback", 1.5, 136, 5, 5, 19, 24500, 46.3, 138, null, null, 8.1, 130],
  "mini-countryman": ["Countryman", "1.5 Cooper S E ALL4 PHEV Auto", "plug_in_hybrid", "automatic", "suv", 1.5, 220, 5, 5, 25, 39800, 141.2, 45, 30, 9.6, 6.8, 123],
  "peugeot-208": ["208", "1.2 PureTech Allure 5dr", "petrol", "manual", "hatchback", 1.2, 100, 5, 5, 15, 21900, 54.3, 118, null, null, 9.9, 117],
  "peugeot-3008": ["3008", "1.5 BlueHDi GT 5dr EAT8", "diesel", "automatic", "suv", 1.5, 130, 5, 5, 20, 33800, 52.3, 141, null, null, 11.5, 117],
  "skoda-octavia": ["Octavia", "2.0 TDI SE L Estate DSG", "diesel", "automatic", "estate", 2.0, 150, 5, 5, 19, 32600, 58.9, 127, null, null, 8.8, 137],
  "skoda-kodiaq": ["Kodiaq", "1.5 TSI SE L 5dr DSG 7 Seat", "petrol", "automatic", "suv", 1.5, 150, 5, 7, 20, 38100, 39.2, 164, null, null, 9.6, 125],
  "honda-jazz": ["Jazz", "1.5 i-MMD Hybrid EX 5dr eCVT", "hybrid", "automatic", "hatchback", 1.5, 109, 5, 5, 16, 23900, 62.8, 102, null, null, 9.4, 107],
  "honda-civic": ["Civic", "1.0 VTEC Turbo SR 5dr", "petrol", "manual", "hatchback", 1.0, 126, 5, 5, 14, 23400, 49.6, 130, null, null, 11.0, 124],
  "mazda-mx5": ["MX-5", "2.0 Skyactiv-G Sport Convertible", "petrol", "manual", "convertible", 2.0, 184, 2, 2, 31, 30900, 40.9, 155, null, null, 6.5, 137],
  "mazda-cx5": ["CX-5", "2.0 e-Skyactiv G MHEV Homura 5dr", "petrol", "manual", "suv", 2.0, 165, 5, 5, 22, 33900, 40.9, 156, null, null, 10.1, 125],
  "porsche-911": ["911", "3.0 Carrera S PDK 2dr", "petrol", "automatic", "coupe", 3.0, 450, 2, 4, 50, 112000, 28.0, 229, null, null, 3.5, 191],
  "porsche-macan": ["Macan", "2.0 T 5dr PDK", "petrol", "automatic", "suv", 2.0, 265, 5, 5, 42, 61900, 30.7, 209, null, null, 6.2, 145],
};

export function modelsFromCatalogue(): VehicleModel[] {
  const seen = new Map<string, VehicleModel>();
  for (const [key, d] of Object.entries(derivatives)) {
    const makeSlug = makeSlugForKey(key);
    if (!makeSlug) throw new Error(`No manufacturer for ${key}`);
    const slug = slugify(d[0]);
    const id = `md-${makeSlug}-${slug}`;
    if (!seen.has(id)) seen.set(id, { id, manufacturerId: `mk-${makeSlug}`, slug, name: d[0] });
  }
  return [...seen.values()];
}

export function makeSlugForKey(key: string): string | undefined {
  return manufacturers.find((m) => key.startsWith(keyPrefix(m.slug)))?.slug;
}

export function keyPrefix(makeSlug: string): string {
  return ({ volkswagen: "vw-", "mercedes-benz": "merc-", "land-rover": "lr-" } as Record<string, string>)[makeSlug] ?? `${makeSlug}-`;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const equipmentCatalogue: { slug: string; name: string; category: string }[] = [
  { slug: "sat-nav", name: "Satellite navigation", category: "tech" },
  { slug: "apple-carplay", name: "Apple CarPlay", category: "tech" },
  { slug: "android-auto", name: "Android Auto", category: "tech" },
  { slug: "heated-seats", name: "Heated front seats", category: "comfort" },
  { slug: "leather-seats", name: "Leather upholstery", category: "comfort" },
  { slug: "parking-sensors", name: "Front & rear parking sensors", category: "safety" },
  { slug: "reversing-camera", name: "Reversing camera", category: "safety" },
  { slug: "360-camera", name: "360° camera", category: "safety" },
  { slug: "adaptive-cruise", name: "Adaptive cruise control", category: "safety" },
  { slug: "panoramic-roof", name: "Panoramic sunroof", category: "exterior" },
  { slug: "keyless-entry", name: "Keyless entry & start", category: "comfort" },
  { slug: "heated-steering-wheel", name: "Heated steering wheel", category: "comfort" },
  { slug: "led-headlights", name: "LED headlights", category: "exterior" },
  { slug: "blind-spot", name: "Blind spot monitoring", category: "safety" },
  { slug: "tow-bar", name: "Tow bar", category: "exterior" },
  { slug: "climate-control", name: "Dual-zone climate control", category: "comfort" },
  { slug: "wireless-charging", name: "Wireless phone charging", category: "tech" },
  { slug: "head-up-display", name: "Head-up display", category: "tech" },
  { slug: "electric-tailgate", name: "Powered tailgate", category: "comfort" },
  { slug: "premium-audio", name: "Premium audio system", category: "tech" },
];
