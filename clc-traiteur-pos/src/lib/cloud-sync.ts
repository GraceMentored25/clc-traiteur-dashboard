import {
  loadFromSupabase,
  saveToSupabase,
  mapSupabaseToStore,
  mergeCloudStore,
  type mapSupabaseToStore as MapFn,
} from "@/lib/supabase";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import type { AppState } from "@/lib/store";
import { useStore } from "@/lib/store";

export type MappedCloudStore = ReturnType<typeof MapFn>;

export interface CloudSyncApiResponse {
  configured: boolean;
  store: MappedCloudStore | null;
  devisCount: number;
  devisIds: string[];
  updatedAt: string | null;
  loadError: string | null;
  source?: "direct" | "api";
}

function toResponse(
  store: MappedCloudStore | null,
  raw: Record<string, unknown> | null,
  loadError: string | null,
  source: "direct" | "api"
): CloudSyncApiResponse {
  const devisListPro = store?.devisListPro ?? [];
  return {
    configured: true,
    store,
    devisCount: devisListPro.length,
    devisIds: devisListPro.map((d) => d.id),
    updatedAt: (raw?.updated_at as string) ?? null,
    loadError,
    source,
  };
}

/** Lecture directe Supabase depuis le navigateur (contourne l'erreur Vercel→Supabase). */
async function fetchCloudStoreDirect(): Promise<CloudSyncApiResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      configured: false,
      store: null,
      devisCount: 0,
      devisIds: [],
      updatedAt: null,
      loadError: "Clés Supabase absentes du build",
      source: "direct",
    };
  }

  const { data, error } = await loadFromSupabase();
  if (error) {
    return {
      configured: true,
      store: null,
      devisCount: 0,
      devisIds: [],
      updatedAt: null,
      loadError: error,
      source: "direct",
    };
  }

  const store = data ? mapSupabaseToStore(data) : null;
  return toResponse(store, data, null, "direct");
}

/** Lecture via API serveur (secours si direct échoue côté client). */
async function fetchCloudStoreApi(): Promise<CloudSyncApiResponse | null> {
  try {
    const res = await fetch("/api/sync/store", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return { ...data, source: "api" as const };
  } catch {
    return null;
  }
}

/** Charge le cloud — priorité au client direct (fonctionne sur tous les appareils). */
export async function fetchCloudStore(): Promise<CloudSyncApiResponse | null> {
  const direct = await fetchCloudStoreDirect();
  if (!direct.loadError) return direct;

  const api = await fetchCloudStoreApi();
  if (api && !api.loadError) return api;

  return direct;
}

/** Écriture directe Supabase depuis le navigateur. */
async function pushCloudStoreDirect(payload: Record<string, unknown>): Promise<boolean> {
  const { error } = await saveToSupabase(payload);
  if (error) console.error("[cloud push direct]", error);
  return !error;
}

async function pushCloudStoreApi(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/sync/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.ok !== false;
  } catch {
    return false;
  }
}

/** Pousse vers le cloud — direct d'abord, API en secours. */
export async function pushCloudStore(payload: Record<string, unknown>): Promise<boolean> {
  const okDirect = await pushCloudStoreDirect(payload);
  if (okDirect) return true;
  return pushCloudStoreApi(payload);
}

/** Fusionne le cloud dans le store local. */
export function applyCloudMerge(cloudStore: MappedCloudStore) {
  const current = useStore.getState();
  const { merged, needsCloudPush } = mergeCloudStore(current, cloudStore);
  const { user: _u, ...rest } = merged;
  void _u;

  useStore.setState(rest as Partial<AppState>);
  return { needsCloudPush, devisCount: merged.devisListPro.length };
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

export function ensureDevisListView() {
  const s = useStore.getState();
  const appMode = s.appMode ?? "pro";
  useStore.setState({
    devisListLab: MOCK_DEVIS,
    devisList: appMode === "pro" ? s.devisListPro : MOCK_DEVIS,
  });
}

/**
 * Sync complète : fusionne local + cloud (union de tous les devis)
 * puis pousse la version la plus complète vers Supabase.
 */
export async function runFullCloudSync(): Promise<CloudSyncApiResponse | null> {
  const beforeCount = useStore.getState().devisListPro.length;
  const cloudResp = await fetchCloudStore();

  if (cloudResp?.loadError) {
    console.error("[cloud sync]", cloudResp.loadError);
  }

  if (cloudResp?.store) {
    const { needsCloudPush } = applyCloudMerge(cloudResp.store);
    const state = useStore.getState();
    const afterCount = state.devisListPro.length;

    if (needsCloudPush || afterCount > (cloudResp.devisCount ?? 0) || afterCount !== beforeCount) {
      await pushCloudStore(buildSyncPayload(state));
    }
    return fetchCloudStore();
  }

  ensureDevisListView();
  const state = useStore.getState();
  if (state.devisListPro.length > 0) {
    await pushCloudStore(buildSyncPayload(state));
    return fetchCloudStore();
  }

  return cloudResp;
}
