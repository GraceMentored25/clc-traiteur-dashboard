-- Schéma complet clc_store (à exécuter si vous recréez le projet Supabase)
-- Supabase → SQL Editor → New query → Run

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
DROP POLICY IF EXISTS "clc_store_authenticated_select" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_authenticated_insert" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_authenticated_update" ON public.clc_store;

CREATE POLICY "clc_store_anon_select" ON public.clc_store FOR SELECT TO anon USING (true);
CREATE POLICY "clc_store_anon_insert" ON public.clc_store FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "clc_store_anon_update" ON public.clc_store FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "clc_store_authenticated_select" ON public.clc_store FOR SELECT TO authenticated USING (true);
CREATE POLICY "clc_store_authenticated_insert" ON public.clc_store FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clc_store_authenticated_update" ON public.clc_store FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
