import { NextResponse } from "next/server";
import { jsonBody, UUID, withUser } from "@/lib/api/me";
import { resolveSavedSearch } from "@/lib/api/saved-search";

/** Merge device lists into the account, then return the account's lists (account becomes the source of truth). */
export async function POST(req: Request) {
  return withUser(async (db, userId) => {
    const body = await jsonBody(req);
    const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && UUID.test(x)).slice(0, 200) : []);
    await db.rpc("merge_device_lists", { p_saved: ids(body.saved), p_recent: ids(body.recent).slice(0, 30) });

    const local = Array.isArray(body.searches) ? (body.searches as { name?: string; query?: string; serverId?: string }[]).slice(0, 50) : [];
    const { data: existing } = await db.from("saved_searches").select("query_string").eq("user_id", userId);
    const have = new Set((existing ?? []).map((r: { query_string: string }) => r.query_string));
    for (const s of local.filter((s) => !s.serverId && typeof s.query === "string")) {
      const { query, queryString } = await resolveSavedSearch(s.query!);
      if (have.has(queryString)) continue;
      have.add(queryString);
      await db.from("saved_searches").insert({ user_id: userId, name: String(s.name ?? "Saved search").slice(0, 120), query, query_string: queryString });
    }

    const [saved, recent, searches] = await Promise.all([
      db.from("saved_vehicles").select("advertisement_id").eq("user_id", userId).order("created_at", { ascending: false }),
      db.from("recently_viewed").select("advertisement_id").eq("user_id", userId).order("viewed_at", { ascending: false }).limit(20),
      db.from("saved_searches").select("id, name, query_string, created_at, alert_frequency").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({
      saved: (saved.data ?? []).map((r: { advertisement_id: string }) => r.advertisement_id),
      recent: (recent.data ?? []).map((r: { advertisement_id: string }) => r.advertisement_id),
      searches: (searches.data ?? []).map((r: { id: string; name: string; query_string: string; created_at: string; alert_frequency: string }) => ({
        id: r.id, serverId: r.id, name: r.name, query: r.query_string, createdAt: r.created_at, alertFrequency: r.alert_frequency,
      })),
    });
  });
}
