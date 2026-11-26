import type { Metadata } from "next";
import { loadDealerDirectory } from "@/lib/pages/loaders";
import { DealerDirectoryView } from "@/views/dealer-views";

export const metadata: Metadata = { title: "Find a car dealer near you", alternates: { canonical: "/dealers" } };

export default async function DealersPage() {
  const { dealers, stockCounts } = await loadDealerDirectory();
  return <DealerDirectoryView dealers={dealers} stockCounts={stockCounts} />;
}
