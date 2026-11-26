import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadDealer } from "@/lib/pages/loaders";
import { DealerProfileView } from "@/views/dealer-views";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const data = await loadDealer((await params).slug);
  if (!data) return { title: "Dealer not found" };
  return { title: `${data.dealer.name} — used cars in ${data.dealer.location.town}`, description: data.dealer.description, alternates: { canonical: `/dealers/${data.dealer.slug}` } };
}

export default async function DealerPage({ params }: P) {
  const data = await loadDealer((await params).slug);
  if (!data) notFound();
  return <DealerProfileView dealer={data.dealer} stock={data.stock} />;
}
