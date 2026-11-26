import Image from "next/image";
import { DemoNotice } from "@/components/common/demo-notice";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { BrowseByBody, ElectricBanner, FeaturedDealers, PopularMakes, SellAndValue, TrustStrip, VehicleRail } from "@/components/home/sections";
import { HeroSearch } from "@/components/search/hero-search";
import { brand } from "@/config/brand";
import type { Dealership, Manufacturer, VehicleModel, VehicleSummary } from "@/types/vehicle";

export interface HomeData {
  makes: Manufacturer[];
  models: VehicleModel[];
  stats: { total: number; byMake: Record<string, number>; byBody: Record<string, number>; byFuel: Record<string, number> };
  featured: VehicleSummary[];
  recent: VehicleSummary[];
  dealers: Dealership[];
  isDemo: boolean;
}

export function HomeView({ data }: { data: HomeData }) {
  const { makes, models, stats, featured, recent, dealers, isDemo } = data;
  const makesWithCounts = makes.filter((m) => stats.byMake[m.slug]).map((m) => ({ ...m, count: stats.byMake[m.slug] }));
  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 pb-10 pt-8 sm:pb-16 sm:pt-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgba(47,116,255,0.35),transparent_60%),radial-gradient(40%_60%_at_0%_100%,rgba(47,116,255,0.15),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-20 -top-6 hidden w-[640px] lg:block xl:right-0">
          <Image src="/demo-vehicles/hero-suv.svg" alt="" width={1200} height={900} priority className="drop-shadow-[0_30px_60px_rgba(47,116,255,0.35)]" />
        </div>
        <div className="container-page relative">
          <div className="max-w-2xl animate-[var(--animate-fade-up)]">
            <p className="eyebrow !text-electric-200">{brand.tagline}</p>
            <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] !text-white sm:text-5xl lg:text-[56px]">
              Find your next car with confidence
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-white/70">
              Search thousands of used cars from verified dealers and private sellers across the UK, with honest price insight and clear history.
            </p>
          </div>
          <div className="mt-8 max-w-5xl lg:mt-10">
            <HeroSearch makes={makesWithCounts} models={models} initialTotal={stats.total} />
          </div>
        </div>
      </section>
      <TrustStrip />
      {isDemo && <div className="container-page mt-6"><DemoNotice /></div>}
      <VehicleRail eyebrow="Hand-picked" title="Featured vehicles" items={featured} href="/used-cars" />
      <VehicleRail eyebrow="Just in" title="Recently added" items={recent} href="/used-cars?sort=recent" />
      <BrowseByBody counts={stats.byBody} />
      <ElectricBanner evCount={stats.byFuel.electric ?? 0} hybridCount={(stats.byFuel.hybrid ?? 0) + (stats.byFuel.plug_in_hybrid ?? 0)} />
      <PopularMakes makes={makes} counts={stats.byMake} />
      <FeaturedDealers dealers={dealers} />
      <SellAndValue />
      <RecentlyViewed />
    </>
  );
}
