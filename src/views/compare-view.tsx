"use client";
import { GitCompareArrows, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { illustrativeMonthly } from "@/lib/finance/representative";
import { bodyLabels, formatNumber, formatPrice, fuelLabels, serviceHistoryLabels, transmissionLabels } from "@/lib/format";
import { fetchVehicles } from "@/lib/search/client";
import { useLocalList } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/vehicle";

type Row = { label: string; value: (v: Vehicle) => ReactNode; best?: { score: (v: Vehicle) => number | null; dir: "min" | "max" } };

const rows: { group: string; rows: Row[] }[] = [
  { group: "Price", rows: [
    { label: "Price", value: (v) => formatPrice(v.price), best: { score: (v) => v.price, dir: "min" } },
    { label: "Monthly (illustrative)", value: (v) => { const m = illustrativeMonthly(v.price); return m ? `${formatPrice(m)}/mo` : "—"; } },
  ] },
  { group: "Overview", rows: [
    { label: "Registered", value: (v) => v.registrationYearLabel, best: { score: (v) => v.year, dir: "max" } },
    { label: "Mileage", value: (v) => `${formatNumber(v.mileage)} mi`, best: { score: (v) => v.mileage, dir: "min" } },
    { label: "Fuel", value: (v) => fuelLabels[v.fuelType] },
    { label: "Gearbox", value: (v) => transmissionLabels[v.transmission] },
    { label: "Body", value: (v) => bodyLabels[v.bodyType] },
    { label: "Owners", value: (v) => v.owners, best: { score: (v) => v.owners, dir: "min" } },
    { label: "Service history", value: (v) => serviceHistoryLabels[v.serviceHistory].replace(" service history", "") },
    { label: "Write-off", value: (v) => (v.writeOffCategory === "none" ? "None declared" : `Category ${v.writeOffCategory}`) },
  ] },
  { group: "Performance", rows: [
    { label: "Engine", value: (v) => (v.engineSizeLitres ? `${v.engineSizeLitres.toFixed(1)}L` : "Electric") },
    { label: "Power", value: (v) => `${v.enginePowerBhp} bhp`, best: { score: (v) => v.enginePowerBhp, dir: "max" } },
    { label: "0–62 mph", value: (v) => (v.acceleration0to62 ? `${v.acceleration0to62}s` : "—"), best: { score: (v) => v.acceleration0to62, dir: "min" } },
  ] },
  { group: "Running costs", rows: [
    { label: "Economy / range", value: (v) => (v.fuelType === "electric" ? `${v.electricRangeMiles ?? "—"} mi range` : v.mpgCombined ? `${v.mpgCombined} mpg` : "—") },
    { label: "CO₂", value: (v) => (v.co2GPerKm != null ? `${v.co2GPerKm} g/km` : "—"), best: { score: (v) => v.co2GPerKm, dir: "min" } },
    { label: "Tax (est.)", value: (v) => `${formatPrice(v.annualTaxGbp)}/yr`, best: { score: (v) => v.annualTaxGbp, dir: "min" } },
    { label: "Insurance group", value: (v) => v.insuranceGroup, best: { score: (v) => v.insuranceGroup, dir: "min" } },
    { label: "ULEZ", value: (v) => (v.ulezCompliant ? "Compliant" : "Not compliant") },
  ] },
  { group: "Practicality", rows: [
    { label: "Doors / seats", value: (v) => `${v.doors} / ${v.seats}` },
    { label: "Equipment items", value: (v) => v.equipment.length, best: { score: (v) => v.equipment.length, dir: "max" } },
    { label: "Seller", value: (v) => `${v.sellerType === "trade" ? "Dealer" : "Private"} · ${v.location.town}` },
  ] },
];

function bestIndex(list: Vehicle[], r: Row): number | null {
  if (!r.best || list.length < 2) return null;
  const scores = list.map((v) => r.best!.score(v));
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length < 2 || new Set(valid).size === 1) return null;
  const target = r.best.dir === "min" ? Math.min(...valid) : Math.max(...valid);
  return scores.indexOf(target);
}

export function CompareView() {
  const { list, remove, limit } = useLocalList<string>("compare");
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const key = list.join(",");
  useEffect(() => { fetchVehicles(key ? key.split(",") : []).then(setVehicles); }, [key]);
  const items = (vehicles ?? []).filter((v) => list.includes(v.id));

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold">Compare vehicles</h1>
      <p className="mt-1 text-muted">Side by side, up to {limit}. Best value in each row is highlighted.</p>
      {list.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-mist-300 bg-white px-6 py-16 text-center text-muted">
          <GitCompareArrows className="size-10" />
          <h2 className="mt-4 text-xl font-bold">Nothing to compare yet</h2>
          <p className="mt-1">Tap “Compare” on a vehicle page or your saved vehicles to add it here.</p>
          <Link href="/saved" className={cn(buttonVariants(), "mt-6")}>Go to saved vehicles</Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-36 bg-white p-3" />
                {items.map((v) => (
                  <th key={v.id} className="p-3 text-left align-top font-normal">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-mist-100">
                      <Image src={v.images[0]!.src} alt={v.images[0]!.alt} fill sizes="240px" className="object-cover" />
                      <button onClick={() => remove((x) => x === v.id)} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 shadow" aria-label={`Remove ${v.make} ${v.model}`}><X className="size-4" /></button>
                    </div>
                    <Link href={`/vehicle/${v.slug}`} className="mt-2 block text-[15px] font-bold text-ink-900 hover:underline">{v.make} {v.model}</Link>
                    <span className="block truncate text-xs text-muted">{v.derivative}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => [
                <tr key={g.group}><th colSpan={items.length + 1} className="sticky left-0 bg-mist-100 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted">{g.group}</th></tr>,
                ...g.rows.map((r) => {
                  const best = bestIndex(items, r);
                  return (
                    <tr key={r.label} className="border-b border-mist-200 last:border-0">
                      <th scope="row" className="sticky left-0 z-10 bg-white p-3 text-left font-medium text-muted">{r.label}</th>
                      {items.map((v, i) => (
                        <td key={v.id} className={cn("tabular p-3 font-semibold text-ink-900", best === i && "bg-success-50 text-success-600")}>{r.value(v)}</td>
                      ))}
                    </tr>
                  );
                }),
              ])}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
