import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <AuthShell title="Create your account" subtitle="Free for buyers. Takes under a minute." configured={supabaseConfigured()}
      footer={<>Already have an account? <Link href="/sign-in" className="font-semibold text-electric-600">Sign in</Link></>}>
      <SignUpForm />
    </AuthShell>
  );
}
