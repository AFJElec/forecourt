import type { AnchorHTMLAttributes } from "react";
/** Preview shim: app routes become hash routes so the static preview can navigate. */
export function toHash(href: string) { return href.startsWith("/") ? `#${href}` : href; }
export default function Link({ href, scroll: _s, prefetch: _p, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; scroll?: boolean; prefetch?: boolean }) {
  return <a href={toHash(href)} {...rest} />;
}
