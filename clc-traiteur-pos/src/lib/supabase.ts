import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

const ROW_ID = "main";

// Charger tout le store depuis Supabase
export async function loadFromSupabase() {
  const { data, error } = await supabase
    .from("clc_store")
    .select("*")
    .eq("id", ROW_ID)
    .single();
  if (error || !data) return null;
  return data;
}

// Sauvegarder tout le store dans Supabase (upsert)
export async function saveToSupabase(state: Record<string, unknown>) {
  const { error } = await supabase.from("clc_store").upsert({
    id: ROW_ID,
    // user_data intentionnellement absent — la session ne doit pas être stockée en DB
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
}

// Helper : sauvegarde immédiate de l'état courant du store
export async function syncStoreNow() {
  // Import dynamique pour éviter les dépendances circulaires
  const { useStore } = await import("@/lib/store");
  const s = useStore.getState();
  await saveToSupabase({
    user: s.user,
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
  });
}

// Mapper les colonnes Supabase vers le format store
export function mapSupabaseToStore(data: Record<string, unknown>) {
  return {
    user: data.user_data,
    devisListPro: data.devis_list_pro ?? [],
    devisListLab: data.devis_list_lab ?? [],
    devisList: data.devis_list ?? [],
    appMode: data.app_mode ?? "pro",
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
