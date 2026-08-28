import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { createSupabaseServer, getSupabaseConfigStatus, ROW_ID } from "@/lib/supabase-server";
import { mapSupabaseToStore } from "@/lib/supabase";

function buildUpsertPayload(state: Record<string, unknown>) {
  return {
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
  };
}

/** GET — charge le store cloud + métadonnées de diagnostic */
export async function GET() {
  const guard = await requireSession();
  if (guard) return guard;

  const config = getSupabaseConfigStatus();
  const supabase = createSupabaseServer();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      config,
      store: null,
      devisCount: 0,
      devisIds: [],
      loadError: "Variables Supabase manquantes sur ce déploiement",
    });
  }

  try {
    const { data, error } = await supabase
      .from("clc_store")
      .select("*")
      .eq("id", ROW_ID)
      .single();

    const rowMissing = error?.code === "PGRST116";
    if (error && !rowMissing) {
      console.error("[sync/store GET]", error);
      return NextResponse.json({
        configured: true,
        config,
        store: null,
        hasRow: false,
        devisCount: 0,
        devisIds: [],
        updatedAt: null,
        loadError: error.message,
        loadErrorCode: error.code,
      });
    }

    const store = data ? mapSupabaseToStore(data as Record<string, unknown>) : null;
    const devisListPro = store?.devisListPro ?? [];

    return NextResponse.json({
      configured: true,
      config,
      store,
      hasRow: Boolean(data),
      devisCount: devisListPro.length,
      devisIds: devisListPro.map((d) => d.id),
      updatedAt: (data as { updated_at?: string } | null)?.updated_at ?? null,
      loadError: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("[sync/store GET] exception", err);
    return NextResponse.json({
      configured: true,
      config,
      store: null,
      devisCount: 0,
      devisIds: [],
      loadError: message,
      hint: "Le client navigateur utilisera la sync directe Supabase",
    });
  }
}

/** POST — sauvegarde le store dans Supabase */
export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (guard) return guard;

  const supabase = createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const { error } = await supabase.from("clc_store").upsert(buildUpsertPayload(body));
  if (error) {
    console.error("[sync/store POST]", error);
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
