/**
 * Static design preview of Phase 1. Renders the REAL views/components with the
 * demo repository in the browser (hash routing instead of the Next.js router).
 * Not part of the production app.
 */
import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { PlannedFeature } from "@/components/common/planned-feature";
import { AccountUnavailable } from "@/components/account/account-unavailable";
import { ForgotPasswordForm, ResetPasswordForm, SignInForm, SignUpForm } from "@/components/auth/auth-forms";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { CompareTray } from "@/components/vehicle/compare-tray";
import { CompareView } from "@/views/compare-view";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { planned } from "@/config/planned";
import { contentPages } from "@/content/pages";
import { handleEnquiry, handleReport } from "@/lib/api/handlers";
import { loadDealer, loadDealerDirectory, loadHome, loadSearch, loadVehicle } from "@/lib/pages/loaders";
import { listings } from "@/lib/repositories";
import { parseSearchParams } from "@/lib/search/schema";
import { ContentPage } from "@/views/content-view";
import { DealerDirectoryView, DealerProfileView } from "@/views/dealer-views";
import { HomeView } from "@/views/home-view";
import { SavedView } from "@/views/saved-view";
import { SearchView } from "@/views/search-view";
import { VehicleView } from "@/views/vehicle-view";
import NotFound from "@/app/not-found";
import { useRoute } from "next/navigation";

(globalThis as Record<string, unknown>).__fcLocalApi = {
  count: (qs: string) => listings().count(parseSearchParams(new URLSearchParams(qs))),
  summaries: (ids: string[]) => listings().getSummaries(ids),
  vehicles: (ids: string[]) => listings().getByIds(ids),
  post: async (path: string, body: unknown) => {
    const r = path.includes("enquir") ? await handleEnquiry(body) : await handleReport(body);
    return { ok: r.status < 400, data: r.body };
  },
};

async function resolve(route: string): Promise<{ node: ReactNode; title: string }> {
  const [path = "/", qs = ""] = route.split("?");
  const seg = path.split("/").filter(Boolean);
  const params = new URLSearchParams(qs);
  if (seg.length === 0) return { node: <HomeView data={await loadHome()} />, title: "Home" };
  if (seg[0] === "used-cars") {
    const f = parseSearchParams(params);
    if (seg[1]) f.make = seg[1];
    if (seg[2]) f.model = seg[2];
    const data = await loadSearch(f);
    return { node: <SearchView data={data} />, title: data.heading };
  }
  if (seg[0] === "vehicle" && seg[1]) {
    const d = await loadVehicle(seg[1]);
    return d ? { node: <VehicleView data={d} />, title: `${d.vehicle.make} ${d.vehicle.model}` } : { node: <NotFound />, title: "Not found" };
  }
  if (seg[0] === "dealers" && !seg[1]) {
    const d = await loadDealerDirectory();
    return { node: <DealerDirectoryView {...d} />, title: "Find a dealer" };
  }
  if (seg[0] === "dealers" && seg[1]) {
    const d = await loadDealer(seg[1]);
    return d ? { node: <DealerProfileView {...d} />, title: d.dealer.name } : { node: <NotFound />, title: "Not found" };
  }
  if (seg[0] === "saved") return { node: <SavedView />, title: "Saved" };
  if (seg[0] === "compare") return { node: <CompareView />, title: "Compare" };
  if (seg[0] === "account") return { node: <AccountUnavailable />, title: "My account" };
  if (seg[0] === "sign-in") return { node: <AuthShell title="Sign in" subtitle="Welcome back." configured={false}><SignInForm next="/account" /></AuthShell>, title: "Sign in" };
  if (seg[0] === "sign-up") return { node: <AuthShell title="Create your account" subtitle="Free for buyers. Takes under a minute." configured={false}><SignUpForm /></AuthShell>, title: "Create account" };
  if (seg[0] === "forgot-password") return { node: <AuthShell title="Reset your password" configured={false}><ForgotPasswordForm /></AuthShell>, title: "Reset password" };
  if (seg[0] === "reset-password") return { node: <AuthShell title="Choose a new password" configured={false}><ResetPasswordForm /></AuthShell>, title: "New password" };
  const key = seg.join("/");
  if (key in planned) { const p = planned[key as keyof typeof planned]; return { node: <PlannedFeature {...p} />, title: p.title }; }
  if (contentPages[key]) return { node: <ContentPage page={contentPages[key]!} />, title: contentPages[key]!.title };
  return { node: <NotFound />, title: "Not found" };
}

function App() {
  const route = useRoute();
  const [page, setPage] = useState<{ node: ReactNode; route: string } | null>(null);
  useEffect(() => {
    let live = true;
    const prevPath = page?.route.split("?")[0];
    resolve(route).then(({ node, title }) => {
      if (!live) return;
      setPage({ node, route });
      document.title = `${title} · Forecourt preview`;
      if (prevPath !== route.split("?")[0]) window.scrollTo(0, 0);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // In-page anchors (#contact, #reviews) must not break hash routing.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (href && href.startsWith("#") && !href.startsWith("#/")) {
        e.preventDefault();
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <AuthProvider>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">{page?.node ?? <div className="container-page py-24 text-center text-muted">Loading…</div>}</main>
      <SiteFooter />
      <MobileTabBar />
      <CompareTray />
      <CookieConsent />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
