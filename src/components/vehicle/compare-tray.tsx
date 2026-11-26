"use client";
import { GitCompareArrows, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalList } from "@/lib/storage/local-lists";

/** Floating pill shown while the compare list has vehicles. */
export function CompareTray() {
  const { list, clear } = useLocalList<string>("compare");
  const pathname = usePathname();
  if (!list.length || pathname === "/compare") return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink-900 p-1 pl-4 text-white shadow-[var(--shadow-float)] lg:bottom-6">
      <GitCompareArrows className="size-4" />
      <Link href="/compare" className="px-2 py-2 text-sm font-semibold">Compare {list.length} vehicle{list.length === 1 ? "" : "s"}</Link>
      <button onClick={clear} className="flex size-8 items-center justify-center rounded-full hover:bg-white/10" aria-label="Clear compare list"><X className="size-4" /></button>
    </div>
  );
}
