import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shown wherever demonstration data is displayed. */
export function DemoNotice({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border border-warn-600/20 bg-warn-50 px-4 py-3 text-sm text-warn-600", className)} role="note">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong className="font-semibold">Demonstration data.</strong>{" "}
        {compact
          ? "Listings, dealers and images are fictional."
          : "These listings, dealerships, reviews and images are fictional and for development only. They are not genuine vehicles for sale."}
      </p>
    </div>
  );
}
