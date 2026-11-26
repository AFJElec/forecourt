import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/planned-feature";
import { planned } from "@/config/planned";

const p = planned["advertise"];
export const metadata: Metadata = { title: p.title, robots: { index: false } };

export default function Page() {
  return <PlannedFeature {...p} />;
}
