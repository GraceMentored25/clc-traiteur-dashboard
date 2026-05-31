"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import { List } from "@phosphor-icons/react";
import { loadFromSupabase, saveToSupabase, mapSupabaseToStore } from "@/lib/supabase";
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
import type { AppState } from "@/lib/store";

function buildPayload(s: AppState) {
  return {
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
  };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cloudReadyRef = useRef(false); // true une fois le chargement Supabase terminé

  useEffect(() => { setHydrated(true); }, []);

  // ── 1. Charger depuis Supabase au login ────────────────────────────────
  useEffect(() => {
    if (!hydrated || !user || cloudReadyRef.current) return;

    loadFromSupabase().then((data) => {
      if (data) {
        const mapped = mapSupabaseToStore(data as Record<string, unknown>);
        // Ne jamais écraser user
        const { user: _u, ...rest } = mapped;
        void _u;
        useStore.setState({
          ...rest,
          ingredients: rest.ingredients && (rest.ingredients as unknown[]).length > 0
            ? rest.ingredients as typeof DEFAULT_INGREDIENTS
            : DEFAULT_INGREDIENTS,
          materiel: rest.materiel && (rest.materiel as unknown[]).length > 0
            ? rest.materiel as typeof DEFAULT_MATERIEL
            : DEFAULT_MATERIEL,
        } as Partial<AppState>);
      }
      cloudReadyRef.current = true;
    });
  }, [hydrated, user]);

  // ── 2. Subscriber Zustand → sauvegarde immédiate dès que les devis changent
  useEffect(() => {
    if (!cloudReadyRef.current) return;

    const unsub = useStore.subscribe((state, prev) => {
      if (
        state.devisListPro !== prev.devisListPro ||
        state.devisListLab !== prev.devisListLab ||
        state.entreesCapital !== prev.entreesCapital
      ) {
        saveToSupabase(buildPayload(state));
      }
    });

    return () => unsub();
  }, [cloudReadyRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. Sauvegarde générale debounce 3s pour les autres changements ─────
  useEffect(() => {
    if (!hydrated || !user) return;

    let timer: ReturnType<typeof setTimeout>;
    const unsub = useStore.subscribe(() => {
      if (!cloudReadyRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveToSupabase(buildPayload(useStore.getState()));
      }, 3000);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [hydrated, user]);

  // ── 4. Sauvegarde avant fermeture de page (beforeunload) ──────────────
  useEffect(() => {
    if (!user) return;
    const handleBeforeUnload = () => {
      if (cloudReadyRef.current) {
        saveToSupabase(buildPayload(useStore.getState()));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

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
