import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-mist-100 text-slate-ink",
        dark: "bg-ink-900/85 text-white backdrop-blur",
        electric: "bg-electric-500 text-white",
        soft: "bg-electric-50 text-electric-700",
        success: "bg-success-50 text-success-600",
        warn: "bg-warn-50 text-warn-600",
        danger: "bg-danger-50 text-danger-600",
        outline: "border border-mist-300 bg-white text-slate-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
