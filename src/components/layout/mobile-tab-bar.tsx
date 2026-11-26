"use client";
import { Heart, Home, MessageCircle, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocalList } from "@/lib/storage/local-lists";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/used-cars", label: "Search", icon: Search, match: (p: string) => p.startsWith("/used-cars") || p.startsWith("/vehicle") },
  { href: "/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/saved") },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: (p: string) => p.startsWith("/messages") },
  { href: "/account", label: "Account", icon: User, match: (p: string) => p.startsWith("/account") || p.startsWith("/sign-") },
];

/** Native-app style bottom navigation (mobile only). Hidden on vehicle pages, which show a contact bar instead. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { list: saved } = useLocalList<string>("saved");
  const { user } = useAuth();
  if (pathname.startsWith("/vehicle/")) return null;
  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 border-t border-mist-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link href={href === "/account" && !user ? "/sign-in" : href} className={cn("relative flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-medium", active ? "text-electric-600" : "text-muted")} aria-current={active ? "page" : undefined}>
                <Icon className={cn("size-[22px]", active && "fill-electric-500/15")} strokeWidth={active ? 2.3 : 1.9} />
                {label}
                {href === "/saved" && saved.length > 0 && (
                  <span className="absolute left-1/2 top-1.5 ml-2 rounded-full bg-electric-500 px-1.5 text-[10px] font-bold leading-4 text-white">{saved.length}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
