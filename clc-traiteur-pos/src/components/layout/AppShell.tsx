"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { applyTheme } from "@/lib/themes";
import Sidebar from "./Sidebar";
import { List } from "@phosphor-icons/react";
import { mapSupabaseToStore, mergeCloudStore } from "@/lib/supabase";
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import type { AppState } from "@/lib/store";
import type { Devis } from "@/lib/types";

interface CloudSyncResponse {
  configured: boolean;
  store: {
    devisListPro: Devis[];
    devisList: Devis[];
    appMode: "pro" | "lab";
    [key: string]: unknown;
  } | null;
  devisCount: number;
  loadError?: string | null;
}

async function loadCloudStore(): Promise<CloudSyncResponse | null> {
  try {
    const res = await fetch("/api/sync/store", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function saveCloudStore(payload: ReturnType<typeof buildPayload>) {
  try {
    await fetch("/api/sync/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[cloud save]", err);
  }
}

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
  const [cloudReady, setCloudReady] = useState(false);

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
    root.style.setProperty("--secondary-bg", `rgba(${r},${g},${b},0.08)`);
    root.style.setProperty("--secondary-border", `rgba(${r},${g},${b},0.25)`);
    const isDark = !root.classList.contains("light");
    const mix = isDark ? 0.07 : 0.06;
    const tint = [r, g, b];
    root.style.setProperty("--surface-2", `rgba(${r},${g},${b},0.10)`);
    root.style.setProperty("--surface-3", `rgba(${r},${g},${b},0.18)`);
    if (!isDark) {
      root.style.setProperty("--surface-2", `rgba(${r},${g},${b},0.13)`);
      root.style.setProperty("--surface-3", `rgba(${r},${g},${b},0.22)`);
      root.style.setProperty("--text-secondary", `rgba(${Math.round(r*0.35)},${Math.round(g*0.35)},${Math.round(b*0.35)},0.9)`);
    }
    // Hover texte : version très foncée en mode clair, couleur pure en mode sombre
    const darkHover = isDark
      ? `rgb(${r},${g},${b})`
      : `rgb(${Math.round(r*0.3)},${Math.round(g*0.3)},${Math.round(b*0.3)})`;
    root.style.setProperty("--secondary-text-hover", darkHover);
  }, [themeId]); // recalcule quand le thème change

  // ── 1. Charger depuis Supabase au login (fusion avec le local) ─────────
  useEffect(() => {
    if (!hydrated || !user || cloudReady) return;

    loadCloudStore().then((cloudResp) => {
      const current = useStore.getState();

      if (cloudResp?.loadError) {
        console.error("[cloud sync]", cloudResp.loadError);
      }

      if (cloudResp?.store) {
        const cloudMapped = mapSupabaseToStore(cloudResp.store as Record<string, unknown>);
        const { merged, needsCloudPush } = mergeCloudStore(current, cloudMapped);
        const { user: _u, ...rest } = merged;
        void _u;

        useStore.setState({
          ...rest,
          ingredients: current.ingredients?.length
            ? current.ingredients
            : rest.ingredients && (rest.ingredients as unknown[]).length > 0
              ? (rest.ingredients as typeof DEFAULT_INGREDIENTS)
              : DEFAULT_INGREDIENTS,
          materiel: current.materiel?.length
            ? current.materiel
            : rest.materiel && (rest.materiel as unknown[]).length > 0
              ? (rest.materiel as typeof DEFAULT_MATERIEL)
              : DEFAULT_MATERIEL,
        } as Partial<AppState>);

        if (needsCloudPush) {
          saveCloudStore(buildPayload(useStore.getState()));
        }
      } else if (current.devisListPro.length > 0) {
        // Premier appareil avec des devis locaux : initialiser le cloud
        saveCloudStore(buildPayload(current));
      } else {
        // Réhydratation locale : s'assurer que devisList reflète appMode
        const appMode = current.appMode ?? "pro";
        useStore.setState({
          devisListLab: MOCK_DEVIS,
          devisList: appMode === "pro" ? current.devisListPro : MOCK_DEVIS,
        });
      }

      setCloudReady(true);
    });
  }, [hydrated, user, cloudReady]);

  // ── 2. Subscriber Zustand → sauvegarde immédiate dès que les devis changent
  useEffect(() => {
    if (!cloudReady) return;

    const unsub = useStore.subscribe((state, prev) => {
      if (
        state.devisListPro !== prev.devisListPro ||
        state.devisListLab !== prev.devisListLab ||
        state.entreesCapital !== prev.entreesCapital
      ) {
        saveCloudStore(buildPayload(state));
      }
    });

    return () => unsub();
  }, [cloudReady]);

  // ── 3. Sauvegarde générale debounce 3s pour les autres changements ─────
  useEffect(() => {
    if (!hydrated || !user) return;

    let timer: ReturnType<typeof setTimeout>;
    const unsub = useStore.subscribe(() => {
      if (!cloudReady) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveCloudStore(buildPayload(useStore.getState()));
      }, 3000);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [hydrated, user, cloudReady]);

  // ── 4. Sauvegarde avant fermeture de page (beforeunload) ──────────────
  useEffect(() => {
    if (!user) return;
    const handleBeforeUnload = () => {
      if (cloudReady) {
        saveCloudStore(buildPayload(useStore.getState()));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user, cloudReady]);

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
      <span className="fixed bottom-2 right-3 text-[10px] font-mono text-[var(--text-muted)]/50 select-none pointer-events-none z-50">
        {process.env.NEXT_PUBLIC_COMMIT_HASH}
      </span>
    </div>
  );
}
