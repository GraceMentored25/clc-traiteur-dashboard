"use client";

import { useStore } from "@/lib/store";
import { Sun, Moon, Flask, Briefcase, Check, Palette } from "@phosphor-icons/react";

const ACCENT_PRESETS = [
  { color: "#E8960C", label: "Orange (défaut)" },
  { color: "#3FB950", label: "Vert" },
  { color: "#58A6FF", label: "Bleu" },
  { color: "#A855F7", label: "Violet" },
  { color: "#EF4444", label: "Rouge" },
  { color: "#EC4899", label: "Rose" },
  { color: "#14B8A6", label: "Turquoise" },
  { color: "#F97316", label: "Mandarine" },
  { color: "#EAB308", label: "Jaune" },
  { color: "#06B6D4", label: "Cyan" },
  { color: "#6366F1", label: "Indigo" },
  { color: "#84CC16", label: "Lime" },
];

const RADIUS_OPTIONS = [
  { value: "6px",  label: "Carré" },
  { value: "10px", label: "Doux" },
  { value: "16px", label: "Arrondi (défaut)" },
  { value: "24px", label: "Très arrondi" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 lg:p-6 space-y-4">
      <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

export default function PersonnalisationClient() {
  const { theme, setTheme, appMode, setAppMode, accentColor, setAccentColor } = useStore();

  const applyRadius = (r: string) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const base = parseInt(r);
    root.style.setProperty("--radius-sm", `${Math.max(4, base - 4)}px`);
    root.style.setProperty("--radius-md", `${base}px`);
    root.style.setProperty("--radius-lg", `${base + 6}px`);
    root.style.setProperty("--radius-xl", `${base + 12}px`);
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Personnalisation</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Adaptez l'interface à vos préférences</p>
      </div>

      <div className="space-y-5 max-w-2xl">

        {/* ── Couleur d'accent ─────────────────────────────────────── */}
        <Section title="Couleur d'accent">
          <p className="text-xs text-[var(--text-muted)] -mt-2">Appliquée instantanément sur toute l'interface et les documents générés.</p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {ACCENT_PRESETS.map(({ color, label }) => (
              <button key={color} onClick={() => setAccentColor(color)} title={label}
                className="relative aspect-square rounded-xl transition-all hover:scale-105 flex items-center justify-center"
                style={{ background: color, boxShadow: accentColor === color ? `0 0 0 2px var(--surface-1), 0 0 0 4px ${color}` : "none" }}
              >
                {accentColor === color && <Check size={14} weight="bold" className="text-white drop-shadow" />}
              </button>
            ))}
            {/* Couleur libre */}
            <label className="relative aspect-square rounded-xl cursor-pointer overflow-hidden hover:scale-105 transition-all flex items-center justify-center border-2 border-dashed border-[var(--border)] hover:border-[var(--amber)]/50"
              title="Couleur personnalisée">
              <input type="color" value={accentColor ?? "#E8960C"} onChange={(e) => setAccentColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              <Palette size={16} className="text-[var(--text-muted)]" />
            </label>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: accentColor }} />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {ACCENT_PRESETS.find(p => p.color === accentColor)?.label ?? "Personnalisée"}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-mono">{accentColor?.toUpperCase()}</p>
            </div>
          </div>
        </Section>

        {/* ── Thème ────────────────────────────────────────────────── */}
        <Section title="Thème d'interface">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${theme === "dark" ? "border-[var(--amber)] bg-[var(--amber)]/5" : "border-[var(--border)] hover:border-[var(--border-accent)]"}`}>
              <Moon size={22} weight={theme === "dark" ? "fill" : "regular"} style={{ color: theme === "dark" ? accentColor : undefined }} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Sombre</span>
              <span className="text-[11px] text-[var(--text-muted)] text-center">Interface noire, idéale pour travailler en soirée</span>
            </button>
            <button onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${theme === "light" ? "border-[var(--amber)] bg-[var(--amber)]/5" : "border-[var(--border)] hover:border-[var(--border-accent)]"}`}>
              <Sun size={22} weight={theme === "light" ? "fill" : "regular"} style={{ color: theme === "light" ? accentColor : undefined }} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Clair</span>
              <span className="text-[11px] text-[var(--text-muted)] text-center">Interface blanche, idéale pour la journée</span>
            </button>
          </div>
        </Section>

        {/* ── Mode données ─────────────────────────────────────────── */}
        <Section title="Mode de données">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setAppMode("lab")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${appMode === "lab" ? "border-[var(--amber)] bg-[var(--amber)]/5" : "border-[var(--border)] hover:border-[var(--border-accent)]"}`}>
              <Flask size={22} weight={appMode === "lab" ? "fill" : "regular"} style={{ color: appMode === "lab" ? accentColor : undefined }} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Lab</span>
              <span className="text-[11px] text-[var(--text-muted)] text-center">Données de démonstration pour tester l'app</span>
            </button>
            <button onClick={() => setAppMode("pro")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${appMode === "pro" ? "border-[var(--amber)] bg-[var(--amber)]/5" : "border-[var(--border)] hover:border-[var(--border-accent)]"}`}>
              <Briefcase size={22} weight={appMode === "pro" ? "fill" : "regular"} style={{ color: appMode === "pro" ? accentColor : undefined }} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Production</span>
              <span className="text-[11px] text-[var(--text-muted)] text-center">Vos vraies données métier</span>
            </button>
          </div>
        </Section>

        {/* ── Rayon des coins ──────────────────────────────────────── */}
        <Section title="Style des coins">
          <div className="grid grid-cols-4 gap-2">
            {RADIUS_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => applyRadius(value)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-accent)] transition-all">
                <div className="w-8 h-8 border-2 border-[var(--amber)]" style={{ borderRadius: value }} />
                <span className="text-[11px] text-[var(--text-secondary)] text-center">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Non persisté — se réinitialise au rechargement.</p>
        </Section>

      </div>
    </div>
  );
}
