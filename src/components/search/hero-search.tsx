"use client";
import { Loader2, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { formatNumber, formatPrice } from "@/lib/format";
import { isValidPostcode, normalisePostcode } from "@/lib/geo/postcodes";
import { fetchCount } from "@/lib/search/client";
import { toQueryString, type SearchFilters } from "@/lib/search/schema";
import { cn } from "@/lib/utils";
import type { Manufacturer, VehicleModel } from "@/types/vehicle";

const PRICE_STEPS = [1000, 2000, 3000, 5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const MONTHLY_STEPS = [100, 150, 200, 250, 300, 400, 500, 750, 1000];
const RADII = [10, 25, 50, 100, 200];

export function HeroSearch({ makes, models, initialTotal }: { makes: (Manufacturer & { count?: number })[]; models: VehicleModel[]; initialTotal: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"cash" | "monthly">("cash");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [monthly, setMonthly] = useState("");
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("50");
  const [count, setCount] = useState<number | null>(initialTotal);
  const [loading, setLoading] = useState(false);

  const makeObj = makes.find((m) => m.slug === make);
  const makeModels = useMemo(() => models.filter((m) => m.manufacturerId === makeObj?.id), [models, makeObj]);
  const pcValid = postcode.trim() === "" || isValidPostcode(postcode);

  const filters: SearchFilters = useMemo(() => ({
    make: make || undefined,
    model: model || undefined,
    ...(mode === "cash" ? { priceMin: min ? Number(min) : undefined, priceMax: max ? Number(max) : undefined } : { monthlyMax: monthly ? Number(monthly) : undefined }),
    postcode: postcode && pcValid ? normalisePostcode(postcode) : undefined,
    radius: postcode && pcValid ? Number(radius) : undefined,
  }), [make, model, mode, min, max, monthly, postcode, radius, pcValid]);
  const qs = toQueryString(filters);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetchCount(qs, ctrl.signal).then(setCount).catch(() => {}).finally(() => setLoading(false));
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [qs]);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (pcValid) router.push(`/used-cars${qs ? `?${qs}` : ""}`); }}
      className="rounded-[22px] bg-white p-4 shadow-[var(--shadow-float)] ring-1 ring-black/5 sm:p-6"
      aria-label="Search used cars"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-mist-100 p-1 text-sm font-semibold" role="tablist" aria-label="Price type">
          {(["cash", "monthly"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={cn("rounded-full px-4 py-1.5 transition-all", mode === m ? "bg-white text-ink-900 shadow-sm" : "text-muted hover:text-ink-900")}>
              {m === "cash" ? "Total price" : "Monthly budget"}
            </button>
          ))}
        </div>
        <span className="hidden text-xs text-muted sm:inline">UK-wide · {formatNumber(initialTotal)} vehicles</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Label htmlFor="hs-make">Make</Label>
          <Select id="hs-make" value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}>
            <option value="">Any make</option>
            {makes.map((m) => <option key={m.slug} value={m.slug}>{m.name}{m.count ? ` (${m.count})` : ""}</option>)}
          </Select>
        </div>
        <div className="lg:col-span-3">
          <Label htmlFor="hs-model">Model</Label>
          <Select id="hs-model" value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
            <option value="">{make ? "Any model" : "Select make first"}</option>
            {makeModels.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
          </Select>
        </div>
        {mode === "cash" ? (
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3">
            <div>
              <Label htmlFor="hs-min">Min price</Label>
              <Select id="hs-min" value={min} onChange={(e) => setMin(e.target.value)}>
                <option value="">No min</option>
                {PRICE_STEPS.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="hs-max">Max price</Label>
              <Select id="hs-max" value={max} onChange={(e) => setMax(e.target.value)}>
                <option value="">No max</option>
                {PRICE_STEPS.filter((p) => !min || p > Number(min)).map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
              </Select>
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="hs-monthly">Max monthly</Label>
            <Select id="hs-monthly" value={monthly} onChange={(e) => setMonthly(e.target.value)}>
              <option value="">Any monthly amount</option>
              {MONTHLY_STEPS.map((p) => <option key={p} value={p}>{formatPrice(p)} per month</option>)}
            </Select>
          </div>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-3 sm:col-span-2 lg:col-span-3">
          <div>
            <Label htmlFor="hs-pc">Postcode</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input id="hs-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. CF10 1AA" autoComplete="postal-code"
                className={cn("pl-9 uppercase", !pcValid && "border-danger-600 focus:ring-danger-600/15")} aria-invalid={!pcValid} aria-describedby={!pcValid ? "hs-pc-err" : undefined} />
            </div>
          </div>
          <div className="w-28">
            <Label htmlFor="hs-radius">Distance</Label>
            <Select id="hs-radius" value={radius} onChange={(e) => setRadius(e.target.value)} disabled={!postcode}>
              {RADII.map((r) => <option key={r} value={r}>{r} miles</option>)}
              <option value="1000">National</option>
            </Select>
          </div>
        </div>
      </div>
      {!pcValid && <p id="hs-pc-err" className="mt-2 text-sm text-danger-600">Enter a valid UK postcode, e.g. SW1A 1AA</p>}
      {mode === "monthly" && (
        <p className="mt-3 text-xs text-muted">Monthly figures are illustrative estimates to help you budget (10% deposit, 48 months, 9.9% APR) — not a finance offer.</p>
      )}

      <Button type="submit" size="lg" className="mt-5 w-full text-[17px]" disabled={!pcValid}>
        {loading ? <Loader2 className="animate-spin" /> : <Search />}
        {count == null ? "Search vehicles" : count === 0 ? "No matching vehicles" : `Search ${formatNumber(count)} vehicle${count === 1 ? "" : "s"}`}
      </Button>
    </form>
  );
}
