import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/auth-forms";
import { getCurrentUser, safeNext } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Sign in" subtitle="Welcome back." configured={supabaseConfigured()}
      footer={<>New here? <Link href="/sign-up" className="font-semibold text-electric-600">Create an account</Link></>}>
      <SignInForm next={next} linkError={sp.error === "link"} />
    </AuthShell>
  );
}
