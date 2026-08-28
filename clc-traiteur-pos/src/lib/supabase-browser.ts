import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Devis } from "@/lib/types";

const ROW_ID = "main";

let browserClient: SupabaseClient | null = null;

/** Client Supabase navigateur (lazy — évite crash SSR si env absente). */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return browserClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Lecture des devis uniquement (léger, fiable). */
export async function loadDevisFromCloud(): Promise<{
  devis: Devis[];
  updatedAt: string | null;
  error: string | null;
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { devis: [], updatedAt: null, error: "Supabase non configuré dans l'application" };
  }

  const { data, error } = await supabase
    .from("clc_store")
    .select("devis_list_pro, updated_at")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    return { devis: [], updatedAt: null, error: error.message };
  }
  if (!data) {
    return { devis: [], updatedAt: null, error: null };
  }

  const devis = Array.isArray(data.devis_list_pro) ? (data.devis_list_pro as Devis[]) : [];
  return { devis, updatedAt: (data.updated_at as string) ?? null, error: null };
}

/** Écriture des devis uniquement (upsert partiel). */
export async function saveDevisToCloud(devisListPro: Devis[]): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Supabase non configuré dans l'application" };
  }

  const { error } = await supabase.from("clc_store").upsert(
    {
      id: ROW_ID,
      devis_list_pro: devisListPro,
      devis_list: devisListPro,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return { error: error.message };
  return { error: null };
}
