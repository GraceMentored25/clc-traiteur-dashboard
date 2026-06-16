"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { applyTheme } from "@/lib/themes";
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
  const accentColor = useStore((s) => s.accentColor);
  const themeId = useStore((s) => s.themeId);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cloudReadyRef = useRef(false); // true une fois le chargement Supabase terminé

  useEffect(() => {
    // Restaurer l'user depuis le cookie de session (store chiffré async ne persiste plus user)
    if (!user) {
      fetch("/api/auth/session")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.authenticated) {
            useStore.setState({
              user: { username: data.username, role: "admin", displayName: "Administrateur" }
            });
          }
          setHydrated(true);
        })
        .catch(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Applique le thème complet puis l'accent et la couleur secondaire
  useEffect(() => {
    applyTheme(themeId ?? "nuit", accentColor ?? "#E8960C");
  }, [themeId, accentColor]);

  // Applique la couleur secondaire (après le thème, pour recalculer les bonnes bases)
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("clc-secondary-color") : null;
    const c = saved ?? "#8B949E";
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return;
    const root = document.documentElement;
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    root.style.setProperty("--secondary-color", c);
    root.style.setProperty("--secondary-bg", `rgba(${r},${g},${b},0.10)`);
    root.style.setProperty("--secondary-border", `rgba(${r},${g},${b},0.30)`);
    const isDark = !root.classList.contains("light");
    const mix = isDark ? 0.07 : 0.06;
    const tint = [r, g, b];
    const blend = (base: number[], op: number) => base.map((v, i) => Math.round(v * (1 - op) + tint[i] * op));
    if (isDark) {
      root.style.setProperty("--surface-2", `rgb(${blend([28,33,40], 0.10).join(",")})`);
      root.style.setProperty("--surface-3", `rgb(${blend([37,43,52], 0.12).join(",")})`);
    } else {
      root.style.setProperty("--surface-2", `rgb(${blend([240,242,245], 0.18).join(",")})`);
      root.style.setProperty("--surface-3", `rgb(${blend([228,231,236], 0.22).join(",")})`);
      root.style.setProperty("--text-secondary", `rgba(${Math.round(r*0.4)},${Math.round(g*0.4)},${Math.round(b*0.4)},0.85)`);
    }
  }, [themeId]); // recalcule quand le thème change

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
    if (hydrated && !user) router.replace("/");
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
