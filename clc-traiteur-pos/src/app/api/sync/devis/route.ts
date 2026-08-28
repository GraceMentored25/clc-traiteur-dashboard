import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { createSupabaseServer, getSupabaseConfigStatus, ROW_ID } from "@/lib/supabase-server";
import type { Devis } from "@/lib/types";

/** GET — nombre de devis dans le cloud */
export async function GET() {
  const guard = await requireSession();
  if (guard) return guard;

  const config = getSupabaseConfigStatus();
  const supabase = createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ configured: false, devisCount: 0, error: "Supabase non configuré" });
  }

  try {
    const { data, error } = await supabase
      .from("clc_store")
      .select("devis_list_pro, updated_at")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ configured: true, config, devisCount: 0, error: error.message });
    }

    const devis = (data?.devis_list_pro as Devis[]) ?? [];
    return NextResponse.json({
      configured: true,
      config,
      devisCount: devis.length,
      devisIds: devis.map((d) => d.id),
      devisListPro: devis,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      config,
      devisCount: 0,
      error: err instanceof Error ? err.message : "Erreur serveur",
    });
  }
}

/** POST — sauvegarde devis_list_pro (service role si disponible) */
export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (guard) return guard;

  const supabase = createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 503 });
  }

  let body: { devisListPro?: Devis[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const devisListPro = body.devisListPro ?? [];
  const { error } = await supabase.from("clc_store").upsert(
    {
      id: ROW_ID,
      devis_list_pro: devisListPro,
      devis_list: devisListPro,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, devisCount: devisListPro.length });
}
