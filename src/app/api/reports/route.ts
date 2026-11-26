import { NextResponse } from "next/server";
import { handleReport } from "@/lib/api/handlers";
import { clientKey, rateLimit } from "@/lib/http/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(`reports:${clientKey(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  const body = await req.json().catch(() => null);
  const { status, body: res } = await handleReport(body);
  return NextResponse.json(res, { status });
}
