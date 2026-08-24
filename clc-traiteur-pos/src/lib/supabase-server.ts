import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROW_ID = "main";

/** Client Supabase côté serveur (service role si dispo, sinon anon). */
export function createSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey ?? anonKey;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseConfigStatus() {
  return {
    urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export { ROW_ID };
