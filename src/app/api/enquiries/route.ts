import { NextResponse } from "next/server";
import { handleEnquiry } from "@/lib/api/handlers";
import { clientKey, rateLimit } from "@/lib/http/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(`enquiries:${clientKey(req)}`, 5, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  const body = await req.json().catch(() => null);
  const { status, body: res } = await handleEnquiry(body);
  return NextResponse.json(res, { status });
}
