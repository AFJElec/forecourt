"use client";
import { useEffect, useState } from "react";
import { fetchSummaries } from "@/lib/search/client";
import { useLocalList } from "@/lib/storage/local-lists";
import type { VehicleSummary } from "@/types/vehicle";
import { VehicleRail } from "./sections";

export function RecentlyViewed({ title = "Recently viewed" }: { title?: string }) {
  const { list } = useLocalList<string>("recent");
  const [items, setItems] = useState<VehicleSummary[]>([]);
  const key = list.slice(0, 8).join(",");
  useEffect(() => {
    let live = true;
    fetchSummaries(key ? key.split(",") : []).then((r) => live && setItems(r));
    return () => { live = false; };
  }, [key]);
  return <VehicleRail items={items} eyebrow="Pick up where you left off" title={title} />;
}

/** Records a vehicle view (mounted on vehicle pages). */
export function TrackView({ id }: { id: string }) {
  const { add } = useLocalList<string>("recent");
  useEffect(() => { add(id); }, [id, add]);
  return null;
}
