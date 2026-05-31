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
  const store = useStore();
  const user = store.user;
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setHydrated(true); }, []);

  // ── Charger depuis Supabase au login (une seule fois) ──────────────────
  useEffect(() => {
    if (!hydrated || !user || cloudLoaded) return;

    loadFromSupabase().then((data) => {
      if (data) {
        const mapped = mapSupabaseToStore(data as Record<string, unknown>);
        useStore.setState({
          ...mapped,
          ingredients: (mapped.ingredients && (mapped.ingredients as unknown[]).length > 0)
            ? mapped.ingredients as typeof DEFAULT_INGREDIENTS
            : DEFAULT_INGREDIENTS,
          materiel: (mapped.materiel && (mapped.materiel as unknown[]).length > 0)
            ? mapped.materiel as typeof DEFAULT_MATERIEL
            : DEFAULT_MATERIEL,
        } as Partial<AppState>);
      }
      setCloudLoaded(true); // permettre la sauvegarde maintenant
    });
  }, [hydrated, user, cloudLoaded]);

  // ── Sauvegarder vers Supabase à chaque changement du store ────────────
  // Ne sauvegarde qu'après le chargement initial (évite d'écraser les données cloud)
  useEffect(() => {
    if (!cloudLoaded || !user) return;

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
  }); // sans dépendances = se déclenche à chaque render post-cloudLoaded

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

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
