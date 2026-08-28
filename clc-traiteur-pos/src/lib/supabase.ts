import { createClient } from "@supabase/supabase-js";
import type { Devis } from "@/lib/types";
import { MOCK_DEVIS } from "@/lib/data/mock-events";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

const ROW_ID = "main";

function pickNewerDevis(a: Devis, b: Devis): Devis {
  const aTs = new Date(a.createdAt).getTime();
  const bTs = new Date(b.createdAt).getTime();
  const newer = aTs >= bTs ? a : b;
  const older = aTs >= bTs ? b : a;
  return { ...older, ...newer };
}

/** Fusionne deux listes de devis par id (union — garde toutes les entrées, version la plus récente par id). */
export function mergeDevisLists(local: Devis[] = [], cloud: Devis[] = []): Devis[] {
  const map = new Map<string, Devis>();
  for (const d of cloud) map.set(d.id, d);
  for (const d of local) {
    const existing = map.get(d.id);
    map.set(d.id, existing ? pickNewerDevis(d, existing) : d);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Charger tout le store depuis Supabase
export async function loadFromSupabase(): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("clc_store")
    .select("*")
    .eq("id", ROW_ID)
    .single();

  if (error?.code === "PGRST116") {
    return { data: null, error: null };
  }
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Record<string, unknown>, error: null };
}

// Sauvegarder tout le store dans Supabase (upsert)
export async function saveToSupabase(state: Record<string, unknown>): Promise<{ error: string | null }> {
  const { error } = await supabase.from("clc_store").upsert({
    id: ROW_ID,
    devis_list_pro: state.devisListPro,
    devis_list_lab: state.devisListLab,
    devis_list: state.devisList,
    app_mode: state.appMode,
    theme: state.theme,
    custom_prices: state.customPrices,
    custom_dishes: state.customDishes,
    custom_categories: state.customCategories,
    entrees_capital: state.entreesCapital,
    ingredients: state.ingredients,
    materiel: state.materiel,
    custom_recipes: state.customRecipes,
    demandes_courses: state.demandesCourses,
    demandes_logistique: state.demandesLogistique,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("Supabase save error:", error);
  return { error: error?.message ?? null };
}

// Helper : sauvegarde immédiate de l'état courant du store
export async function syncStoreNow() {
  const { useStore } = await import("@/lib/store");
  const s = useStore.getState();
  const payload = {
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

  const { pushCloudStore } = await import("@/lib/cloud-sync");
  await pushCloudStore(payload);
}

/** Fusionne l'état local avec le cloud — ne jamais perdre des devis locaux. */
export function mergeCloudStore(
  local: {
    devisListPro: Devis[];
    appMode: "pro" | "lab";
  },
  cloud: ReturnType<typeof mapSupabaseToStore>
) {
  const mergedPro = mergeDevisLists(local.devisListPro, cloud.devisListPro ?? []);
  const appMode = local.appMode ?? cloud.appMode ?? "pro";
  const cloudPro = cloud.devisListPro ?? [];
  const needsCloudPush =
    mergedPro.length !== cloudPro.length ||
    JSON.stringify(mergedPro.map((d) => d.id).sort()) !==
      JSON.stringify(cloudPro.map((d) => d.id).sort());

  return {
    merged: {
      ...cloud,
      appMode,
      devisListPro: mergedPro,
      devisListLab: MOCK_DEVIS,
      devisList: appMode === "pro" ? mergedPro : MOCK_DEVIS,
    },
    needsCloudPush,
  };
}

// Mapper les colonnes Supabase vers le format store
export function mapSupabaseToStore(data: Record<string, unknown>) {
  return {
    user: data.user_data,
    devisListPro: (data.devis_list_pro as Devis[]) ?? [],
    devisListLab: (data.devis_list_lab as Devis[]) ?? [],
    devisList: (data.devis_list as Devis[]) ?? [],
    appMode: (data.app_mode as "pro" | "lab") ?? "pro",
    theme: data.theme ?? "dark",
    customPrices: data.custom_prices ?? {},
    customDishes: data.custom_dishes ?? [],
    customCategories: data.custom_categories ?? [],
    entreesCapital: data.entrees_capital ?? [],
    ingredients: data.ingredients,
    materiel: data.materiel,
    customRecipes: data.custom_recipes ?? [],
    demandesCourses: data.demandes_courses ?? [],
    demandesLogistique: data.demandes_logistique ?? [],
  };
}
