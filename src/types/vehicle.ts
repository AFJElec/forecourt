/** Domain types shared by the UI, the repositories and the database mapping. */

export type FuelType = "petrol" | "diesel" | "hybrid" | "plug_in_hybrid" | "electric";
export type Transmission = "manual" | "automatic";
export type BodyType =
  | "hatchback" | "saloon" | "estate" | "suv" | "coupe" | "convertible" | "mpv" | "pickup";
export type SellerType = "trade" | "private";
export type WriteOffCategory = "none" | "S" | "N";
export type ServiceHistory = "full" | "partial" | "none";
export type VehicleCondition = "excellent" | "good" | "fair";
export type ListingStatus = "draft" | "pending_review" | "active" | "paused" | "sold" | "expired" | "removed";
export type AdPackage = "basic" | "standard" | "premium";
export type PriceAssessment = "excellent" | "good" | "fair" | "above";

export interface Manufacturer {
  id: string;
  slug: string;
  name: string;
  country: string;
  popular: boolean;
}

export interface VehicleModel {
  id: string;
  manufacturerId: string;
  slug: string;
  name: string;
}

export interface Location {
  town: string;
  county: string;
  /** Outward code only is shown publicly for private sellers. */
  postcode: string;
  lat: number;
  lng: number;
}

export interface Dealership {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: Location;
  phone: string;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  logoInitials: string;
  logoColor: string;
  openingHours: { day: string; hours: string }[];
}

export interface VehicleImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Vehicle {
  id: string;
  slug: string;
  /** Demo listings must never be presented as genuine advertisements. */
  isDemo: boolean;
  status: ListingStatus;
  manufacturerId: string;
  modelId: string;
  make: string;
  model: string;
  derivative: string;
  registration: string; // full VRM; only shown masked publicly
  year: number;
  registrationYearLabel: string; // e.g. "2021 (71 reg)"
  mileage: number;
  price: number; // pence avoided for simplicity — whole pounds GBP
  previousPrice: number | null;
  fuelType: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  engineSizeLitres: number | null;
  enginePowerBhp: number;
  colour: string;
  doors: number;
  seats: number;
  ulezCompliant: boolean;
  insuranceGroup: number; // 1–50
  sellerType: SellerType;
  dealershipId: string | null;
  privateSellerName: string | null;
  location: Location;
  serviceHistory: ServiceHistory;
  condition: VehicleCondition;
  writeOffCategory: WriteOffCategory;
  owners: number;
  motExpiry: string | null; // ISO date
  equipment: string[];
  description: string;
  images: VehicleImage[];
  videoUrl: string | null;
  featured: boolean;
  adPackage: AdPackage;
  listedAt: string; // ISO
  views: number;
  saves: number;
  co2GPerKm: number | null;
  mpgCombined: number | null;
  electricRangeMiles: number | null;
  batteryKwh: number | null;
  annualTaxGbp: number;
  acceleration0to62: number | null;
  topSpeedMph: number | null;
}

/** Card-sized projection used by search results. */
export interface VehicleSummary
  extends Pick<
    Vehicle,
    | "id" | "slug" | "isDemo" | "make" | "model" | "derivative" | "year" | "registrationYearLabel"
    | "mileage" | "price" | "previousPrice" | "fuelType" | "transmission" | "bodyType" | "sellerType"
    | "location" | "featured" | "listedAt" | "dealershipId" | "enginePowerBhp" | "writeOffCategory" | "ulezCompliant"
  > {
  image: VehicleImage;
  imageCount: number;
  dealershipName: string | null;
  distanceMiles: number | null;
  monthlyFinance: number | null;
  priceAssessment: PriceAssessment | null;
}
