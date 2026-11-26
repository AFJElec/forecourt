import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">This page has driven off</h1>
      <p className="mt-2 max-w-md text-muted">The vehicle may have been sold or the advert removed.</p>
      <Link href="/used-cars" className={buttonVariants({ className: "mt-6" })}>Search used cars</Link>
    </div>
  );
}
