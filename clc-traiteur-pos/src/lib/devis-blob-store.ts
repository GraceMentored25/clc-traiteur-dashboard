import { get, put } from "@vercel/blob";
import type { Devis } from "@/lib/types";

const BLOB_PATH = "clc/devis-list-pro.json";

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

type DevisBlobPayload = {
  devisListPro: Devis[];
  updatedAt: string;
};

function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("not found") || msg.includes("does not exist") || msg.includes("404");
}

/** Lecture des devis depuis Vercel Blob (stockage cloud fiable). */
export async function loadDevisFromBlob(): Promise<{
  devis: Devis[];
  updatedAt: string | null;
  error: string | null;
}> {
  if (!isBlobConfigured()) {
    return { devis: [], updatedAt: null, error: "Vercel Blob non configuré" };
  }

  try {
    const result = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { devis: [], updatedAt: null, error: null };
    }
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as DevisBlobPayload;
    return {
      devis: Array.isArray(parsed.devisListPro) ? parsed.devisListPro : [],
      updatedAt: parsed.updatedAt ?? result.blob.uploadedAt.toISOString(),
      error: null,
    };
  } catch (err) {
    if (isNotFoundError(err)) {
      return { devis: [], updatedAt: null, error: null };
    }
    return {
      devis: [],
      updatedAt: null,
      error: err instanceof Error ? err.message : "Erreur lecture Blob",
    };
  }
}

/** Écriture des devis dans Vercel Blob. */
export async function saveDevisToBlob(devisListPro: Devis[]): Promise<{ error: string | null }> {
  if (!isBlobConfigured()) {
    return { error: "Vercel Blob non configuré" };
  }

  try {
    const payload: DevisBlobPayload = {
      devisListPro,
      updatedAt: new Date().toISOString(),
    };
    await put(BLOB_PATH, JSON.stringify(payload), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur écriture Blob" };
  }
}
