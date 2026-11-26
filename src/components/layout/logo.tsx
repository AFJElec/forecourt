import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Temporary logo mark: abstract road/forecourt chevron. Replace with final brand assets. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path d="M9 21.5 16 9l7 12.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.6 21.5h6.8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".55" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#5b93ff" />
          <stop offset="1" stopColor="#1a5cf0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ inverse = true, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${brand.name} home`}>
      <LogoMark />
      <span className={cn("font-[family-name:var(--font-display)] text-[21px] font-extrabold tracking-tight", inverse ? "text-white" : "text-ink-900")}>
        {brand.name}
      </span>
    </Link>
  );
}
