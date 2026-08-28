"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { applyTheme } from "@/lib/themes";
import Sidebar from "./Sidebar";
import { List } from "@phosphor-icons/react";
import { buildSyncPayload, pushCloudStore, runFullCloudSync } from "@/lib/cloud-sync";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const accentColor = useStore((s) => s.accentColor);
  const themeId = useStore((s) => s.themeId);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);

  const syncNow = useCallback(async () => {
    await runFullCloudSync();
  }, []);

  useEffect(() => {
    if (!user) {
      fetch("/api/auth/session")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.authenticated) {
            useStore.setState({
              user: { username: data.username, role: "admin", displayName: "Administrateur" },
            });
          }
          setHydrated(true);
        })
        .catch(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setStoreReady(true);
      return;
    }
    return useStore.persist.onFinishHydration(() => setStoreReady(true));
  }, []);

  useEffect(() => {
    applyTheme(themeId ?? "nuit", accentColor ?? "#E8960C");
  }, [themeId, accentColor]);

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
    root.style.setProperty("--surface-2", `rgba(${r},${g},${b},0.10)`);
    root.style.setProperty("--surface-3", `rgba(${r},${g},${b},0.18)`);
    if (!isDark) {
      root.style.setProperty("--surface-2", `rgba(${r},${g},${b},0.13)`);
      root.style.setProperty("--surface-3", `rgba(${r},${g},${b},0.22)`);
      root.style.setProperty("--text-secondary", `rgba(${Math.round(r * 0.35)},${Math.round(g * 0.35)},${Math.round(b * 0.35)},0.9)`);
    }
    const darkHover = isDark
      ? `rgb(${r},${g},${b})`
      : `rgb(${Math.round(r * 0.3)},${Math.round(g * 0.3)},${Math.round(b * 0.3)})`;
    root.style.setProperty("--secondary-text-hover", darkHover);
  }, [themeId]);

  // Sync cloud après réhydratation localStorage
  useEffect(() => {
    if (!hydrated || !user || !storeReady || cloudReady) return;
    runFullCloudSync().finally(() => setCloudReady(true));
  }, [hydrated, user, storeReady, cloudReady]);

  useEffect(() => {
    if (!cloudReady) return;

    const unsub = useStore.subscribe((state, prev) => {
      if (
        state.devisListPro !== prev.devisListPro ||
        state.devisListLab !== prev.devisListLab ||
        state.entreesCapital !== prev.entreesCapital
      ) {
        pushCloudStore(buildSyncPayload(state));
      }
    });

    return () => unsub();
  }, [cloudReady]);

  useEffect(() => {
    if (!hydrated || !user) return;

    let timer: ReturnType<typeof setTimeout>;
    const unsub = useStore.subscribe(() => {
      if (!cloudReady) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushCloudStore(buildSyncPayload(useStore.getState()));
      }, 3000);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [hydrated, user, cloudReady]);

  // Sauvegarde + re-sync quand l'app revient au premier plan (mobile / multi-onglets)
  useEffect(() => {
    if (!user || !cloudReady) return;

    const flush = () => pushCloudStore(buildSyncPayload(useStore.getState()));

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      } else {
        syncNow();
      }
    };

    const onFocus = () => syncNow();

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, cloudReady, syncNow]);

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
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)]"
          >
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
