import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import {
  getCloudStoreStatus,
  loadDevisFromCloudStore,
  saveDevisToCloudStore,
} from "@/lib/devis-cloud-store";
import type { Devis } from "@/lib/types";

/** GET — devis cloud (Supabase prioritaire, Blob secours) */
export async function GET() {
  const guard = await requireSession();
  if (guard) return guard;

  const status = getCloudStoreStatus();
  if (!status.supabaseConfigured && !status.blobConfigured) {
    return NextResponse.json({
      configured: false,
      devisCount: 0,
      error: "Aucun stockage cloud configuré",
      source: "none",
    });
  }

  const cloud = await loadDevisFromCloudStore();
  return NextResponse.json({
    configured: true,
    config: status,
    devisCount: cloud.devis.length,
    devisIds: cloud.devis.map((d) => d.id),
    devisListPro: cloud.devis,
    updatedAt: cloud.updatedAt,
    error: cloud.error,
    source: cloud.source,
  });
}

/** POST — sauvegarde devis_list_pro */
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
  const save = await saveDevisToCloudStore(devisListPro);
  if (save.error) {
    return NextResponse.json({ ok: false, error: save.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, devisCount: devisListPro.length, source: save.source });
}
