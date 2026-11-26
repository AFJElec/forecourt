"use client";
import { ChevronLeft, ChevronRight, Expand, PlayCircle, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { VehicleImage } from "@/types/vehicle";

export function VehicleGallery({ images, title, videoUrl, isDemo }: { images: VehicleImage[]; title: string; videoUrl: string | null; isDemo: boolean }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const touch = useRef<number | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [full, go]);

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touch.current = e.touches[0]!.clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touch.current == null) return;
      const dx = e.changedTouches[0]!.clientX - touch.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touch.current = null;
    },
  };
  const img = images[i]!;
  const arrow = "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-lg backdrop-blur transition hover:bg-white";

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden bg-mist-100 sm:rounded-[var(--radius-card)]" {...swipe}>
        <button className="absolute inset-0 z-0 cursor-zoom-in" onClick={() => setFull(true)} aria-label="Open full-screen gallery" />
        <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="pointer-events-none object-cover" />
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} className={cn(arrow, "left-3 opacity-0 group-hover:opacity-100 max-sm:opacity-100")} aria-label="Previous image"><ChevronLeft className="size-5" /></button>
            <button onClick={() => go(1)} className={cn(arrow, "right-3 opacity-0 group-hover:opacity-100 max-sm:opacity-100")} aria-label="Next image"><ChevronRight className="size-5" /></button>
          </>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <span className="rounded-lg bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{i + 1} / {n}</span>
          <button onClick={() => setFull(true)} className="flex items-center gap-1 rounded-lg bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-ink-950"><Expand className="size-3.5" /> Full screen</button>
        </div>
        {isDemo && <span className="absolute left-3 top-3 rounded-full bg-ink-900/85 px-2.5 py-0.5 text-xs font-semibold text-white">Demo · illustrative images</span>}
      </div>

      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto px-4 sm:px-0">
        {images.map((im, idx) => (
          <button key={im.src + idx} onClick={() => setI(idx)} aria-label={`Show image ${idx + 1}`} aria-current={idx === i}
            className={cn("relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition sm:w-28", idx === i ? "ring-electric-500" : "ring-transparent opacity-70 hover:opacity-100")}>
            <Image src={im.src} alt="" fill sizes="112px" className="object-cover" />
          </button>
        ))}
        <div className={cn("flex aspect-[4/3] w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-mist-300 text-center text-[11px] text-muted sm:w-28", videoUrl && "border-solid bg-ink-900 text-white")}>
          <PlayCircle className="size-5" />{videoUrl ? "Watch video" : "No video"}
        </div>
      </div>

      {full && (
        <div role="dialog" aria-modal="true" aria-label={`${title} images`} className="fixed inset-0 z-[60] flex flex-col bg-ink-950" {...swipe}>
          <div className="flex items-center justify-between p-4 text-white">
            <p className="truncate text-sm font-semibold">{title} · {i + 1} of {n}</p>
            <button onClick={() => setFull(false)} className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close gallery"><X className="size-5" /></button>
          </div>
          <div className="relative flex-1">
            <Image src={img.src} alt={img.alt} fill sizes="100vw" className="object-contain" />
            <button onClick={() => go(-1)} className={cn(arrow, "left-4")} aria-label="Previous image"><ChevronLeft className="size-5" /></button>
            <button onClick={() => go(1)} className={cn(arrow, "right-4")} aria-label="Next image"><ChevronRight className="size-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
