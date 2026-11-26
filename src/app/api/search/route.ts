import { NextResponse } from "next/server";
import { handleSearch } from "@/lib/api/handlers";
import { clientKey, rateLimit } from "@/lib/http/rate-limit";

export async function GET(req: Request) {
  const rl = rateLimit(`search:${clientKey(req)}`, 120, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  const { status, body } = await handleSearch(new URL(req.url).searchParams);
  return NextResponse.json(body, { status, headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
