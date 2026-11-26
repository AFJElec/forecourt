import { NextResponse } from "next/server";
import { jsonBody, UUID, withUser } from "@/lib/api/me";

type P = { params: Promise<{ id: string }> };
const FREQ = ["off", "instant", "daily", "weekly"];

export async function PATCH(req: Request, { params }: P) {
  const { id } = await params;
  return withUser(async (db, userId) => {
    const body = await jsonBody(req);
    if (!UUID.test(id) || !FREQ.includes(String(body.alertFrequency))) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
    await db.from("saved_searches").update({ alert_frequency: body.alertFrequency }).eq("id", id).eq("user_id", userId);
    return new NextResponse(null, { status: 204 });
  });
}

export async function DELETE(_req: Request, { params }: P) {
  const { id } = await params;
  return withUser(async (db, userId) => {
    if (!UUID.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
    await db.from("saved_searches").delete().eq("id", id).eq("user_id", userId);
    return new NextResponse(null, { status: 204 });
  });
}
