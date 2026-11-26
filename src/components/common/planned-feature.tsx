import { Construction } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Standard "clearly identified as unfinished" page for roadmap features. */
export function PlannedFeature({ title, phase, summary, bullets, credentials }: {
  title: string; phase: number; summary: string; bullets: string[]; credentials?: string[];
}) {
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] border border-mist-200 bg-white p-8 shadow-[var(--shadow-card)] sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-warn-50 px-3 py-1 text-xs font-semibold text-warn-600">
          <Construction className="size-3.5" /> Not yet live · Build phase {phase}
        </span>
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="mt-3 leading-relaxed text-muted">{summary}</p>
        <ul className="mt-6 space-y-2 text-[15px]">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-electric-500" />{b}</li>
          ))}
        </ul>
        {credentials && credentials.length > 0 && (
          <p className="mt-6 rounded-xl bg-mist-100 p-4 text-sm text-slate-ink">
            <strong>Requires:</strong> {credentials.join(", ")}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/used-cars" className={buttonVariants()}>Search used cars</Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}
