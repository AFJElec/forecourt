/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
export function safeNext(next: unknown, fallback = "/account"): string {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") && !/[\r\n]/.test(v) ? v : fallback;
}
