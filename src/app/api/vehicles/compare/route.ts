import { NextResponse } from "next/server";
import { handleCompare } from "@/lib/api/handlers";

export async function GET(req: Request) {
  const { status, body } = await handleCompare(new URL(req.url).searchParams);
  return NextResponse.json(body, { status, headers: { "Cache-Control": "public, s-maxage=60" } });
}
