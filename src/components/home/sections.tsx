import { ArrowRight, BadgeCheck, BatteryCharging, Calculator, Camera, Leaf, Plug, ShieldCheck, Star, Tag, Zap } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { BodyIcon } from "@/components/vehicle/body-icon";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { bodyLabels, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BodyType, Dealership, Manufacturer, VehicleSummary } from "@/types/vehicle";

export function SectionHeader({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-electric-600 hover:text-electric-700">
          {linkLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Horizontal scroll rail on mobile, grid on desktop. */
export function VehicleRail({ items, eyebrow, title, href }: { items: VehicleSummary[]; eyebrow?: string; title: string; href?: string }) {
  if (!items.length) return null;
  return (
    <section className="container-page mt-16">
      <SectionHeader eyebrow={eyebrow} title={title} href={href} />
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {items.slice(0, 8).map((v, i) => (
          <div key={v.id} className={cn("w-[82%] shrink-0 snap-start sm:w-auto", i >= 4 && "lg:hidden")}>
            <VehicleCard v={v} layout="rail" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function BrowseByBody({ counts }: { counts: Record<string, number> }) {
  const types: BodyType[] = ["suv", "hatchback", "saloon", "estate", "coupe", "convertible", "mpv", "pickup"];
  return (
    <section className="container-page mt-16">
      <SectionHeader eyebrow="Browse" title="Find your body style" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {types.map((t) => (
          <Link key={t} href={`/used-cars?body=${t}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-mist-200 bg-white px-3 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-electric-400 hover:shadow-[var(--shadow-card)]">
            <BodyIcon type={t} className="h-9 text-ink-700 transition-colors group-hover:text-electric-600" />
            <span className="text-sm font-semibold text-ink-900">{bodyLabels[t]}</span>
            <span className="text-xs text-muted">{formatNumber(counts[t] ?? 0)} cars</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PopularMakes({ makes, counts }: { makes: Manufacturer[]; counts: Record<string, number> }) {
  const list = [...makes].sort((a, b) => Number(b.popular) - Number(a.popular) || (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0)).slice(0, 12);
  return (
    <section className="container-page mt-16">
      <SectionHeader eyebrow="Manufacturers" title="Popular makes" href="/used-cars" linkLabel="All makes" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {list.map((m) => (
          <Link key={m.slug} href={`/used-cars/${m.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-mist-200 bg-white p-3 transition-all hover:border-electric-400 hover:shadow-[var(--shadow-card)] sm:p-4">
            {/* Monogram tiles: manufacturer logos are trademarks — licensed assets can be dropped in via manufacturers.logo_url */}
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white transition-colors group-hover:bg-electric-500">
              {m.name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-900">{m.name}</span>
              <span className="block text-xs text-muted">{formatNumber(counts[m.slug] ?? 0)} for sale</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ElectricBanner({ evCount, hybridCount }: { evCount: number; hybridCount: number }) {
  return (
    <section className="container-page mt-16">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink-900 via-ink-800 to-[#0b3a6b] p-8 text-white sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-electric-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-10 hidden text-white/10 lg:block"><Zap className="size-64" strokeWidth={1} /></div>
        <div className="relative max-w-xl">
          <p className="eyebrow !text-electric-200">Electric & hybrid</p>
          <h2 className="mt-2 text-3xl font-bold !text-white sm:text-4xl">Go electric for less</h2>
          <p className="mt-3 text-white/75">Browse used EVs with verified range figures, plus self-charging and plug-in hybrids — all ULEZ compliant.</p>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { href: "/used-cars?fuel=electric", icon: BatteryCharging, label: "Electric", n: evCount },
              { href: "/used-cars?fuel=hybrid,plug_in_hybrid", icon: Plug, label: "Hybrid & PHEV", n: hybridCount },
              { href: "/used-cars?ulez=true", icon: Leaf, label: "ULEZ compliant", n: null },
            ].map(({ href, icon: Icon, label, n }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15">
                <Icon className="size-6 text-electric-200" />
                <span>
                  <span className="block font-semibold">{label}</span>
                  {n != null && <span className="text-xs text-white/60">{formatNumber(n)} available</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedDealers({ dealers }: { dealers: Dealership[] }) {
  return (
    <section className="container-page mt-16">
      <SectionHeader eyebrow="Trusted sellers" title="Featured dealerships" href="/dealers" linkLabel="Find a dealer" />
      <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 xl:grid-cols-5">
        {dealers.slice(0, 5).map((d) => (
          <Link key={d.id} href={`/dealers/${d.slug}`}
            className="w-64 shrink-0 rounded-2xl border border-mist-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:w-auto">
            <span className="flex size-12 items-center justify-center rounded-xl text-base font-bold text-white" style={{ background: d.logoColor }}>{d.logoInitials}</span>
            <h3 className="mt-4 text-[15px] font-bold leading-snug">{d.name}</h3>
            <p className="mt-0.5 text-sm text-muted">{d.location.town}</p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              {d.rating && (
                <span className="flex items-center gap-1 font-semibold text-ink-900"><Star className="size-4 fill-[#f5b301] text-[#f5b301]" />{d.rating.toFixed(1)}<span className="font-normal text-muted">({d.reviewCount})</span></span>
              )}
              {d.verified && <span className="flex items-center gap-1 text-xs font-semibold text-success-600"><BadgeCheck className="size-4" />Verified</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Promo({ icon, eyebrow, title, body, cta, href, note, dark }: { icon: ReactNode; eyebrow: string; title: string; body: string; cta: string; href: string; note?: string; dark?: boolean }) {
  return (
    <div className={cn("relative flex flex-col overflow-hidden rounded-[28px] p-8 sm:p-10", dark ? "bg-ink-900 text-white" : "bg-electric-50")}>
      <span className={cn("flex size-12 items-center justify-center rounded-2xl", dark ? "bg-electric-500 text-white" : "bg-white text-electric-600 shadow-sm")}>{icon}</span>
      <p className={cn("eyebrow mt-6", dark && "!text-electric-200")}>{eyebrow}</p>
      <h2 className={cn("mt-1.5 text-2xl font-bold sm:text-3xl", dark && "!text-white")}>{title}</h2>
      <p className={cn("mt-3 max-w-md leading-relaxed", dark ? "text-white/70" : "text-slate-ink")}>{body}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
        <Link href={href} className={buttonVariants({ variant: dark ? "primary" : "secondary", size: "lg" })}>{cta} <ArrowRight /></Link>
        {note && <span className={cn("text-xs", dark ? "text-white/50" : "text-muted")}>{note}</span>}
      </div>
    </div>
  );
}

export function SellAndValue() {
  return (
    <section className="container-page mt-16 grid gap-5 lg:grid-cols-2">
      <Promo dark icon={<Tag className="size-6" />} eyebrow="Sell your vehicle" title="Reach buyers across the UK"
        body="Enter your registration, add photos and publish in minutes. Free basic adverts, with optional upgrades to stand out." cta="Start your advert" href="/sell" note="Launching in build phase 3" />
      <Promo icon={<Calculator className="size-6" />} eyebrow="Vehicle valuation" title="What's your car worth?"
        body="Get private sale, part-exchange and dealer retail estimates based on live market data." cta="Value my car" href="/valuation" note="Requires authorised market-data provider" />
    </section>
  );
}

export function TrustStrip() {
  const items = [
    { icon: ShieldCheck, t: "Checked sellers", d: "Trade sellers verified before listing" },
    { icon: Camera, t: "Real photos", d: "Up to 40 images & video per advert" },
    { icon: Tag, t: "Honest pricing", d: "Price insight only with enough market data" },
    { icon: BadgeCheck, t: "Clear disclosures", d: "Category S/N and trade vs private labelled" },
  ];
  return (
    <section className="border-y border-mist-200 bg-white">
      <div className="container-page grid grid-cols-2 gap-6 py-7 lg:grid-cols-4">
        {items.map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-3">
            <Icon className="mt-0.5 size-6 shrink-0 text-electric-500" />
            <div><p className="text-sm font-semibold text-ink-900">{t}</p><p className="text-xs leading-relaxed text-muted">{d}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
