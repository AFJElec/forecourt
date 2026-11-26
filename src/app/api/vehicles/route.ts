import { NextResponse } from "next/server";
import { handleSummaries } from "@/lib/api/handlers";

export async function GET(req: Request) {
  const { status, body } = await handleSummaries(new URL(req.url).searchParams);
  return NextResponse.json(body, { status });
}
