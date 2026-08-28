-- Politiques RLS pour clc_store (sync multi-appareils)
-- À exécuter dans Supabase → SQL Editor si la sync cloud échoue.

ALTER TABLE IF EXISTS public.clc_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clc_store_anon_select" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_anon_insert" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_anon_update" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_authenticated_select" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_authenticated_insert" ON public.clc_store;
DROP POLICY IF EXISTS "clc_store_authenticated_update" ON public.clc_store;

CREATE POLICY "clc_store_anon_select" ON public.clc_store
  FOR SELECT TO anon USING (true);

CREATE POLICY "clc_store_anon_insert" ON public.clc_store
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "clc_store_anon_update" ON public.clc_store
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "clc_store_authenticated_select" ON public.clc_store
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clc_store_authenticated_insert" ON public.clc_store
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "clc_store_authenticated_update" ON public.clc_store
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
