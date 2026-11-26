import { brand } from "@/config/brand";
import type { Dealership, Vehicle } from "@/types/vehicle";

/** schema.org Car + Offer (Google vehicle listing structured data). */
export function vehicleJsonLd(v: Vehicle, dealer: Dealership | null, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${v.make} ${v.model} ${v.derivative}`,
    brand: { "@type": "Brand", name: v.make },
    model: v.model,
    vehicleConfiguration: v.derivative,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: "SMI" },
    fuelType: v.fuelType,
    vehicleTransmission: v.transmission,
    bodyType: v.bodyType,
    color: v.colour,
    numberOfDoors: v.doors,
    seatingCapacity: v.seats,
    numberOfPreviousOwners: v.owners,
    itemCondition: "https://schema.org/UsedCondition",
    image: v.images.map((i) => new URL(i.src, siteUrl).toString()),
    url: `${siteUrl}/vehicle/${v.slug}`,
    offers: {
      "@type": "Offer",
      price: v.price,
      priceCurrency: "GBP",
      availability: v.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: dealer
        ? { "@type": "AutoDealer", name: dealer.name, address: { "@type": "PostalAddress", addressLocality: dealer.location.town, postalCode: dealer.location.postcode, addressCountry: "GB" } }
        : { "@type": "Person", name: "Private seller" },
    },
    provider: { "@type": "Organization", name: brand.name },
  };
}
