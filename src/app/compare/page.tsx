import type { Metadata } from "next";
import { CompareView } from "@/views/compare-view";

export const metadata: Metadata = { title: "Compare vehicles", robots: { index: false } };

export default function ComparePage() {
  return <CompareView />;
}
