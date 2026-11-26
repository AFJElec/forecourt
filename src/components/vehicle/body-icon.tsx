import { bodyPath, G, roundedPath, shapes } from "@/lib/art/body-shapes";
import { cn } from "@/lib/utils";
import type { BodyType } from "@/types/vehicle";

/** Line-art body-style icon derived from the same geometry as the demo renders. */
export function BodyIcon({ type, className }: { type: BodyType; className?: string }) {
  const s = shapes[type];
  return (
    <svg viewBox="60 170 680 310" className={cn("h-10 w-auto", className)} aria-hidden fill="none">
      <path d={bodyPath(s)} fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="14" strokeLinejoin="round" />
      <path d={roundedPath(s.glass, true)} fill="currentColor" fillOpacity=".25" />
      {s.wheels.map((x) => <circle key={x} cx={x} cy={G - s.wheelR} r={s.wheelR - 6} stroke="currentColor" strokeWidth="14" fill="white" />)}
    </svg>
  );
}
