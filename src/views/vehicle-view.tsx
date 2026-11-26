import { AlertTriangle, BadgeCheck, Building2, Calendar, CheckCircle2, ClipboardCheck, Cog, Fuel, Gauge, Leaf, MapPin, Palette, ShieldCheck, Star, Users, Zap } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DemoNotice } from "@/components/common/demo-notice";
import { TrackView } from "@/components/home/recently-viewed";
import { VehicleRail } from "@/components/home/sections";
import { Badge } from "@/components/ui/badge";
import { ContactPanel, ShareReport } from "@/components/vehicle/contact-panel";
import { FinanceCalculator } from "@/components/vehicle/finance-calculator";
import { MobileContactBar } from "@/components/vehicle/mobile-contact-bar";
import { PriceAssessmentBadge } from "@/components/vehicle/price-assessment-badge";
import { VehicleGallery } from "@/components/vehicle/vehicle-gallery";
import { illustrativeMonthly } from "@/lib/finance/representative";
import { bodyLabels, conditionLabels, formatNumber, formatPrice, fuelLabels, serviceHistoryLabels, timeAgo, transmissionLabels } from "@/lib/format";
import type { AssessmentResult } from "@/lib/pricing/assessment";
import { slugify } from "@/data/demo/catalogue";
import type { Dealership, Vehicle, VehicleSummary } from "@/types/vehicle";

export interface VehicleViewData {
  vehicle: Vehicle;
  dealer: Dealership | null;
  similar: VehicleSummary[];
  assessment: AssessmentResult | null;
  equipmentNames: Record<string, string>;
}

function Spec({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-mist-100/70 p-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-electric-600 shadow-sm">{icon}</span>
      <div className="min-w-0"><p className="text-xs text-muted">{label}</p><p className="truncate text-[15px] font-semibold text-ink-900">{value}</p></div>
    </div>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 sm:p-7">
      <h2 id={id ? `${id}-h` : undefined} className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      {rows.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-mist-200 py-2.5 text-[15px]">
          <dt className="text-muted">{k}</dt><dd className="tabular text-right font-semibold text-ink-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VehicleView({ data }: { data: VehicleViewData }) {
  const { vehicle: v, dealer, similar, assessment, equipmentNames } = data;
  const title = `${v.make} ${v.model}`;
  const monthly = illustrativeMonthly(v.price);
  const sellerName = dealer?.name ?? "the private seller";
  const phone = dealer?.phone ?? null;

  return (
    <div className="pb-28 lg:pb-10">
      <TrackView id={v.id} />
      <div className="container-page pt-4 sm:pt-6">
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
          <Link href="/" className="hover:text-ink-900">Home</Link> / <Link href="/used-cars" className="hover:text-ink-900">Used cars</Link> /{" "}
          <Link href={`/used-cars/${slugify(v.make)}`} className="hover:text-ink-900">{v.make}</Link> /{" "}
          <Link href={`/used-cars/${slugify(v.make)}/${slugify(v.model)}`} className="hover:text-ink-900">{v.model}</Link>
        </nav>
      </div>

      <div className="container-page grid gap-6 max-sm:px-0 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <VehicleGallery images={v.images} title={title} videoUrl={v.videoUrl} isDemo={v.isDemo} />

          <div className="space-y-6 max-sm:px-4">
            {/* Title block (mobile + desktop) */}
            <div>
              <div className="flex flex-wrap gap-2">
                {v.featured && <Badge tone="electric">Featured</Badge>}
                {v.isDemo && <Badge tone="dark">Demo listing</Badge>}
                <Badge tone={v.sellerType === "trade" ? "soft" : "neutral"}>{v.sellerType === "trade" ? "Trade seller" : "Private seller"}</Badge>
                {v.ulezCompliant && <Badge tone="success"><Leaf /> ULEZ compliant</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-[40px] sm:leading-tight">{title}</h1>
              <p className="mt-1 text-lg text-muted">{v.derivative}</p>
              <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
                <p className="tabular text-4xl font-extrabold tracking-tight text-ink-900">{formatPrice(v.price)}</p>
                {monthly && <p className="pb-1 text-sm text-muted"><strong className="tabular text-base text-ink-900">{formatPrice(monthly)}</strong>/month illustrative*</p>}
              </div>
              {v.previousPrice && v.previousPrice > v.price && <p className="mt-1 text-sm font-semibold text-success-600">Price reduced by {formatPrice(v.previousPrice - v.price)}</p>}
              {assessment && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <PriceAssessmentBadge value={assessment.assessment} />
                  <span>{Math.abs(assessment.differencePct)}% {assessment.differencePct <= 0 ? "below" : "above"} the adjusted average of {assessment.comparableCount} similar listings</span>
                </div>
              )}
              <div className="mt-4"><ShareReport advertId={v.id} title={`${title} ${v.derivative}`} /></div>
            </div>

            {v.writeOffCategory !== "none" && (
              <div className="flex gap-3 rounded-2xl border border-danger-600/25 bg-danger-50 p-4 text-danger-600" role="note">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <p className="text-sm"><strong>Category {v.writeOffCategory} write-off.</strong> This vehicle has been recorded by an insurer as {v.writeOffCategory === "S" ? "structurally" : "non-structurally"} damaged and subsequently repaired. This can affect value and insurance — ask the seller for repair evidence.</p>
              </div>
            )}
            {v.isDemo && <DemoNotice />}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Spec icon={<Calendar className="size-5" />} label="Registered" value={v.registrationYearLabel} />
              <Spec icon={<Gauge className="size-5" />} label="Mileage" value={`${formatNumber(v.mileage)} miles`} />
              <Spec icon={<Fuel className="size-5" />} label="Fuel" value={fuelLabels[v.fuelType]} />
              <Spec icon={<Cog className="size-5" />} label="Gearbox" value={transmissionLabels[v.transmission]} />
              <Spec icon={<Zap className="size-5" />} label={v.engineSizeLitres ? "Engine" : "Power"} value={v.engineSizeLitres ? `${v.engineSizeLitres.toFixed(1)}L · ${v.enginePowerBhp} bhp` : `${v.enginePowerBhp} bhp`} />
              <Spec icon={<Users className="size-5" />} label="Owners" value={`${v.owners} previous`} />
              <Spec icon={<Palette className="size-5" />} label="Colour" value={v.colour} />
              <Spec icon={<ClipboardCheck className="size-5" />} label="Service history" value={serviceHistoryLabels[v.serviceHistory].replace(" service history", "")} />
              <Spec icon={<ShieldCheck className="size-5" />} label="Insurance group" value={`${v.insuranceGroup} of 50`} />
            </div>

            <Panel title="Seller's description">
              <div className="space-y-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-ink">{v.description}</div>
            </Panel>

            {v.equipment.length > 0 && (
              <Panel title="Features & equipment">
                <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {v.equipment.map((e) => <li key={e} className="flex items-center gap-2.5 text-[15px]"><CheckCircle2 className="size-5 shrink-0 text-electric-500" />{equipmentNames[e] ?? e}</li>)}
                </ul>
              </Panel>
            )}

            <Panel title="Technical specification">
              <Rows rows={[
                ["Body type", bodyLabels[v.bodyType]], ["Doors", v.doors], ["Seats", v.seats],
                ["Engine size", v.engineSizeLitres ? `${v.engineSizeLitres.toFixed(1)} litres` : "—"], ["Power", `${v.enginePowerBhp} bhp`],
                ["0–62 mph", v.acceleration0to62 ? `${v.acceleration0to62} s` : null], ["Top speed", v.topSpeedMph ? `${v.topSpeedMph} mph` : null],
                ["Battery", v.batteryKwh ? `${v.batteryKwh} kWh` : null], ["Condition", conditionLabels[v.condition]],
              ]} />
            </Panel>

            <Panel title="Running costs">
              <Rows rows={[
                [v.fuelType === "electric" ? "Range (WLTP)" : "Economy (WLTP combined)", v.fuelType === "electric" ? `${v.electricRangeMiles} miles` : v.mpgCombined ? `${v.mpgCombined} mpg` : "—"],
                ["CO₂ emissions", v.co2GPerKm != null ? `${v.co2GPerKm} g/km` : null],
                ["Vehicle tax (est.)", `${formatPrice(v.annualTaxGbp)} / year`],
                ["Insurance group", `${v.insuranceGroup}`],
                ["ULEZ / Clean Air Zones", v.ulezCompliant ? "Meets standard (Euro emissions)" : "Likely charged — check TfL / local CAZ checker"],
                ...(v.fuelType === "plug_in_hybrid" && v.electricRangeMiles ? [["Electric-only range", `${v.electricRangeMiles} miles`] as [string, string]] : []),
              ]} />
              <p className="mt-3 text-xs text-muted">Figures are manufacturer/representative data. Vehicle tax shown is an estimate based on current VED bands. Always confirm ULEZ/CAZ status with the official checker for the registration.</p>
            </Panel>

            <Panel title="MOT & vehicle history" id="history">
              <Rows rows={[
                ["MOT due", v.motExpiry ? new Date(v.motExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not yet due (under 3 years old)"],
                ["Previous owners", v.owners], ["Service history", serviceHistoryLabels[v.serviceHistory]],
                ["Write-off record", v.writeOffCategory === "none" ? "None declared by seller" : `Category ${v.writeOffCategory}`],
              ]} />
              <div className="mt-4 rounded-xl border border-dashed border-mist-300 p-4 text-sm text-muted">
                <strong className="text-ink-900">Full MOT history & provenance check — coming soon.</strong> Live MOT results (DVSA MOT History API) and finance/stolen/write-off checks from an authorised history provider will appear here once credentials are configured (build phase 7).
              </div>
            </Panel>
          </div>
        </div>

        <aside className="space-y-6 max-sm:px-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 sm:p-6">
            {dealer ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl text-base font-bold text-white" style={{ background: dealer.logoColor }}>{dealer.logoInitials}</span>
                  <div className="min-w-0">
                    <Link href={`/dealers/${dealer.slug}`} className="block truncate font-bold text-ink-900 hover:underline">{dealer.name}</Link>
                    <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" />{dealer.location.town}, {dealer.location.postcode}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {dealer.rating && <Link href={`/dealers/${dealer.slug}#reviews`} className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-[#f5b301] text-[#f5b301]" />{dealer.rating.toFixed(1)} <span className="font-normal text-muted underline">{dealer.reviewCount} reviews</span></Link>}
                  {dealer.verified && <span className="flex items-center gap-1 text-xs font-semibold text-success-600"><BadgeCheck className="size-4" /> Verified dealer</span>}
                </div>
                <p className="mt-3 text-xs text-muted"><Building2 className="mr-1 inline size-3.5" />Buying from a trader gives you rights under the Consumer Rights Act 2015.</p>
              </>
            ) : (
              <>
                <p className="font-bold text-ink-900">{v.privateSellerName ?? "Private seller"}</p>
                <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" />{v.location.town}, {v.location.postcode}</p>
                <p className="mt-3 rounded-xl bg-warn-50 p-3 text-xs text-warn-600">Private sale: you have fewer legal rights than when buying from a trader. The car must be as described and the seller must have the right to sell it. Never pay before seeing the car and its V5C.</p>
              </>
            )}
            <p className="mt-4 border-t border-mist-200 pt-3 text-xs text-muted">{timeAgo(v.listedAt)} · Advert ref {v.id.toUpperCase()}</p>
          </div>
          <ContactPanel advertId={v.id} title={title} phone={phone} sellerName={dealer?.name ?? "seller"} isDemo={v.isDemo} />
          <FinanceCalculator price={v.price} />
        </aside>
      </div>

      <VehicleRail eyebrow="You might also like" title="Similar vehicles" items={similar} href={`/used-cars/${slugify(v.make)}/${slugify(v.model)}`} />
      <p className="container-page mt-8 text-xs text-muted">*Illustrative monthly estimate (10% deposit, 48 months, 9.9% APR) — not a finance offer.</p>
      <MobileContactBar id={v.id} title={title} price={v.price} phone={phone} />
    </div>
  );
}
