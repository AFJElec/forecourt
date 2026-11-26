"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl } from "@/config/site";
import { safeNext } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/clients";
import { supabaseServer } from "@/lib/supabase/server";

export interface AuthState { ok?: boolean; message?: string; errors?: Record<string, string> }

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const password = z.string().min(10, "Use at least 10 characters").max(128)
  .refine((p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p), "Include at least one letter and one number");

const NOT_CONFIGURED: AuthState = { message: "Accounts aren't switched on in this demo yet (Supabase isn't configured)." };

function errs(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : siteUrl;
}

/** Supabase error text is turned into neutral messages so we never reveal whether an email is registered. */
function friendly(message: string): string {
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/not confirmed/i.test(message)) return "Please confirm your email address first — check your inbox for the link.";
  return "Email or password is incorrect.";
}

export async function signInWithPassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error) };
  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { message: friendly(error.message) };
  redirect(safeNext(form.get("next")));
}

export async function sendMagicLink(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error) };
  const db = await supabaseServer();
  const next = safeNext(form.get("next"));
  await db.auth.signInWithOtp({ email: parsed.data.email, options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: false } });
  // Same message whether or not the account exists.
  return { ok: true, message: `If there's an account for ${parsed.data.email}, we've sent a sign-in link. It expires in 1 hour.` };
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({
    displayName: z.string().trim().min(2, "Enter your name").max(60),
    email, password,
    terms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms to continue" }) }),
    marketing: z.string().optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error) };
  const db = await supabaseServer();
  const { error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=/account`,
      data: { display_name: parsed.data.displayName, marketing_opt_in: parsed.data.marketing === "on" },
    },
  });
  if (error && /rate limit/i.test(error.message)) return { message: friendly(error.message) };
  if (error && /password/i.test(error.message)) return { errors: { password: error.message } };
  return { ok: true, message: `Nearly there — we've sent a confirmation link to ${parsed.data.email}. Open it to activate your account.` };
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error) };
  const db = await supabaseServer();
  await db.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${await origin()}/auth/callback?next=/reset-password` });
  return { ok: true, message: `If there's an account for ${parsed.data.email}, we've sent a link to reset your password.` };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ password, confirm: z.string() }).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: errs(parsed.error) };
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { message: "Your reset link has expired. Please request a new one." };
  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) return { errors: { password: error.message } };
  return { ok: true, message: "Password updated." };
}
