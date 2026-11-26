"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Consent = { necessary: true; analytics: boolean; marketing: boolean; at: string };
const KEY = "fc:consent:v1";

export function readConsent(): Consent | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}

/**
 * UK GDPR / PECR: non-essential cookies (analytics, marketing) stay off until
 * the user opts in. "Reject" is as prominent as "Accept". Analytics scripts
 * must check readConsent()?.analytics before loading (Phase 8 wiring).
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  useEffect(() => setShow(!readConsent()), []);
  if (!show) return null;
  const save = (a: boolean, m: boolean) => {
    try { localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: a, marketing: m, at: new Date().toISOString() })); } catch { /* ignore */ }
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl animate-[var(--animate-fade-up)] rounded-2xl border border-mist-200 bg-white p-5 shadow-[var(--shadow-float)] lg:bottom-5">
      <p className="text-[15px] font-semibold text-ink-900">Your cookie choices</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        We use essential cookies to run the site. With your permission we'd also use analytics and marketing cookies. <Link href="/legal/cookies" className="font-medium text-electric-600 underline">Cookie policy</Link>
      </p>
      {custom && (
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked disabled /> Essential (always on)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Analytics</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Marketing</label>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => save(true, true)}>Accept all</Button>
        <Button size="sm" variant="outline" onClick={() => save(false, false)}>Reject non-essential</Button>
        {custom ? (
          <Button size="sm" variant="ghost" onClick={() => save(analytics, marketing)}>Save choices</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setCustom(true)}>Manage</Button>
        )}
      </div>
    </div>
  );
}
