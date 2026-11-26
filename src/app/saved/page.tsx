import type { Metadata } from "next";
import { SavedView } from "@/views/saved-view";

export const metadata: Metadata = { title: "Saved vehicles & searches", robots: { index: false } };

export default function SavedPage() {
  return <SavedView />;
}
