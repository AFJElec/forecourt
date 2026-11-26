"use client";
/**
 * Browser-side API helpers. A host can inject `globalThis.__fcLocalApi`
 * (used by the static design preview) to answer without a server.
 */
import type { VehicleSummary } from "@/types/vehicle";

interface LocalApi {
  count(qs: string): Promise<number>;
  summaries(ids: string[]): Promise<VehicleSummary[]>;
  post(path: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }>;
}
const local = () => (globalThis as { __fcLocalApi?: LocalApi }).__fcLocalApi;

export async function fetchCount(qs: string, signal?: AbortSignal): Promise<number> {
  const l = local();
  if (l) return l.count(qs);
  const res = await fetch(`/api/search/count?${qs}`, { signal });
  if (!res.ok) throw new Error("count failed");
  return ((await res.json()) as { count: number }).count;
}

export async function fetchSummaries(ids: string[]): Promise<VehicleSummary[]> {
  if (!ids.length) return [];
  const l = local();
  if (l) return l.summaries(ids);
  const res = await fetch(`/api/vehicles?ids=${encodeURIComponent(ids.join(","))}`);
  if (!res.ok) return [];
  return ((await res.json()) as { items: VehicleSummary[] }).items;
}

export async function postJson(path: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const l = local();
  if (l) return l.post(path, body);
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}
