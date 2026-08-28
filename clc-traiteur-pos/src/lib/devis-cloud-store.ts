import type { Devis } from "@/lib/types";
import { createSupabaseServer, getSupabaseConfigStatus, ROW_ID } from "@/lib/supabase-server";
import { loadDevisFromBlob, saveDevisToBlob, isBlobConfigured } from "@/lib/devis-blob-store";
import { mergeDevisLists } from "@/lib/supabase";

export type CloudStoreSource = "supabase" | "blob" | "none";

export function getCloudStoreStatus() {
  const supa = getSupabaseConfigStatus();
  return {
    supabaseConfigured: supa.urlConfigured && supa.anonKeyConfigured,
    supabaseServiceRole: supa.serviceRoleConfigured,
    blobConfigured: isBlobConfigured(),
  };
}

async function loadFromSupabase(): Promise<{
  devis: Devis[];
  updatedAt: string | null;
  error: string | null;
}> {
  const supabase = createSupabaseServer();
  if (!supabase) {
    return { devis: [], updatedAt: null, error: "Supabase non configuré" };
  }

  try {
    const { data, error } = await supabase
      .from("clc_store")
      .select("devis_list_pro, updated_at")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        return { devis: [], updatedAt: null, error: "Table clc_store absente — exécutez la migration SQL" };
      }
      return { devis: [], updatedAt: null, error: error.message };
    }

    const devis = Array.isArray(data?.devis_list_pro) ? (data!.devis_list_pro as Devis[]) : [];
    return { devis, updatedAt: (data?.updated_at as string) ?? null, error: null };
  } catch (err) {
    return {
      devis: [],
      updatedAt: null,
      error: err instanceof Error ? err.message : "Erreur Supabase",
    };
  }
}

async function saveToSupabase(devisListPro: Devis[]): Promise<{ error: string | null }> {
  const supabase = createSupabaseServer();
  if (!supabase) return { error: "Supabase non configuré" };

  try {
    const { error } = await supabase.from("clc_store").upsert(
      {
        id: ROW_ID,
        devis_list_pro: devisListPro,
        devis_list: devisListPro,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur Supabase" };
  }
}

/** Charge les devis : Supabase + Blob fusionnés (union par id). */
export async function loadDevisFromCloudStore(): Promise<{
  devis: Devis[];
  updatedAt: string | null;
  error: string | null;
  source: CloudStoreSource;
}> {
  const status = getCloudStoreStatus();
  if (!status.supabaseConfigured && !status.blobConfigured) {
    return { devis: [], updatedAt: null, error: "Aucun stockage cloud configuré", source: "none" };
  }

  const supa = status.supabaseConfigured
    ? await loadFromSupabase()
    : { devis: [], updatedAt: null, error: null };
  const blob = status.blobConfigured
    ? await loadDevisFromBlob()
    : { devis: [], updatedAt: null, error: null };

  const merged = mergeDevisLists(supa.devis, blob.devis);
  const updatedAt = supa.updatedAt ?? blob.updatedAt;

  let source: CloudStoreSource = "none";
  if (merged.length > 0) {
    source = supa.devis.length >= blob.devis.length && status.supabaseConfigured ? "supabase" : "blob";
  } else if (status.supabaseConfigured && !supa.error) {
    source = "supabase";
  } else if (status.blobConfigured) {
    source = "blob";
  }

  const error =
    merged.length > 0 ? null : supa.error && blob.error ? supa.error : supa.error ?? blob.error;

  return { devis: merged, updatedAt, error, source };
}

/** Sauvegarde les devis : Supabase prioritaire, miroir Blob en secours. */
export async function saveDevisToCloudStore(devisListPro: Devis[]): Promise<{
  error: string | null;
  source: CloudStoreSource;
}> {
  const status = getCloudStoreStatus();
  let primaryError: string | null = null;

  if (status.supabaseConfigured) {
    const supa = await saveToSupabase(devisListPro);
    if (!supa.error) {
      if (status.blobConfigured) await saveDevisToBlob(devisListPro);
      return { error: null, source: "supabase" };
    }
    primaryError = supa.error;
  }

  if (status.blobConfigured) {
    const blob = await saveDevisToBlob(devisListPro);
    if (!blob.error) return { error: null, source: "blob" };
    return { error: primaryError ? `${primaryError} | Blob : ${blob.error}` : blob.error, source: "none" };
  }

  return { error: primaryError ?? "Aucun stockage cloud configuré", source: "none" };
}
