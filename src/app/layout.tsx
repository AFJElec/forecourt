import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { CompareTray } from "@/components/vehicle/compare-tray";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { brand } from "@/config/brand";
import { siteUrl } from "@/config/site";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${brand.name} — Used cars for sale across the UK`, template: `%s | ${brand.name}` },
  description: `Search thousands of used cars from verified dealers and private sellers on ${brand.name}. Compare prices, check history and find your next car.`,
  applicationName: brand.name,
  openGraph: { type: "website", siteName: brand.name, locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  // Demo environment must never be indexed.
  robots: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1222",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
        <AuthProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <MobileTabBar />
          <CompareTray />
          <CookieConsent />
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
