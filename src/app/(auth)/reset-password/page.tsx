import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { supabaseConfigured } from "@/lib/supabase/clients";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/** Reached from the reset email via /auth/callback, which signs the user in first. */
export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" configured={supabaseConfigured()}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
