import { BadgeCheck, Clock, ExternalLink, MapPin, Phone, Star } from "lucide-react";
import Link from "next/link";
import { DemoNotice } from "@/components/common/demo-notice";
import { ContactPanel } from "@/components/vehicle/contact-panel";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import type { Dealership, VehicleSummary } from "@/types/vehicle";

export function DealerDirectoryView({ dealers, stockCounts }: { dealers: Dealership[]; stockCounts: Record<string, number> }) {
  return (
    <div className="container-page py-8">
      <p className="eyebrow">Find a dealer</p>
      <h1 className="mt-1 text-3xl font-extrabold">Dealerships across the UK</h1>
      <p className="mt-2 max-w-2xl text-muted">Browse verified dealers, read reviews and see their full stock.</p>
      <DemoNotice className="mt-5" compact />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dealers.map((d) => (
          <Link key={d.id} href={`/dealers/${d.slug}`} className="group rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl text-base font-bold text-white" style={{ background: d.logoColor }}>{d.logoInitials}</span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold group-hover:text-electric-600">{d.name}</h2>
                <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" />{d.location.town}, {d.location.county}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-ink">{d.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm">
              {d.rating && <span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-[#f5b301] text-[#f5b301]" />{d.rating.toFixed(1)}<span className="font-normal text-muted">({d.reviewCount})</span></span>}
              <span className="text-muted">{stockCounts[d.id] ?? 0} vehicles</span>
              {d.verified && <BadgeCheck className="ml-auto size-5 text-success-600" aria-label="Verified" />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DealerProfileView({ dealer: d, stock }: { dealer: Dealership; stock: VehicleSummary[] }) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" });
  return (
    <div className="pb-10">
      <div className="h-36 bg-gradient-to-r from-ink-900 to-ink-700 sm:h-48" style={{ backgroundImage: `linear-gradient(120deg, #0b1222 30%, ${d.logoColor})` }} />
      <div className="container-page -mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex items-end gap-4">
            <span className="flex size-24 items-center justify-center rounded-3xl border-4 border-canvas text-2xl font-bold text-white shadow-lg" style={{ background: d.logoColor }}>{d.logoInitials}</span>
            <div className="pb-1">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{d.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                {d.rating && <a href="#reviews" className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-[#f5b301] text-[#f5b301]" />{d.rating.toFixed(1)} <span className="font-normal text-muted underline">{d.reviewCount} reviews</span></a>}
                {d.verified && <span className="flex items-center gap-1 font-semibold text-success-600"><BadgeCheck className="size-4" />Verified dealer</span>}
              </div>
            </div>
          </div>
          <DemoNotice className="mt-6" compact />
          <p className="mt-6 max-w-3xl leading-relaxed">{d.description}</p>

          <h2 className="mt-10 text-xl font-bold">Available stock <span className="text-muted">({stock.length})</span></h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stock.map((v) => <VehicleCard key={v.id} v={v} />)}
          </div>

          <section id="reviews" className="mt-12 scroll-mt-20">
            <h2 className="text-xl font-bold">Customer reviews</h2>
            <div className="mt-4 flex items-center gap-6 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
              <div><p className="text-5xl font-extrabold text-ink-900">{d.rating?.toFixed(1) ?? "–"}</p><p className="text-sm text-muted">{d.reviewCount} reviews</p></div>
              <p className="text-sm text-muted">Individual reviews, verified-purchase badges and dealer responses are stored in the <code>reviews</code> table and will be displayed here once accounts launch (build phase 2). Demo ratings are illustrative.</p>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:pt-16">
          <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70">
            <h2 className="font-bold">Contact & location</h2>
            <p className="mt-3 flex items-start gap-2 text-sm"><MapPin className="mt-0.5 size-4 text-muted" />{d.location.town}, {d.location.county}, {d.location.postcode}</p>
            <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="mt-2 flex items-center gap-2 text-sm font-semibold text-electric-600"><Phone className="size-4" />{d.phone}</a>
            {d.website ? <a href={d.website} rel="noopener nofollow" target="_blank" className="mt-2 flex items-center gap-2 text-sm font-semibold text-electric-600"><ExternalLink className="size-4" />Visit website</a> : <p className="mt-2 text-sm text-muted">No website listed</p>}
            <h3 className="mt-5 flex items-center gap-2 text-sm font-bold"><Clock className="size-4" />Opening hours</h3>
            <dl className="mt-2 space-y-1 text-sm">
              {d.openingHours.map((h) => (
                <div key={h.day} className={`flex justify-between ${h.day === today ? "font-semibold text-ink-900" : "text-muted"}`}><dt>{h.day}</dt><dd>{h.hours}</dd></div>
              ))}
            </dl>
          </div>
          <ContactPanel id="dealer-contact" dealerId={d.id} title={d.name} phone={d.phone} sellerName={d.name} isDemo />
        </aside>
      </div>
    </div>
  );
}
