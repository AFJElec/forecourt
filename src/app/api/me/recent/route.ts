import { NextResponse } from "next/server";
import { jsonBody, UUID, withUser } from "@/lib/api/me";

export async function POST(req: Request) {
  return withUser(async (db, userId) => {
    const { id } = await jsonBody(req);
    if (typeof id !== "string" || !UUID.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
    await db.from("recently_viewed").upsert({ user_id: userId, advertisement_id: id, viewed_at: new Date().toISOString() }, { onConflict: "user_id,advertisement_id" });
    return new NextResponse(null, { status: 204 });
  });
}
