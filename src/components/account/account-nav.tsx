import { Bell, Heart, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav({ active, unread = 0 }: { active: string; unread?: number }) {
  return (
    <nav aria-label="Account" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={active === href ? "page" : undefined}
          className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] font-medium", active === href ? "bg-ink-900 text-white" : "text-slate-ink hover:bg-mist-100")}>
          <Icon className="size-4" />{label}
          {href === "/account/notifications" && unread > 0 && <span className="ml-auto rounded-full bg-electric-500 px-1.5 text-xs font-bold text-white">{unread}</span>}
        </Link>
      ))}
      <form action="/auth/sign-out" method="post" className="shrink-0 lg:mt-4">
        <button className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-muted hover:bg-mist-100 hover:text-ink-900"><LogOut className="size-4" />Sign out</button>
      </form>
    </nav>
  );
}
