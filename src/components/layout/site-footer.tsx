import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "./logo";

const columns = [
  { title: "Buy", links: [["Used cars", "/used-cars"], ["Electric cars", "/used-cars?fuel=electric"], ["Hybrid cars", "/used-cars?fuel=hybrid,plug_in_hybrid"], ["Find a dealer", "/dealers"], ["New cars (soon)", "/new-cars"], ["Vans (soon)", "/vans"]] },
  { title: "Sell", links: [["Sell your vehicle (soon)", "/sell"], ["Free valuation (soon)", "/valuation"], ["Dealer advertising", "/advertise"]] },
  { title: "Popular", links: [["Used Ford", "/used-cars/ford"], ["Used Volkswagen", "/used-cars/volkswagen"], ["Used BMW", "/used-cars/bmw"], ["Used Nissan Qashqai", "/used-cars/nissan/qashqai"], ["Used Volkswagen Golf", "/used-cars/volkswagen/golf"]] },
  { title: "Company", links: [["About us", "/about"], ["Help & safety", "/help/safety"], ["Terms of use", "/legal/terms"], ["Privacy notice", "/legal/privacy"], ["Cookie policy", "/legal/cookies"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink-900 pb-24 text-white/70 lg:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed">{brand.tagline}. Thousands of cars from trusted dealers and private sellers across the UK.</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-sm font-semibold text-white" style={{ fontFamily: "var(--font-sans)", letterSpacing: 0 }}>{col.title}</h3>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="transition-colors hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page space-y-3 py-6 text-xs leading-relaxed text-white/50">
          <p>
            {brand.legalName}. Registered in England & Wales, company no. {brand.companyNumber}. {brand.registeredAddress}.
          </p>
          <p>
            {brand.name} is an advertising platform and is not a party to any sale. Trade sellers must comply with the Consumer Rights Act 2015; private sales carry fewer statutory rights.
            {brand.fcaFirmReference
              ? ` Authorised and regulated by the Financial Conduct Authority (FRN ${brand.fcaFirmReference}).`
              : " We do not currently arrange or advise on credit. Any monthly figures shown are illustrative only and are not finance offers."}
          </p>
          <p>© {new Date().getFullYear()} {brand.name} · Demonstration build — listings marked “Demo” are not genuine advertisements.</p>
        </div>
      </div>
    </footer>
  );
}
