"use client";
/**
 * Device-local lists (saved vehicles, recently viewed, saved searches).
 * Phase 1: localStorage so the features work without an account.
 * Phase 2: on sign-in these are merged into saved_vehicles / saved_searches /
 * recently_viewed in Supabase and then read from there.
 */
import { useCallback, useSyncExternalStore } from "react";

export type ListKey = "saved" | "recent" | "searches" | "compare";
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  /** Set once synced to the account (saved_searches.id). */
  serverId?: string;
  alertFrequency?: "off" | "instant" | "daily" | "weekly";
}

const LIMITS: Record<ListKey, number> = { saved: 200, recent: 20, searches: 50, compare: 4 };
const storageKey = (k: ListKey) => `fc:${k}`;
const listeners = new Set<() => void>();
const cache = new Map<ListKey, { raw: string | null; value: unknown[] }>();

function read<T>(k: ListKey): T[] {
  if (typeof window === "undefined") return [];
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(storageKey(k)); } catch { /* storage blocked */ }
  const hit = cache.get(k);
  if (hit && hit.raw === raw) return hit.value as T[];
  let value: T[] = [];
  try { value = raw ? (JSON.parse(raw) as T[]) : []; } catch { value = []; }
  cache.set(k, { raw, value });
  return value;
}

function write<T>(k: ListKey, list: T[]) {
  try { window.localStorage.setItem(storageKey(k), JSON.stringify(list.slice(0, LIMITS[k]))); } catch { /* quota / private mode */ }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key?.startsWith("fc:") && cb();
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

const EMPTY: never[] = [];

/** Non-hook access used by the account sync layer. */
export function readList<T>(k: ListKey): T[] { return read<T>(k); }
export function replaceList<T>(k: ListKey, list: T[]) { write(k, list); }
export function onListsChange(cb: () => void): () => void { return subscribe(cb); }

export function useLocalList<T = string>(k: ListKey) {
  const list = useSyncExternalStore(subscribe, () => read<T>(k), () => EMPTY as T[]);
  const add = useCallback((item: T, front = true) => {
    const cur = read<T>(k).filter((x) => JSON.stringify(x) !== JSON.stringify(item));
    write(k, front ? [item, ...cur] : [...cur, item]);
  }, [k]);
  const remove = useCallback((pred: (x: T) => boolean) => write(k, read<T>(k).filter((x) => !pred(x))), [k]);
  const toggle = useCallback((item: T) => {
    const cur = read<T>(k);
    const has = cur.some((x) => JSON.stringify(x) === JSON.stringify(item));
    write(k, has ? cur.filter((x) => JSON.stringify(x) !== JSON.stringify(item)) : [item, ...cur]);
    return !has;
  }, [k]);
  const clear = useCallback(() => write(k, []), [k]);
  return { list, add, remove, toggle, clear, limit: LIMITS[k] };
}
