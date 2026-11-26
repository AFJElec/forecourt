import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/planned-feature";
import { planned } from "@/config/planned";

const p = planned["vans"];
export const metadata: Metadata = { title: p.title, robots: { index: false } };

export default function Page() {
  return <PlannedFeature {...p} />;
}
