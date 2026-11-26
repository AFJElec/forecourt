/**
 * Framework-agnostic API handlers (plain data in → { status, body } out).
 * Next route handlers wrap these; the same functions back the future
 * versioned JSON API for native iOS/Android apps.
 */
import { listings } from "@/lib/repositories";
import { parseSearchParams } from "@/lib/search/schema";
import { enquirySchema, fieldErrors, reportSchema } from "@/lib/validation/enquiry";

export type ApiResult = { status: number; body: Record<string, unknown> };

export async function handleSearch(params: URLSearchParams): Promise<ApiResult> {
  const result = await listings().search(parseSearchParams(params));
  return { status: 200, body: result as unknown as Record<string, unknown> };
}

export async function handleCount(params: URLSearchParams): Promise<ApiResult> {
  return { status: 200, body: { count: await listings().count(parseSearchParams(params)) } };
}

export async function handleSummaries(params: URLSearchParams): Promise<ApiResult> {
  const ids = (params.get("ids") ?? "").split(",").map((s) => s.trim()).filter((s) => /^[\w-]{1,64}$/.test(s)).slice(0, 60);
  return { status: 200, body: { items: await listings().getSummaries(ids) } };
}

export async function handleEnquiry(body: unknown): Promise<ApiResult> {
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return { status: 422, body: { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) } };
  const e = parsed.data;
  if (e.website) return { status: 200, body: { delivered: false } }; // honeypot: silently drop
  const ad = e.advertisementId ? (await listings().getSummaries([e.advertisementId]))[0] ?? null : null;
  if (e.advertisementId && !ad) return { status: 404, body: { error: "This advert is no longer available." } };
  const isDemo = listings().source === "demo" || !!ad?.isDemo;
  if (isDemo) {
    return { status: 200, body: { delivered: false, demo: true, message: "Enquiry validated. This is a demo listing, so nothing was sent to a seller." } };
  }
  // Phase 5: insert into public.enquiries (RLS allows guest insert), notify seller via Resend, create conversation if signed in.
  return { status: 501, body: { error: "Enquiry delivery is not configured yet (requires Supabase + Resend).", unfinished: true } };
}

export async function handleReport(body: unknown): Promise<ApiResult> {
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return { status: 422, body: { error: "Invalid report", fieldErrors: fieldErrors(parsed.error) } };
  if (listings().source === "demo") return { status: 200, body: { message: "Thanks — report validated. (Demo mode: moderation queue arrives in build phase 6.)" } };
  return { status: 501, body: { error: "Report storage requires Supabase (phase 6).", unfinished: true } };
}
