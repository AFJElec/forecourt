import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { siteUrl } from "@/config/site";
import { formatNumber, formatPrice } from "@/lib/format";
import { loadVehicle } from "@/lib/pages/loaders";
import { vehicleJsonLd } from "@/lib/seo/structured-data";
import { VehicleView } from "@/views/vehicle-view";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const data = await loadVehicle((await params).slug);
  if (!data) return { title: "Vehicle not found" };
  const v = data.vehicle;
  const title = `${v.year} ${v.make} ${v.model} ${v.derivative} — ${formatPrice(v.price)}`;
  return {
    title,
    description: `${v.make} ${v.model} ${v.derivative}, ${formatNumber(v.mileage)} miles, ${v.registrationYearLabel}, in ${v.location.town}. View photos, spec and contact the seller on ${brand.name}.`,
    alternates: { canonical: `/vehicle/${v.slug}` },
    openGraph: { title, images: [{ url: v.images[0]!.src, width: 1200, height: 900, alt: v.images[0]!.alt }] },
    robots: v.isDemo ? { index: false, follow: false } : undefined,
  };
}

export default async function VehiclePage({ params }: P) {
  const data = await loadVehicle((await params).slug);
  if (!data || data.vehicle.status === "removed") notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(data.vehicle, data.dealer, siteUrl)).replace(/</g, "\\u003c") }} />
      <VehicleView data={data} />
    </>
  );
}
