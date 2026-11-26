import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one." configured={supabaseConfigured()}
      footer={<Link href="/sign-in" className="font-semibold text-electric-600">Back to sign in</Link>}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
