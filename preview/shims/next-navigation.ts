import { useSyncExternalStore } from "react";
/** Preview shim for next/navigation backed by location.hash ("#/path?query"). */
const sub = (cb: () => void) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); };
const route = () => (location.hash.startsWith("#/") ? location.hash.slice(1) : "/");
export function currentRoute() { return route(); }
export function useRoute() { return useSyncExternalStore(sub, route, () => "/"); }
export function usePathname() { return useRoute().split("?")[0]!; }
export function useSearchParams() { return new URLSearchParams(useRoute().split("?")[1] ?? ""); }
export function useRouter() {
  return { push: (url: string, opts?: { scroll?: boolean }) => { const y = scrollY; location.hash = url; if (opts?.scroll === false) requestAnimationFrame(() => scrollTo(0, y)); }, replace: (url: string) => history.replaceState(null, "", `#${url}`), back: () => history.back(), refresh: () => {} };
}
export class NotFoundError extends Error {}
export function notFound(): never { throw new NotFoundError("not found"); }
