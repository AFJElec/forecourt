import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/me";

/** UK GDPR right of access: a JSON copy of everything held about the signed-in user. */
export async function GET() {
  return withUser(async (db) => {
    const { data, error } = await db.rpc("export_my_data");
    if (error) throw error;
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
      },
    });
  });
}
