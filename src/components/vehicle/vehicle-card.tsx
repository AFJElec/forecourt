import { Building2, Camera, Fuel, Gauge, MapPin, Settings2, Sparkles, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPrice, fuelLabels, transmissionLabels } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VehicleSummary } from "@/types/vehicle";
import { PriceAssessmentBadge } from "./price-assessment-badge";
import { SaveButton } from "./save-button";

export function VehicleCard({ v, layout = "grid", priority = false }: { v: VehicleSummary; layout?: "grid" | "list" | "rail"; priority?: boolean }) {
  const title = `${v.make} ${v.model}`;
  const list = layout === "list";
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]",
        list && "sm:grid sm:grid-cols-[minmax(260px,38%)_1fr]",
        v.featured && "ring-electric-200",
      )}
    >
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-mist-100", list && "sm:aspect-auto sm:h-full")}>
        <Image
          src={v.image.src}
          alt={v.image.alt}
          fill
          priority={priority}
          sizes={list ? "(min-width: 640px) 38vw, 100vw" : "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.featured && <Badge tone="electric"><Sparkles /> Featured</Badge>}
          {v.isDemo && <Badge tone="dark">Demo</Badge>}
        </div>
        <SaveButton id={v.id} label={title} className="absolute right-3 top-3 z-10" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-ink-950/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
          <Camera className="size-3.5" /> {v.imageCount}
        </span>
      </div>

      <div className="flex flex-col p-4 sm:p-5">
        <Link href={`/vehicle/${v.slug}`} className="after:absolute after:inset-0" aria-label={`${title} ${v.derivative}, ${formatPrice(v.price)}`}>
          <h3 className="truncate text-[17px] font-bold leading-snug">{title}</h3>
        </Link>
        <p className="mt-0.5 truncate text-sm text-muted">{v.derivative}</p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <div>
            <p className="tabular text-2xl font-extrabold tracking-tight text-ink-900">{formatPrice(v.price)}</p>
            {v.previousPrice && v.previousPrice > v.price && (
              <p className="text-xs font-semibold text-success-600">Reduced by {formatPrice(v.previousPrice - v.price)}</p>
            )}
          </div>
          {v.monthlyFinance && (
            <p className="text-right text-xs leading-tight text-muted">
              <span className="tabular text-sm font-bold text-ink-900">{formatPrice(v.monthlyFinance)}</span>/mo*
              <br />illustrative
            </p>
          )}
        </div>
        {v.priceAssessment && <PriceAssessmentBadge value={v.priceAssessment} className="mt-2 self-start" />}

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-slate-ink">
          <li className="flex items-center gap-1.5"><Gauge className="size-4 text-muted" />{v.registrationYearLabel.replace(" reg", "")}</li>
          <li className="flex items-center gap-1.5 tabular">{formatNumber(v.mileage)} miles</li>
          <li className="flex items-center gap-1.5"><Fuel className="size-4 text-muted" />{fuelLabels[v.fuelType]}</li>
          <li className="flex items-center gap-1.5"><Settings2 className="size-4 text-muted" />{transmissionLabels[v.transmission]}</li>
        </ul>

        {v.writeOffCategory !== "none" && (
          <p className="mt-3 rounded-md bg-danger-50 px-2 py-1 text-xs font-semibold text-danger-600">Category {v.writeOffCategory} recorded</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-mist-200 pt-3 text-[13px]">
          <span className="flex min-w-0 items-center gap-1.5 text-muted">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{v.location.town}{v.distanceMiles != null && ` · ${v.distanceMiles} mi`}</span>
          </span>
          <span className={cn("flex shrink-0 items-center gap-1 font-medium", v.sellerType === "trade" ? "text-ink-900" : "text-muted")}>
            {v.sellerType === "trade" ? <Building2 className="size-4" /> : <User className="size-4" />}
            {v.sellerType === "trade" ? "Dealer" : "Private"}
          </span>
        </div>
      </div>
    </article>
  );
}
