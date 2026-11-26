import { X } from "lucide-react";
import Link from "next/link";
import { bodyLabels, formatNumber, formatPrice, fuelLabels } from "@/lib/format";
import { toQueryString, type SearchFilters } from "@/lib/search/schema";
import type { BodyType, FuelType } from "@/types/vehicle";

type Pill = { label: string; patch: Partial<SearchFilters> };

export function ActiveFilters({ filters, makeName, modelName }: { filters: SearchFilters; makeName?: string; modelName?: string }) {
  const f = filters;
  const pills: Pill[] = [];
  if (f.q) pills.push({ label: `“${f.q}”`, patch: { q: undefined } });
  if (f.make) pills.push({ label: makeName ?? f.make, patch: { make: undefined, model: undefined } });
  if (f.model) pills.push({ label: modelName ?? f.model, patch: { model: undefined } });
  if (f.derivative) pills.push({ label: `Trim: ${f.derivative}`, patch: { derivative: undefined } });
  if (f.priceMin != null) pills.push({ label: `From ${formatPrice(f.priceMin)}`, patch: { priceMin: undefined } });
  if (f.priceMax != null) pills.push({ label: `Up to ${formatPrice(f.priceMax)}`, patch: { priceMax: undefined } });
  if (f.monthlyMax != null) pills.push({ label: `≤ ${formatPrice(f.monthlyMax)}/mo`, patch: { monthlyMax: undefined } });
  if (f.postcode) pills.push({ label: `Within ${f.radius ?? 50} mi of ${f.postcode}`, patch: { postcode: undefined, radius: undefined } });
  if (f.yearMin) pills.push({ label: `${f.yearMin} or newer`, patch: { yearMin: undefined } });
  if (f.yearMax) pills.push({ label: `${f.yearMax} or older`, patch: { yearMax: undefined } });
  if (f.mileageMax) pills.push({ label: `≤ ${formatNumber(f.mileageMax)} miles`, patch: { mileageMax: undefined } });
  f.fuel?.forEach((x) => pills.push({ label: fuelLabels[x as FuelType], patch: { fuel: f.fuel!.filter((y) => y !== x) } }));
  f.body?.forEach((x) => pills.push({ label: bodyLabels[x as BodyType], patch: { body: f.body!.filter((y) => y !== x) } }));
  f.colour?.forEach((x) => pills.push({ label: x[0]!.toUpperCase() + x.slice(1), patch: { colour: f.colour!.filter((y) => y !== x) } }));
  if (f.transmission) pills.push({ label: f.transmission === "manual" ? "Manual" : "Automatic", patch: { transmission: undefined } });
  if (f.engineMin) pills.push({ label: `≥ ${f.engineMin}L`, patch: { engineMin: undefined } });
  if (f.engineMax) pills.push({ label: `≤ ${f.engineMax}L`, patch: { engineMax: undefined } });
  if (f.powerMin) pills.push({ label: `≥ ${f.powerMin} bhp`, patch: { powerMin: undefined } });
  if (f.powerMax) pills.push({ label: `≤ ${f.powerMax} bhp`, patch: { powerMax: undefined } });
  if (f.doors) pills.push({ label: `${f.doors} doors`, patch: { doors: undefined } });
  if (f.seatsMin) pills.push({ label: `${f.seatsMin}+ seats`, patch: { seatsMin: undefined } });
  if (f.ulez) pills.push({ label: "ULEZ compliant", patch: { ulez: undefined } });
  if (f.insuranceMax) pills.push({ label: `Insurance ≤ ${f.insuranceMax}`, patch: { insuranceMax: undefined } });
  if (f.seller) pills.push({ label: f.seller === "trade" ? "Dealer" : "Private seller", patch: { seller: undefined } });
  if (f.serviceHistory) pills.push({ label: `${f.serviceHistory} service history`, patch: { serviceHistory: undefined } });
  if (f.condition) pills.push({ label: `${f.condition} condition`, patch: { condition: undefined } });
  if (f.writeOff) pills.push({ label: f.writeOff === "exclude" ? "No Cat S/N" : "Cat S/N only", patch: { writeOff: undefined } });
  f.equipment?.forEach((x) => pills.push({ label: x.replace(/-/g, " "), patch: { equipment: f.equipment!.filter((y) => y !== x) } }));
  if (!pills.length) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {pills.map((p) => {
        const qs = toQueryString({ ...f, ...p.patch, page: undefined });
        return (
          <li key={p.label}>
            <Link href={`/used-cars${qs ? `?${qs}` : ""}`} scroll={false}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-900 pl-3 pr-2 text-[13px] font-medium capitalize text-white transition-colors hover:bg-ink-700">
              {p.label}<X className="size-3.5 opacity-70" /><span className="sr-only">Remove filter</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
