"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidPostcode, normalisePostcode } from "@/lib/geo/postcodes";
import { supabaseServer } from "@/lib/supabase/server";

export interface ProfileState { ok?: boolean; message?: string; errors?: Record<string, string> }

const schema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(60),
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(30).regex(/^[0-9 +()-]*$/, "Use digits, spaces and + only").optional(),
  postcode: z.string().trim().max(8).optional().refine((v) => !v || isValidPostcode(v), "Enter a valid UK postcode"),
});

export async function updateProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { message: "Please sign in again." };
  const d = parsed.data;
  const on = (k: string) => form.get(k) === "on";
  const { error } = await db.from("profiles").update({
    display_name: d.displayName, first_name: d.firstName || null, last_name: d.lastName || null, phone: d.phone || null,
    postcode: d.postcode ? normalisePostcode(d.postcode) : null,
    marketing_opt_in: on("marketing"),
    notification_prefs: { email: on("prefEmail"), push: false, price_drops: on("prefPriceDrops"), saved_searches: on("prefSavedSearches") },
  }).eq("id", user.id);
  if (error) return { message: "Couldn't save your changes. Please try again." };
  revalidatePath("/account");
  return { ok: true, message: "Saved." };
}
