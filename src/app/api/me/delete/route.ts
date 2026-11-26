import { NextResponse } from "next/server";
import { jsonBody, withUser } from "@/lib/api/me";
import { supabaseAdmin } from "@/lib/supabase/clients";

/**
 * UK GDPR right to erasure. Requires typing DELETE. Removes the auth user; rows that
 * reference it cascade (profile, saved, searches, notifications…). Private adverts
 * are deleted with the account; enquiries they sent keep their content for the seller with the buyer link nulled.
 */
export async function POST(req: Request) {
  return withUser(async (db, userId) => {
    const { confirm } = await jsonBody(req);
    if (confirm !== "DELETE") return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 422 });
    const admin = supabaseAdmin();
    // Private adverts must go first (an advert can't exist without its private seller).
    const { error: adsError } = await admin.from("advertisements").delete().eq("seller_user_id", userId);
    if (adsError) throw adsError;
    await db.auth.signOut();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  });
}
