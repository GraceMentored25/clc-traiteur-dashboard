"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { m } from "framer-motion";
import {
  ChartBar,
  Clipboard,
  House,
  SignOut,
  User,
  Wallet,
  X,
  Sun,
  Moon,
  Flask,
  Briefcase,
  Package,
  Database,
  ListChecks,
  SlidersHorizontal,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Création de devis", icon: House },
  { href: "/devis", label: "Gestion de devis", icon: Clipboard },
  { href: "/comptabilite", label: "Gestion comptable", icon: Wallet },
  { href: "/stocks", label: "Gestion des stocks", icon: Package },
  { href: "/organisation", label: "Organisation", icon: ListChecks },
  { href: "/kpi", label: "KPI & Métriques", icon: ChartBar },
];

const ACCENT_PRESETS = [
  { color: "#E8960C", label: "Orange" },
  { color: "#3FB950", label: "Vert" },
  { color: "#58A6FF", label: "Bleu" },
  { color: "#A855F7", label: "Violet" },
  { color: "#EF4444", label: "Rouge" },
  { color: "#EC4899", label: "Rose" },
  { color: "#14B8A6", label: "Turquoise" },
  { color: "#F97316", label: "Mandarine" },
];

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, theme, appMode, setAppMode, accentColor, themeId, setThemeId } = useStore();
  // Thèmes clairs : neige, dune
  const isDark = !["neige","dune"].includes(themeId ?? "obsidian");

  const handleLogout = async () => {
    // Supprime le cookie de session côté serveur
    await fetch("/api/auth/login", { method: "DELETE" });
    logout();
    router.push("/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-64 flex flex-col bg-[var(--surface-1)] border-r border-[var(--border)] z-40",
        "lg:translate-x-0 lg:transition-none",
        open ? "translate-x-0 transition-transform duration-300" : "-translate-x-full transition-transform duration-300 lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="px-4 pt-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Chez La Camerounaise"
            width={52}
            height={52}
            className="shrink-0 rounded-full"
            priority
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none">
              Chez La Camerounaise
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Système POS</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group",
                  active
                    ? "text-[var(--amber)] bg-[var(--amber)]/8"
                    : "text-[var(--text-secondary)] hover:text-[var(--secondary-text-hover)] hover:bg-[var(--secondary-bg)]"
                )}
              >
                {active && (
                  <m.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-[var(--amber)]/8"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  size={18}
                  weight={active ? "fill" : "regular"}
                  className="relative z-10 shrink-0"
                />
                <span className="relative z-10">{item.label}</span>
                {active && (
                  <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--amber)] z-10" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Toggles rapides */}
      <div className="px-4 pb-3 space-y-2">
        {/* Toggle Thème */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] flex-1 leading-tight">
            <span className="text-[var(--text-muted)]">Thème :</span> <span className="font-semibold">{isDark ? "Sombre" : "Clair"}</span>
          </span>
          <button
            onClick={() => setThemeId(isDark ? "neige" : "obsidian")}
            role="switch" aria-checked={!isDark}
            className={cn("relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0",
              !isDark ? "bg-[var(--amber)]" : "bg-[var(--surface-3)]")}
          >
            <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center",
              !isDark ? "translate-x-5" : "translate-x-0")}>
              {isDark ? <Moon size={10} weight="fill" className="text-[var(--surface-3)]" /> : <Sun size={10} weight="fill" className="text-[var(--amber)]" />}
            </span>
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] flex-1 leading-tight">
            <span className="text-[var(--text-muted)]">Mode :</span> <span className="font-semibold">{appMode === "pro" ? "Pro" : "Test"}</span>
          </span>
          <button
            onClick={() => setAppMode(appMode === "lab" ? "pro" : "lab")}
            role="switch" aria-checked={appMode === "pro"}
            className={cn("relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0",
              appMode === "pro" ? "bg-[var(--amber)]" : "bg-[var(--surface-3)]")}
          >
            <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center",
              appMode === "pro" ? "translate-x-5" : "translate-x-0")}>
              {appMode === "lab" ? <Flask size={10} weight="fill" className="text-[var(--surface-3)]" /> : <Briefcase size={10} weight="fill" className="text-[var(--amber)]" />}
            </span>
          </button>
        </div>
      </div>

      {/* User + logout */}
      <div className="px-3 pb-5 border-t border-[var(--border)] pt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface-2)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--amber)]/20 flex items-center justify-center shrink-0">
            <User size={15} weight="fill" className="text-[var(--amber)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user?.displayName}
            </p>
            <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-red-500/8 transition-all duration-200"
        >
          <SignOut size={17} />
          Déconnexion
        </button>
        {[
          { href: "/data", label: "Données", icon: Database, active: pathname === "/data" },
          { href: "/parametres", label: "Paramètres", icon: SlidersHorizontal, active: pathname.startsWith("/parametres") || pathname === "/personnalisation" },
          { href: "/confidentialite", label: "Confidentialité", icon: ShieldCheck, active: pathname === "/confidentialite" },
        ].map(({ href, label, icon: Icon, active }) => (
          <Link key={href} href={href} onClick={onClose}>
            <div className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
              active
                ? "text-[var(--amber)] bg-[var(--amber)]/8"
                : "text-[var(--text-secondary)] hover:text-[var(--secondary-text-hover)] hover:bg-[var(--secondary-bg)]"
            )}>
              <Icon size={17} weight={active ? "fill" : "regular"} className="relative z-10 shrink-0" />
              <span className="relative z-10">{label}</span>
              {active && <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--amber)] z-10" />}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
