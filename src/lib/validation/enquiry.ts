import { z } from "zod";
import { isValidVrm } from "@/lib/uk/registration";

export const enquirySchema = z.object({
  kind: z.enum(["contact", "viewing", "part_exchange"]),
  advertisementId: z.string().min(1).max(64).optional(),
  dealershipId: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  phone: z.string().trim().max(30).regex(/^[0-9 +()-]*$/, "Phone number contains invalid characters").optional().or(z.literal("")),
  message: z.string().trim().max(2000).default(""),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  preferredTime: z.string().max(20).optional(),
  pxRegistration: z.string().trim().max(10).optional().refine((v) => !v || isValidVrm(v), "Enter a valid UK registration"),
  pxMileage: z.string().trim().max(9).regex(/^\d*$/, "Mileage must be a number").optional(),
  /** Honeypot — real users never fill this in. */
  website: z.string().max(0).optional(),
}).refine((d) => d.advertisementId || d.dealershipId, { message: "Missing advert or dealer", path: ["advertisementId"] })
  .refine((d) => d.kind !== "viewing" || !!d.preferredDate, { message: "Choose a preferred date", path: ["preferredDate"] })
  .refine((d) => d.kind !== "part_exchange" || !!d.pxRegistration, { message: "Enter your registration", path: ["pxRegistration"] });

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const reportSchema = z.object({
  advertisementId: z.string().min(1).max(64),
  reason: z.enum(["scam", "incorrect_details", "stolen", "duplicate", "offensive", "sold", "spam", "other"]),
  details: z.string().trim().max(2000).optional(),
});

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = String(i.path[0] ?? "form"); out[k] ??= i.message; }
  return out;
}
