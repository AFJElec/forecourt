"use client";
import { Check, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { useLocalList } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";

/** Adds/removes a vehicle from the compare list (max 4). */
export function CompareButton({ id, className, compact }: { id: string; className?: string; compact?: boolean }) {
  const { list, toggle, limit } = useLocalList<string>("compare");
  const [full, setFull] = useState(false);
  const on = list.includes(id);
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" aria-pressed={on}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!on && list.length >= limit) { setFull(true); setTimeout(() => setFull(false), 2500); return; } toggle(id); }}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors",
          on ? "bg-electric-50 text-electric-700" : "text-ink-900 hover:bg-mist-100", className)}>
        {on ? <Check className="size-4" /> : <GitCompareArrows className="size-4" />}
        {compact ? (on ? "Comparing" : "Compare") : on ? "Added to compare" : "Compare"}
      </button>
      {full && <span role="status" className="text-xs text-warn-600">You can compare up to {limit} vehicles</span>}
    </span>
  );
}
