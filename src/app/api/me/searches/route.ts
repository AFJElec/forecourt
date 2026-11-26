import { NextResponse } from "next/server";
import { jsonBody, withUser } from "@/lib/api/me";
import { resolveSavedSearch } from "@/lib/api/saved-search";

export async function POST(req: Request) {
  return withUser(async (db, userId) => {
    const body = await jsonBody(req);
    if (typeof body.query !== "string") return NextResponse.json({ error: "Invalid search" }, { status: 422 });
    const { count } = await db.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if ((count ?? 0) >= 50) return NextResponse.json({ error: "You can save up to 50 searches" }, { status: 409 });
    const { query, queryString } = await resolveSavedSearch(body.query);
    const { data, error } = await db.from("saved_searches")
      .insert({ user_id: userId, name: String(body.name ?? "Saved search").slice(0, 120), query, query_string: queryString })
      .select("id, alert_frequency").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, alertFrequency: data.alert_frequency }, { status: 201 });
  });
}
