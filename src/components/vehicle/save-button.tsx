"use client";
import { Heart } from "lucide-react";
import { useLocalList } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";

export function SaveButton({ id, label, className, variant = "floating" }: { id: string; label: string; className?: string; variant?: "floating" | "inline" }) {
  const { list, toggle } = useLocalList<string>("saved");
  const saved = list.includes(id);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from saved vehicles` : `Save ${label}`}
      className={cn(
        "group/save flex items-center justify-center gap-2 transition-all",
        variant === "floating"
          ? "size-10 rounded-full bg-white/95 shadow-md backdrop-blur hover:scale-105"
          : "h-11 rounded-[var(--radius-control)] border border-mist-300 bg-white px-4 text-[15px] font-semibold text-ink-900 hover:border-ink-900",
        className,
      )}
    >
      <Heart className={cn("size-5 transition-colors", saved ? "fill-danger-600 text-danger-600" : "text-ink-900 group-hover/save:text-danger-600")} />
      {variant === "inline" && (saved ? "Saved" : "Save")}
    </button>
  );
}
