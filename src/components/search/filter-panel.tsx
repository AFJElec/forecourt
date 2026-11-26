"use client";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Chip, Input, Label, Select } from "@/components/ui/field";
import { bodyLabels, formatNumber, formatPrice, fuelLabels } from "@/lib/format";
import { isValidPostcode, normalisePostcode } from "@/lib/geo/postcodes";
import type { Facets } from "@/lib/search/engine";
import { activeFilterCount, bodyValues, fuelValues, toQueryString, type SearchFilters } from "@/lib/search/schema";
import { cn } from "@/lib/utils";
import type { Manufacturer, VehicleModel } from "@/types/vehicle";

export interface FilterOptions {
  makes: Manufacturer[];
  models: VehicleModel[];
  equipment: { slug: string; name: string; category: string }[];
  colours: string[];
}

const PRICES = [1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 75000, 100000];
const YEARS = Array.from({ length: 2026 - 2005 + 1 }, (_, i) => 2026 - i);
const MILEAGES = [5000, 10000, 20000, 30000, 40000, 50000, 60000, 80000, 100000, 125000];
const ENGINES = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.5, 3.0, 4.0];
const POWERS = [70, 100, 130, 160, 200, 250, 300, 400];

function Group({ title, children, open = true, count }: { title: string; children: ReactNode; open?: boolean; count?: number }) {
  return (
    <details open={open} className="group border-b border-mist-200 py-4 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
        <span>{title}{count ? <span className="ml-2 rounded-full bg-electric-500 px-1.5 text-[11px] text-white">{count}</span> : null}</span>
        <span className="text-muted transition-transform group-open:rotate-45 text-xl leading-none">+</span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function FilterPanel({ filters, options, facets, className, onNavigate }: {
  filters: SearchFilters; options: FilterOptions; facets: Facets; className?: string; onNavigate?: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [postcode, setPostcode] = useState(filters.postcode ?? "");
  const [derivative, setDerivative] = useState(filters.derivative ?? "");
  useEffect(() => { setPostcode(filters.postcode ?? ""); setDerivative(filters.derivative ?? ""); }, [filters.postcode, filters.derivative]);

  const apply = (patch: Partial<SearchFilters>) => {
    const qs = toQueryString({ ...filters, ...patch, page: undefined });
    startTransition(() => router.push(`/used-cars${qs ? `?${qs}` : ""}`, { scroll: false }));
    onNavigate?.();
  };
  const num = (v: string) => (v === "" ? undefined : Number(v));
  const toggleIn = <T extends string>(arr: T[] | undefined, v: T): T[] | undefined => {
    const set = new Set(arr ?? []);
    if (set.has(v)) set.delete(v); else set.add(v);
    return set.size ? [...set] : undefined;
  };

  const make = options.makes.find((m) => m.slug === filters.make);
  const models = options.models.filter((m) => m.manufacturerId === make?.id);
  const pcValid = !postcode || isValidPostcode(postcode);

  return (
    <div className={cn("text-sm", className)}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-lg font-bold">Filters</h2>
        {activeFilterCount(filters) > 0 && (
          <button onClick={() => apply({ ...Object.fromEntries(Object.keys(filters).map((k) => [k, undefined])), sort: filters.sort, view: filters.view })}
            className="flex items-center gap-1 text-sm font-semibold text-electric-600 hover:underline">
            <RotateCcw className="size-3.5" /> Clear all
          </button>
        )}
      </div>

      <Group title="Make & model" count={[filters.make, filters.model, filters.derivative].filter(Boolean).length}>
        <div>
          <Label htmlFor="f-make">Make</Label>
          <Select id="f-make" value={filters.make ?? ""} onChange={(e) => apply({ make: e.target.value || undefined, model: undefined })}>
            <option value="">Any make</option>
            {options.makes.map((m) => <option key={m.slug} value={m.slug}>{m.name}{facets.make[m.slug] ? ` (${facets.make[m.slug]})` : " (0)"}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-model">Model</Label>
          <Select id="f-model" value={filters.model ?? ""} disabled={!make} onChange={(e) => apply({ model: e.target.value || undefined })}>
            <option value="">{make ? "Any model" : "Select a make first"}</option>
            {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
          </Select>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); apply({ derivative: derivative.trim() || undefined }); }}>
          <Label htmlFor="f-deriv">Derivative / trim contains</Label>
          <Input id="f-deriv" value={derivative} onChange={(e) => setDerivative(e.target.value)} onBlur={() => derivative !== (filters.derivative ?? "") && apply({ derivative: derivative.trim() || undefined })} placeholder="e.g. M Sport, GTI" />
        </form>
      </Group>

      <Group title="Price" count={[filters.priceMin, filters.priceMax, filters.monthlyMax].filter((x) => x != null).length}>
        <Pair>
          <Select aria-label="Minimum price" value={filters.priceMin ?? ""} onChange={(e) => apply({ priceMin: num(e.target.value) })}>
            <option value="">Min</option>{PRICES.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
          </Select>
          <Select aria-label="Maximum price" value={filters.priceMax ?? ""} onChange={(e) => apply({ priceMax: num(e.target.value) })}>
            <option value="">Max</option>{PRICES.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
          </Select>
        </Pair>
        <div>
          <Label htmlFor="f-monthly">Monthly budget (illustrative)</Label>
          <Select id="f-monthly" value={filters.monthlyMax ?? ""} onChange={(e) => apply({ monthlyMax: num(e.target.value) })}>
            <option value="">Any</option>{[100, 150, 200, 250, 300, 400, 500, 750, 1000].map((p) => <option key={p} value={p}>Up to {formatPrice(p)}/mo</option>)}
          </Select>
        </div>
      </Group>

      <Group title="Location" count={filters.postcode ? 1 : 0}>
        <form className="grid grid-cols-[1fr_7rem] gap-2" onSubmit={(e) => { e.preventDefault(); if (pcValid) apply({ postcode: postcode ? normalisePostcode(postcode) : undefined, radius: postcode ? filters.radius ?? 50 : undefined }); }}>
          <Input aria-label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" className="uppercase" aria-invalid={!pcValid}
            onBlur={() => pcValid && normalisePostcode(postcode) !== (filters.postcode ?? "") && apply({ postcode: postcode ? normalisePostcode(postcode) : undefined, radius: postcode ? filters.radius ?? 50 : undefined })} />
          <Select aria-label="Distance" value={filters.radius ?? 50} disabled={!filters.postcode} onChange={(e) => apply({ radius: num(e.target.value) })}>
            {[5, 10, 25, 50, 100, 200].map((r) => <option key={r} value={r}>{r} miles</option>)}<option value={1000}>National</option>
          </Select>
        </form>
        {!pcValid && <p className="text-danger-600">Enter a valid UK postcode</p>}
      </Group>

      <Group title="Year" count={[filters.yearMin, filters.yearMax].filter((x) => x != null).length}>
        <Pair>
          <Select aria-label="Year from" value={filters.yearMin ?? ""} onChange={(e) => apply({ yearMin: num(e.target.value) })}><option value="">From</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</Select>
          <Select aria-label="Year to" value={filters.yearMax ?? ""} onChange={(e) => apply({ yearMax: num(e.target.value) })}><option value="">To</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</Select>
        </Pair>
      </Group>

      <Group title="Mileage" count={filters.mileageMax ? 1 : 0}>
        <Select aria-label="Maximum mileage" value={filters.mileageMax ?? ""} onChange={(e) => apply({ mileageMax: num(e.target.value) })}>
          <option value="">Any mileage</option>{MILEAGES.map((m) => <option key={m} value={m}>Up to {formatNumber(m)} miles</option>)}
        </Select>
      </Group>

      <Group title="Fuel type" count={filters.fuel?.length}>
        <div className="flex flex-wrap gap-2">
          {fuelValues.map((f) => (
            <Chip key={f} active={filters.fuel?.includes(f)} onClick={() => apply({ fuel: toggleIn(filters.fuel, f) })} disabled={!facets.fuel[f] && !filters.fuel?.includes(f)}>
              {fuelLabels[f]} <span className="text-muted">{facets.fuel[f] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Body type" count={filters.body?.length}>
        <div className="flex flex-wrap gap-2">
          {bodyValues.map((b) => (
            <Chip key={b} active={filters.body?.includes(b)} onClick={() => apply({ body: toggleIn(filters.body, b) })} disabled={!facets.body[b] && !filters.body?.includes(b)}>
              {bodyLabels[b]} <span className="text-muted">{facets.body[b] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Gearbox" count={filters.transmission ? 1 : 0}>
        <div className="flex flex-wrap gap-2">
          {(["manual", "automatic"] as const).map((t) => (
            <Chip key={t} active={filters.transmission === t} onClick={() => apply({ transmission: filters.transmission === t ? undefined : t })}>
              {t === "manual" ? "Manual" : "Automatic"} <span className="text-muted">{facets.transmission[t] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Seller" count={filters.seller ? 1 : 0}>
        <div className="flex flex-wrap gap-2">
          {(["trade", "private"] as const).map((s) => (
            <Chip key={s} active={filters.seller === s} onClick={() => apply({ seller: filters.seller === s ? undefined : s })}>
              {s === "trade" ? "Dealer" : "Private"} <span className="text-muted">{facets.seller[s] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Engine" open={false} count={[filters.engineMin, filters.engineMax, filters.powerMin, filters.powerMax].filter((x) => x != null).length}>
        <Label>Engine size</Label>
        <Pair>
          <Select aria-label="Engine size from" value={filters.engineMin ?? ""} onChange={(e) => apply({ engineMin: num(e.target.value) })}><option value="">Min</option>{ENGINES.map((x) => <option key={x} value={x}>{x.toFixed(1)}L</option>)}</Select>
          <Select aria-label="Engine size to" value={filters.engineMax ?? ""} onChange={(e) => apply({ engineMax: num(e.target.value) })}><option value="">Max</option>{ENGINES.map((x) => <option key={x} value={x}>{x.toFixed(1)}L</option>)}</Select>
        </Pair>
        <Label>Power</Label>
        <Pair>
          <Select aria-label="Power from" value={filters.powerMin ?? ""} onChange={(e) => apply({ powerMin: num(e.target.value) })}><option value="">Min</option>{POWERS.map((x) => <option key={x} value={x}>{x} bhp</option>)}</Select>
          <Select aria-label="Power to" value={filters.powerMax ?? ""} onChange={(e) => apply({ powerMax: num(e.target.value) })}><option value="">Max</option>{POWERS.map((x) => <option key={x} value={x}>{x} bhp</option>)}</Select>
        </Pair>
      </Group>

      <Group title="Colour" open={false} count={filters.colour?.length}>
        <div className="flex flex-wrap gap-2">
          {options.colours.map((c) => (
            <Chip key={c} active={filters.colour?.includes(c)} onClick={() => apply({ colour: toggleIn(filters.colour, c) })} className="capitalize">{c}</Chip>
          ))}
        </div>
      </Group>

      <Group title="Doors & seats" open={false} count={[filters.doors, filters.seatsMin].filter((x) => x != null).length}>
        <Pair>
          <Select aria-label="Doors" value={filters.doors ?? ""} onChange={(e) => apply({ doors: num(e.target.value) })}><option value="">Any doors</option>{[2, 3, 4, 5].map((d) => <option key={d} value={d}>{d} doors</option>)}</Select>
          <Select aria-label="Minimum seats" value={filters.seatsMin ?? ""} onChange={(e) => apply({ seatsMin: num(e.target.value) })}><option value="">Any seats</option>{[2, 4, 5, 7].map((d) => <option key={d} value={d}>{d}+ seats</option>)}</Select>
        </Pair>
      </Group>

      <Group title="Running costs" open={false} count={[filters.ulez, filters.insuranceMax].filter((x) => x != null).length}>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-mist-300 px-3.5 py-3">
          <span><span className="font-semibold text-ink-900">ULEZ compliant only</span><br /><span className="text-xs text-muted">Based on Euro emissions standard</span></span>
          <input type="checkbox" className="size-5 accent-electric-500" checked={!!filters.ulez} onChange={(e) => apply({ ulez: e.target.checked || undefined })} />
        </label>
        <Select aria-label="Maximum insurance group" value={filters.insuranceMax ?? ""} onChange={(e) => apply({ insuranceMax: num(e.target.value) })}>
          <option value="">Any insurance group</option>{[5, 10, 15, 20, 25, 30, 40].map((g) => <option key={g} value={g}>Group {g} or lower</option>)}
        </Select>
      </Group>

      <Group title="History & condition" open={false} count={[filters.serviceHistory, filters.condition, filters.writeOff].filter(Boolean).length}>
        <Select aria-label="Service history" value={filters.serviceHistory ?? ""} onChange={(e) => apply({ serviceHistory: (e.target.value || undefined) as SearchFilters["serviceHistory"] })}>
          <option value="">Any service history</option><option value="full">Full service history</option><option value="partial">Part service history</option><option value="none">No service history</option>
        </Select>
        <Select aria-label="Condition" value={filters.condition ?? ""} onChange={(e) => apply({ condition: (e.target.value || undefined) as SearchFilters["condition"] })}>
          <option value="">Any condition</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option>
        </Select>
        <Select aria-label="Write-off category" value={filters.writeOff ?? "include"} onChange={(e) => apply({ writeOff: e.target.value === "include" ? undefined : (e.target.value as SearchFilters["writeOff"]) })}>
          <option value="include">Include Cat S/N (disclosed)</option><option value="exclude">Exclude Cat S/N</option><option value="only">Only Cat S/N</option>
        </Select>
      </Group>

      <Group title="Equipment" open={false} count={filters.equipment?.length}>
        <div className="grid grid-cols-1 gap-1.5">
          {options.equipment.map((e) => (
            <label key={e.slug} className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-mist-100">
              <input type="checkbox" className="size-4 accent-electric-500" checked={!!filters.equipment?.includes(e.slug)} onChange={() => apply({ equipment: toggleIn(filters.equipment, e.slug) })} />
              {e.name}
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}
