import { mergeCloudStore, type mapSupabaseToStore } from "@/lib/supabase";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import type { AppState } from "@/lib/store";
import { useStore } from "@/lib/store";

export type MappedCloudStore = ReturnType<typeof mapSupabaseToStore>;

export interface CloudSyncApiResponse {
  configured: boolean;
  store: MappedCloudStore | null;
  devisCount: number;
  devisIds: string[];
  updatedAt: string | null;
  loadError: string | null;
  hasRow?: boolean;
}

export async function fetchCloudStore(): Promise<CloudSyncApiResponse | null> {
  try {
    const res = await fetch("/api/sync/store", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function pushCloudStore(payload: Record<string, unknown>): Promise<boolean> {
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

/** Fusionne le cloud dans le store local et retourne si un push cloud est nécessaire. */
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

/** Réaligne devisList sur appMode après chargement local. */
export function ensureDevisListView() {
  const s = useStore.getState();
  const appMode = s.appMode ?? "pro";
  useStore.setState({
    devisListLab: MOCK_DEVIS,
    devisList: appMode === "pro" ? s.devisListPro : MOCK_DEVIS,
  });
}
