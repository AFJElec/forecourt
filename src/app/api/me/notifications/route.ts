import { NextResponse } from "next/server";
import { jsonBody, withUser } from "@/lib/api/me";

/** POST { ids?: string[] } marks the given (or all) notifications as read. */
export async function POST(req: Request) {
  return withUser(async (db, userId) => {
    const { ids } = await jsonBody(req);
    let q = db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
    if (Array.isArray(ids) && ids.length) q = q.in("id", ids.filter((x): x is string => typeof x === "string").slice(0, 200));
    await q;
    return new NextResponse(null, { status: 204 });
  });
}
