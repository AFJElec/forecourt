export {};
export const createServerClient = () => { throw new Error("Supabase is not available in the static preview"); };
export const cookies = async () => ({ getAll: () => [], set: () => {} });
export const createClient = () => { throw new Error("Supabase is not available in the static preview"); };
export const createBrowserClient = createClient;
