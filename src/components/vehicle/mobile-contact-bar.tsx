"use client";
import { MessageSquare, Phone } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { SaveButton } from "./save-button";

/** Fixed bottom bar on mobile vehicle pages. */
export function MobileContactBar({ id, title, price, phone }: { id: string; title: string; price: number; phone: string | null }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-mist-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <div className="mr-auto min-w-0">
          <p className="truncate text-xs text-muted">{title}</p>
          <p className="tabular text-lg font-extrabold text-ink-900">{formatPrice(price)}</p>
        </div>
        <SaveButton id={id} label={title} className="size-11 border border-mist-300 shadow-none" />
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-ink-900 text-white" aria-label="Call seller">
            <Phone className="size-5" />
          </a>
        )}
        <a href="#contact" className="flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-electric-500 px-4 font-semibold text-white">
          <MessageSquare className="size-5" /> Contact
        </a>
      </div>
    </div>
  );
}
