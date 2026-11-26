import { Bell, Heart, Search } from "lucide-react";
import type { ReactNode } from "react";

/** Two-column auth layout: form on the left, account benefits on the right (desktop). */
export function AuthShell({ title, subtitle, children, footer, configured }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; configured: boolean }) {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,460px)_1fr] lg:py-16">
      <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/70 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        {!configured && (
          <p className="mt-4 rounded-xl bg-warn-50 p-3 text-sm text-warn-600">
            <strong>Accounts aren't switched on in this demo.</strong> They go live once a Supabase project is connected — until then, saved vehicles and searches are kept on this device.
          </p>
        )}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 border-t border-mist-200 pt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
      <div className="hidden flex-col justify-center gap-6 lg:flex">
        <h2 className="text-3xl font-bold">Your car search, everywhere</h2>
        {[
          { icon: Heart, t: "Save vehicles", d: "Keep a shortlist on your phone and laptop, synced to your account." },
          { icon: Bell, t: "Price-drop alerts", d: "We'll tell you when a car you've saved is reduced." },
          { icon: Search, t: "Saved-search alerts", d: "Get notified when new cars matching your search are listed." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-electric-50 text-electric-600"><Icon className="size-6" /></span>
            <div><p className="font-semibold text-ink-900">{t}</p><p className="text-muted">{d}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
