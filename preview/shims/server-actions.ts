/** Preview shim: server actions can't run in a static page. */
const NOT_CONFIGURED = { message: "Accounts aren't switched on in this demo yet (Supabase isn't configured)." };
const na = async () => NOT_CONFIGURED;
export const signInWithPassword = na, sendMagicLink = na, signUp = na, requestPasswordReset = na, updatePassword = na, updateProfile = na;
export type AuthState = { ok?: boolean; message?: string; errors?: Record<string, string> };
export type ProfileState = AuthState;
