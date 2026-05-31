"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import { List } from "@phosphor-icons/react";
import { loadFromSupabase, saveToSupabase, mapSupabaseToStore } from "@/lib/supabase";
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
import type { AppState } from "@/lib/store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cloudLoadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setHydrated(true); }, []);

  // ── Charger depuis Supabase au login (une seule fois) ──────────────────
  useEffect(() => {
    if (!hydrated || !user || cloudLoadedRef.current) return;
    cloudLoadedRef.current = true;

    loadFromSupabase().then((data) => {
      if (!data) return;
      const mapped = mapSupabaseToStore(data as Record<string, unknown>);

      // NE PAS écraser user — on ne met à jour que les données métier
      const { user: _ignore, ...rest } = mapped;
      void _ignore;

      useStore.setState({
        ...rest,
        ingredients: (rest.ingredients && (rest.ingredients as unknown[]).length > 0)
          ? rest.ingredients as typeof DEFAULT_INGREDIENTS
          : DEFAULT_INGREDIENTS,
        materiel: (rest.materiel && (rest.materiel as unknown[]).length > 0)
          ? rest.materiel as typeof DEFAULT_MATERIEL
          : DEFAULT_MATERIEL,
      } as Partial<AppState>);
    });
  }, [hydrated, user]);

  // ── Sauvegarder vers Supabase (debounce 2s, après chargement initial) ──
  useEffect(() => {
    if (!cloudLoadedRef.current || !user) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const s = useStore.getState();
      saveToSupabase({
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
    }, 2000);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  });

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  if (!hydrated) return null;
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[var(--surface)]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 min-h-[100dvh] overflow-x-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-1)] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <List size={20} />
          </button>
          <p className="text-sm font-bold text-[var(--text-primary)]">C.LC. Traiteur</p>
        </div>
        {children}
      </main>
    </div>
  );
}
