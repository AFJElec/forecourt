"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onListsChange, readList, replaceList, type SavedSearch } from "@/lib/storage/local-lists";

export interface ClientUser { id: string; email: string; displayName: string }
interface AuthCtx { user: ClientUser | null; ready: boolean; configured: boolean }

const Ctx = createContext<AuthCtx>({ user: null, ready: false, configured: false });
export const useAuth = () => useContext(Ctx);

const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.status === 204 ? null : res.json();
}

/**
 * Loads the session client-side (keeps pages statically cacheable) and, when
 * signed in, keeps the device-local lists (saved, recently viewed, saved
 * searches) in sync with the account:
 *   1. on sign-in, local lists are merged into the account and replaced by the account's lists;
 *   2. afterwards every local change is mirrored to the server.
 * UI components keep using useLocalList() unchanged.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;
    fetch("/api/me").then((r) => (r.ok ? r.json() : { user: null })).then((d) => setUser(d.user ?? null)).catch(() => {}).finally(() => setReady(true));
  }, []);

  useAccountSync(user);
  return <Ctx.Provider value={{ user, ready, configured }}>{children}</Ctx.Provider>;
}

function useAccountSync(user: ClientUser | null) {
  const snap = useRef<{ saved: string[]; recent: string[]; searches: SavedSearch[] } | null>(null);

  useEffect(() => {
    if (!user) { snap.current = null; return; }
    let cancelled = false;
    let unsub = () => {};

    (async () => {
      try {
        const merged = await api("/api/me/sync", "POST", {
          saved: readList<string>("saved"), recent: readList<string>("recent"), searches: readList<SavedSearch>("searches"),
        });
        if (cancelled) return;
        snap.current = { saved: merged.saved, recent: merged.recent, searches: merged.searches };
        replaceList("saved", merged.saved);
        replaceList("recent", merged.recent);
        replaceList("searches", merged.searches);
      } catch { return; /* offline or server error: keep local lists, retry next load */ }

      unsub = onListsChange(() => {
        const prev = snap.current;
        if (!prev) return;
        const saved = readList<string>("saved"), recent = readList<string>("recent"), searches = readList<SavedSearch>("searches");
        snap.current = { saved, recent, searches };
        saved.filter((id) => !prev.saved.includes(id)).forEach((id) => api("/api/me/saved", "POST", { id }).catch(() => {}));
        prev.saved.filter((id) => !saved.includes(id)).forEach((id) => api("/api/me/saved", "DELETE", { id }).catch(() => {}));
        if (recent[0] && recent[0] !== prev.recent[0]) api("/api/me/recent", "POST", { id: recent[0] }).catch(() => {});
        for (const s of searches.filter((s) => !s.serverId && !prev.searches.some((p) => p.query === s.query))) {
          api("/api/me/searches", "POST", { name: s.name, query: s.query }).then((row) => {
            replaceList("searches", readList<SavedSearch>("searches").map((x) => (x.id === s.id ? { ...x, serverId: row.id, alertFrequency: row.alertFrequency } : x)));
          }).catch(() => {});
        }
        prev.searches.filter((p) => p.serverId && !searches.some((s) => s.serverId === p.serverId))
          .forEach((p) => api(`/api/me/searches/${p.serverId}`, "DELETE").catch(() => {}));
      });
    })();

    return () => { cancelled = true; unsub(); };
  }, [user]);
}
