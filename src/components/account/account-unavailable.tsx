import { PlannedFeature } from "@/components/common/planned-feature";

/** Shown on account pages when Supabase isn't configured (demo deployments). */
export function AccountUnavailable() {
  return (
    <PlannedFeature
      title="Accounts aren't switched on in this demo"
      phase={2}
      summary="Account features are built and go live as soon as a Supabase project is connected. Until then, saved vehicles and searches are kept on this device."
      bullets={["Sign up, sign in with password or email link, password reset", "Saved vehicles, saved searches and recently viewed synced across devices", "Price-drop and new-listing alerts", "Profile, notification preferences, data download and account deletion"]}
      credentials={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]}
    />
  );
}
