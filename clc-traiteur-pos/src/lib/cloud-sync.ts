import type { Devis } from "@/lib/types";
import type { AppState } from "@/lib/store";
import { useStore } from "@/lib/store";
import { mergeDevisLists } from "@/lib/supabase";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import {
  isSupabaseConfigured,
  loadDevisFromCloud,
  saveDevisToCloud,
} from "@/lib/supabase-browser";

export interface CloudSyncResult {
  configured: boolean;
  devisCount: number;
  devisIds: string[];
  updatedAt: string | null;
  loadError: string | null;
  saveError: string | null;
  source: "api-blob" | "supabase-direct" | "none";
}

function applyMergedDevis(merged: Devis[]) {
  const s = useStore.getState();
  const appMode = s.appMode ?? "pro";
  useStore.setState({
    devisListPro: merged,
    devisListLab: MOCK_DEVIS,
    devisList: appMode === "pro" ? merged : MOCK_DEVIS,
  });
}

export function buildSyncPayload(s: AppState) {
  return {
    devisListPro: s.devisListPro,
    devisListLab: s.devisListLab,
    devisList: s.devisList,
    appMode: s.appMode,
    theme: s.theme,
    customPrices: s.customPrices,
    customDishes: s.customDishes,
    customCategories: s.customCategories,
    entreesCapital: s.entreesCapital,
    ingredients: s.ingredients,
    materiel: s.materiel,
    customRecipes: s.customRecipes,
    demandesCourses: s.demandesCourses,
    demandesLogistique: s.demandesLogistique,
  };
}

/** Sync devis : union local + cloud via API (Vercel Blob), Supabase direct en secours. */
export async function runFullCloudSync(): Promise<CloudSyncResult> {
  const local = useStore.getState().devisListPro;

  // 1. Charger depuis l'API serveur (Vercel Blob — fiable)
  const apiLoad = await loadDevisViaApi();
  let cloud = apiLoad.devis;
  let cloudUpdatedAt = apiLoad.updatedAt;
  let loadErr = apiLoad.error;
  let source: CloudSyncResult["source"] = apiLoad.configured ? "api-blob" : "none";

  // 2. Secours Supabase direct si l'API échoue et Supabase est configuré
  if (isSupabaseConfigured() && (loadErr || cloud.length === 0)) {
    const direct = await loadDevisFromCloud();
    if (!direct.error && direct.devis.length > cloud.length) {
      cloud = direct.devis;
      cloudUpdatedAt = direct.updatedAt;
      loadErr = null;
      source = "supabase-direct";
    } else if (loadErr && direct.error) {
      loadErr = `${loadErr} | Supabase : ${direct.error}`;
    }
  }

  const configured = apiLoad.configured || isSupabaseConfigured();
  if (!configured) {
    return {
      configured: false,
      devisCount: local.length,
      devisIds: local.map((d) => d.id),
      updatedAt: null,
      loadError: "Stockage cloud non configuré sur Vercel",
      saveError: null,
      source: "none",
    };
  }

  const merged = mergeDevisLists(local, cloud);
  applyMergedDevis(merged);

  let saveError: string | null = null;
  const idsChanged =
    JSON.stringify(merged.map((d) => d.id).sort()) !==
    JSON.stringify(cloud.map((d) => d.id).sort());

  if (merged.length > cloud.length || idsChanged) {
    const apiSave = await pushDevisViaApi(merged);
    if (!apiSave.ok) {
      saveError = apiSave.error;
      if (isSupabaseConfigured()) {
        const direct = await saveDevisToCloud(merged);
        if (!direct.error) {
          saveError = null;
          source = "supabase-direct";
        } else if (saveError) {
          saveError = `${saveError} | Supabase : ${direct.error}`;
        }
      }
    }
  }

  const final = useStore.getState().devisListPro;
  return {
    configured: true,
    devisCount: final.length,
    devisIds: final.map((d) => d.id),
    updatedAt: cloudUpdatedAt,
    loadError: loadErr,
    saveError,
    source,
  };
}

export async function pushCloudStore(payload: Record<string, unknown>): Promise<boolean> {
  const devis = (payload.devisListPro as Devis[]) ?? [];
  const api = await pushDevisViaApi(devis);
  if (api.ok) return true;
  if (!isSupabaseConfigured()) return false;
  const { error } = await saveDevisToCloud(devis);
  return !error;
}

/** @deprecated Utiliser runFullCloudSync */
export async function fetchCloudStore() {
  const r = await runFullCloudSync();
  return {
    configured: r.configured,
    store: null,
    devisCount: r.devisCount,
    devisIds: r.devisIds,
    updatedAt: r.updatedAt,
    loadError: r.loadError ?? r.saveError,
    source: r.source,
  };
}

export function applyCloudMerge(cloudStore: { devisListPro?: Devis[] }) {
  const merged = mergeDevisLists(useStore.getState().devisListPro, cloudStore.devisListPro ?? []);
  applyMergedDevis(merged);
  return { needsCloudPush: true, devisCount: merged.length };
}

export function ensureDevisListView() {
  const s = useStore.getState();
  useStore.setState({
    devisListLab: MOCK_DEVIS,
    devisList: (s.appMode ?? "pro") === "pro" ? s.devisListPro : MOCK_DEVIS,
  });
}

async function pushDevisViaApi(devis: Devis[]): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetch("/api/sync/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devisListPro: devis }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

async function loadDevisViaApi(): Promise<{
  configured: boolean;
  devis: Devis[];
  updatedAt: string | null;
  error: string | null;
}> {
  try {
    const res = await fetch("/api/sync/devis", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        configured: data.configured ?? false,
        devis: [],
        updatedAt: null,
        error: data.error ?? `HTTP ${res.status}`,
      };
    }
    return {
      configured: data.configured !== false,
      devis: (data.devisListPro as Devis[]) ?? [],
      updatedAt: data.updatedAt ?? null,
      error: data.error ?? null,
    };
  } catch (err) {
    return {
      configured: false,
      devis: [],
      updatedAt: null,
      error: err instanceof Error ? err.message : "Erreur réseau",
    };
  }
}
