"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChartBar,
  Clipboard,
  House,
  SignOut,
  User,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Création de devis", icon: House },
  { href: "/devis", label: "Gestion de devis", icon: Clipboard },
  { href: "/comptabilite", label: "Gestion comptable", icon: Wallet },
  { href: "/kpi", label: "KPI & Métriques", icon: ChartBar },
];

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-64 flex flex-col bg-[var(--surface-1)] border-r border-[var(--border)] z-40",
        // Desktop: always visible, no transition to avoid layout shift
        "lg:translate-x-0 lg:transition-none",
        // Mobile: slide in/out with transition
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
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none">
              Chez La Camerounaise
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Système POS</p>
          </div>
          {/* Close button — mobile only */}
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
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {active && (
                  <motion.div
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

      {/* User + logout */}
      <div className="px-3 pb-5 border-t border-[var(--border)] pt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface-2)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--amber)]/20 flex items-center justify-center shrink-0">
            <User size={15} weight="fill" color="#E8960C" />
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
      </div>
    </aside>
  );
}
