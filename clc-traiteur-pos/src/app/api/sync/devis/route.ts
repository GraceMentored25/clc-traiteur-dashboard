import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { loadDevisFromBlob, saveDevisToBlob, isBlobConfigured } from "@/lib/devis-blob-store";
import { createSupabaseServer, getSupabaseConfigStatus, ROW_ID } from "@/lib/supabase-server";
import type { Devis } from "@/lib/types";

async function loadFromSupabase() {
  const supabase = createSupabaseServer();
  if (!supabase) return { devis: [] as Devis[], updatedAt: null as string | null, error: "Supabase non configuré" };

  try {
    const { data, error } = await supabase
      .from("clc_store")
      .select("devis_list_pro, updated_at")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) return { devis: [], updatedAt: null, error: error.message };
    const devis = (data?.devis_list_pro as Devis[]) ?? [];
    return { devis, updatedAt: data?.updated_at ?? null, error: null };
  } catch (err) {
    return {
      devis: [],
      updatedAt: null,
      error: err instanceof Error ? err.message : "Erreur Supabase",
    };
  }
}

async function saveToSupabase(devisListPro: Devis[]) {
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

/** GET — devis cloud (Vercel Blob prioritaire, Supabase en secours) */
export async function GET() {
  const guard = await requireSession();
  if (guard) return guard;

  const config = getSupabaseConfigStatus();
  const blobConfigured = isBlobConfigured();

  if (!blobConfigured && !config.urlConfigured) {
    return NextResponse.json({
      configured: false,
      devisCount: 0,
      error: "Aucun stockage cloud configuré",
      source: "none",
    });
  }

  const blob = blobConfigured ? await loadDevisFromBlob() : { devis: [], updatedAt: null, error: "Blob absent" };
  const supa = config.urlConfigured ? await loadFromSupabase() : { devis: [], updatedAt: null, error: null };

  const devis =
    blob.devis.length >= supa.devis.length ? blob.devis : supa.devis.length > blob.devis.length ? supa.devis : blob.devis;

  const updatedAt = blob.updatedAt ?? supa.updatedAt;
  const loadError = blob.error && supa.error ? blob.error : blob.error && !blobConfigured ? blob.error : supa.error;

  return NextResponse.json({
    configured: true,
    config: { ...config, blobConfigured },
    devisCount: devis.length,
    devisIds: devis.map((d) => d.id),
    devisListPro: devis,
    updatedAt,
    error: loadError,
    source: blob.devis.length >= supa.devis.length && blobConfigured ? "blob" : "supabase",
  });
}

/** POST — sauvegarde devis_list_pro (Blob prioritaire) */
export async function POST(req: NextRequest) {
  const guard = await requireSession();
  if (guard) return guard;

  let body: { devisListPro?: Devis[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const devisListPro = body.devisListPro ?? [];
  const blobConfigured = isBlobConfigured();

  if (!blobConfigured) {
    const supa = await saveToSupabase(devisListPro);
    if (supa.error) {
      return NextResponse.json({ ok: false, error: supa.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, devisCount: devisListPro.length, source: "supabase" });
  }

  const blob = await saveDevisToBlob(devisListPro);
  if (blob.error) {
    return NextResponse.json({ ok: false, error: blob.error }, { status: 500 });
  }

  // Miroir optionnel vers Supabase si disponible
  if (getSupabaseConfigStatus().urlConfigured) {
    await saveToSupabase(devisListPro);
  }

  return NextResponse.json({ ok: true, devisCount: devisListPro.length, source: "blob" });
}
