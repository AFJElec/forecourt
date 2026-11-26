"use client";
import { Heart, Menu, Search, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { accountNav, mainNav } from "@/config/site";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocalList } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

function SoonPill() {
  return <span className="rounded-full bg-white/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-white/70">Soon</span>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { list: saved } = useLocalList<string>("saved");
  const { user } = useAuth();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 bg-ink-900/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink-900/85">
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-16 items-center gap-1.5 px-3 text-[14px] font-medium text-white/75 transition-colors hover:text-white",
                  active && "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-electric-500",
                )}
              >
                {item.label}
                {item.status === "planned" && <span className="sr-only">(coming soon)</span>}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link href="/used-cars" className="flex size-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 lg:hidden" aria-label="Search cars">
            <Search className="size-5" />
          </Link>
          <Link href="/saved" className="relative flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-white/85 hover:bg-white/10" aria-label={`Saved vehicles (${saved.length})`}>
            <Heart className="size-5" />
            <span className="hidden xl:inline">Saved</span>
            {saved.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-electric-500 px-1 text-[10px] font-bold xl:static">{saved.length}</span>
            )}
          </Link>
          {user ? (
            <Link href="/account" className="hidden h-10 items-center gap-2 rounded-full border border-white/20 pl-1.5 pr-4 text-sm font-semibold hover:bg-white/10 sm:flex" aria-label="My account">
              <span className="flex size-7 items-center justify-center rounded-full bg-electric-500 text-xs font-bold uppercase">{user.displayName.slice(0, 1)}</span>
              My account
            </Link>
          ) : (
            <Link href="/sign-in" className="hidden h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold hover:bg-white/10 sm:flex">
              <User className="size-4" /> Sign in
            </Link>
          )}
          <button className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu className="size-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer — kept outside <header>: its backdrop-filter would otherwise become the containing block for this fixed layer */}
      <div className={cn("fixed inset-0 z-50 overflow-hidden lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-ink-950/60 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-ink-900 shadow-[var(--shadow-float)] transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}>
          <div className="flex h-16 items-center justify-between px-5">
            <Logo />
            <button onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close menu"><X className="size-5" /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Mobile">
            {[...mainNav, ...accountNav, ...(user ? [] : [{ label: "Sign in / Create account", href: "/sign-in", status: "live" as const }])].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl px-3 py-3.5 text-[16px] font-medium text-white/90 hover:bg-white/5">
                {item.label}
                {item.status === "planned" && <SoonPill />}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/10 p-5 text-xs text-white/50">Features marked “Soon” are on the build roadmap and not yet live.</div>
        </div>
      </div>
    </>
  );
}
