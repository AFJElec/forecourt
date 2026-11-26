import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ASSESSMENT_LABELS } from "@/lib/pricing/assessment";
import { cn } from "@/lib/utils";
import type { PriceAssessment } from "@/types/vehicle";

const styles: Record<PriceAssessment, string> = {
  excellent: "bg-success-600 text-white",
  good: "bg-success-50 text-success-600",
  fair: "bg-mist-100 text-slate-ink",
  above: "bg-warn-50 text-warn-600",
};

/** Only rendered when an assessment exists (i.e. enough comparable listings). */
export function PriceAssessmentBadge({ value, className }: { value: PriceAssessment | null; className?: string }) {
  if (!value) return null;
  const Icon = value === "above" ? TrendingUp : value === "fair" ? Minus : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", styles[value], className)}>
      <Icon className="size-3.5" />
      {ASSESSMENT_LABELS[value]}
    </span>
  );
}
