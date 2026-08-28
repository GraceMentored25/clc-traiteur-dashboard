import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { createSupabaseServer, getSupabaseConfigStatus } from "@/lib/supabase-server";
import { getCloudStoreStatus, loadDevisFromCloudStore } from "@/lib/devis-cloud-store";

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS public.clc_store (
  id text PRIMARY KEY DEFAULT 'main',
  devis_list_pro jsonb DEFAULT '[]'::jsonb,
  devis_list_lab jsonb DEFAULT '[]'::jsonb,
  devis_list jsonb DEFAULT '[]'::jsonb,
  app_mode text DEFAULT 'pro',
  theme text DEFAULT 'dark',
  custom_prices jsonb DEFAULT '{}'::jsonb,
  custom_dishes jsonb DEFAULT '[]'::jsonb,
  custom_categories jsonb DEFAULT '[]'::jsonb,
  entrees_capital jsonb DEFAULT '[]'::jsonb,
  ingredients jsonb,
  materiel jsonb,
  custom_recipes jsonb DEFAULT '[]'::jsonb,
  demandes_courses jsonb DEFAULT '[]'::jsonb,
  demandes_logistique jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.clc_store (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.clc_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clc_store_anon_select" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_anon_insert" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_anon_update" ON public.clc_store;
CREATE POLICY "clc_store_anon_select" ON public.clc_store FOR SELECT TO anon USING (true);
CREATE POLICY "clc_store_anon_insert" ON public.clc_store FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "clc_store_anon_update" ON public.clc_store FOR UPDATE TO anon USING (true) WITH CHECK (true);
`.trim();

/** GET — diagnostic Supabase + instructions si table absente */
export async function GET() {
  const guard = await requireSession();
  if (guard) return guard;

  const config = getSupabaseConfigStatus();
  const store = getCloudStoreStatus();
  const supabase = createSupabaseServer();

  let tableExists = false;
  let supabaseError: string | null = null;

  if (supabase) {
    const { error } = await supabase.from("clc_store").select("id").eq("id", "main").maybeSingle();
    if (!error) tableExists = true;
    else if (error.code === "42P01") tableExists = false;
    else supabaseError = error.message;
  }

  const cloud = await loadDevisFromCloudStore();

  return NextResponse.json({
    config,
    store,
    tableExists,
    supabaseError,
    devisInCloud: cloud.devis.length,
    cloudSource: cloud.source,
    migrationRequired: config.urlConfigured && !tableExists,
    setupSql: SETUP_SQL,
    instructions: tableExists
      ? "Supabase est prêt. Utilisez Synchroniser dans Gestion de devis."
      : [
          "1. Ouvrez Supabase → SQL Editor",
          "2. Collez le SQL retourné dans setupSql",
          "3. Exécutez la requête",
          "4. Revenez ici et cliquez Synchroniser",
        ],
  });
}
