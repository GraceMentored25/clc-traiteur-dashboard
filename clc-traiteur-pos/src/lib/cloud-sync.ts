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
  source: "devis-direct";
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

/** Sync devis : union local + cloud, puis push de la version la plus complète. */
export async function runFullCloudSync(): Promise<CloudSyncResult> {
  const configured = isSupabaseConfigured();
  const local = useStore.getState().devisListPro;

  if (!configured) {
    return {
      configured: false,
      devisCount: local.length,
      devisIds: local.map((d) => d.id),
      updatedAt: null,
      loadError: "Variables Supabase absentes du déploiement Vercel",
      saveError: null,
      source: "devis-direct",
    };
  }

  const { devis: cloudDevis, updatedAt, error: loadError } = await loadDevisFromCloud();
  let cloud = cloudDevis;
  let loadErr = loadError;
  let cloudUpdatedAt = updatedAt;

  if (loadError) {
    const apiLoad = await loadDevisViaApi();
    if (!apiLoad.error && apiLoad.devis.length >= cloudDevis.length) {
      cloud = apiLoad.devis;
      cloudUpdatedAt = apiLoad.updatedAt;
      loadErr = null;
    }
  }

  const merged = mergeDevisLists(local, cloud);

  applyMergedDevis(merged);

  let saveError: string | null = null;
  const idsChanged =
    JSON.stringify(merged.map((d) => d.id).sort()) !==
    JSON.stringify(cloud.map((d) => d.id).sort());

  if (merged.length > cloud.length || idsChanged || merged.length > 0) {
    const save = await saveDevisToCloud(merged);
    saveError = save.error;

    if (!save.error) {
      const verify = await loadDevisFromCloud();
      if (verify.error) saveError = verify.error;
      else if (verify.devis.length < merged.length) {
        saveError =
          "Écriture refusée par Supabase (politiques RLS — exécutez supabase/migrations/20260828100000_clc_store_rls.sql)";
      }
    } else {
      const apiSave = await pushDevisViaApi(merged);
      if (apiSave.ok) saveError = null;
      else if (apiSave.error) saveError = apiSave.error;
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
    source: "devis-direct",
  };
}

export async function pushCloudStore(payload: Record<string, unknown>): Promise<boolean> {
  const devis = (payload.devisListPro as Devis[]) ?? [];
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
  devis: Devis[];
  updatedAt: string | null;
  error: string | null;
}> {
  try {
    const res = await fetch("/api/sync/devis", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { devis: [], updatedAt: null, error: data.error ?? `HTTP ${res.status}` };
    }
    return {
      devis: (data.devisListPro as Devis[]) ?? [],
      updatedAt: data.updatedAt ?? null,
      error: data.error ?? null,
    };
  } catch (err) {
    return { devis: [], updatedAt: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}
