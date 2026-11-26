import { NextResponse } from "next/server";
import { jsonBody, UUID, withUser } from "@/lib/api/me";

export async function POST(req: Request) {
  return withUser(async (db, userId) => {
    const { id } = await jsonBody(req);
    if (typeof id !== "string" || !UUID.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
    const { data: ad } = await db.from("advertisements").select("price_gbp").eq("id", id).eq("status", "active").maybeSingle();
    if (!ad) return NextResponse.json({ error: "Advert not found" }, { status: 404 });
    const { error } = await db.from("saved_vehicles").upsert({ user_id: userId, advertisement_id: id, price_at_save: ad.price_gbp }, { onConflict: "user_id,advertisement_id", ignoreDuplicates: true });
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  });
}

export async function DELETE(req: Request) {
  return withUser(async (db, userId) => {
    const { id } = await jsonBody(req);
    if (typeof id !== "string" || !UUID.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
    await db.from("saved_vehicles").delete().eq("user_id", userId).eq("advertisement_id", id);
    return new NextResponse(null, { status: 204 });
  });
}
