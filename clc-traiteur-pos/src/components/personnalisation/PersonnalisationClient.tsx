"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Flask, Briefcase, Check, Palette } from "@phosphor-icons/react";
import { THEMES, type ThemeId } from "@/lib/themes";

const ACCENT_PRESETS = [
  { color: "#E8960C", label: "Orange" },
  { color: "#EF4444", label: "Rouge" },
  { color: "#EC4899", label: "Rose" },
  { color: "#A855F7", label: "Violet" },
  { color: "#6366F1", label: "Indigo" },
  { color: "#3B82F6", label: "Bleu" },
  { color: "#06B6D4", label: "Cyan" },
  { color: "#10B981", label: "Émeraude" },
  { color: "#84CC16", label: "Citron" },
  { color: "#F59E0B", label: "Ambre" },
  { color: "#14B8A6", label: "Turquoise" },
  { color: "#F97316", label: "Corail" },
];

const RADIUS_OPTIONS = [
  { value: "6px",  label: "Carré" },
  { value: "10px", label: "Doux" },
  { value: "16px", label: "Arrondi (défaut)" },
  { value: "24px", label: "Très arrondi" },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 lg:p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{title}</h2>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const SECONDARY_PRESETS = [
  { color: "#8B949E", label: "Gris (défaut)" },
  { color: "#E8D5B0", label: "Crème" },
  { color: "#C8B99A", label: "Sable" },
  { color: "#A8C5DA", label: "Glacier" },
  { color: "#B8D4BE", label: "Sauge" },
  { color: "#D4C5E2", label: "Lavande" },
  { color: "#E8C5C5", label: "Rose poudré" },
  { color: "#C5D4E8", label: "Pervenche" },
  { color: "#C5E8D4", label: "Menthe" },
  { color: "#E8E0C5", label: "Ivoire" },
];

function applySecondaryColor(color: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--secondary-color", color);
  // Variante transparente pour hover/fond léger
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  document.documentElement.style.setProperty("--secondary-bg", `rgba(${r},${g},${b},0.12)`);
  document.documentElement.style.setProperty("--secondary-border", `rgba(${r},${g},${b},0.35)`);
}

export default function PersonnalisationClient() {
  const { appMode, setAppMode, accentColor, setAccentColor, themeId, setThemeId } = useStore();
  const [secondaryColor, setSecondaryColorState] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("clc-secondary-color") ?? "#8B949E";
    return "#8B949E";
  });

  const setSecondaryColor = (c: string) => {
    setSecondaryColorState(c);
    localStorage.setItem("clc-secondary-color", c);
    applySecondaryColor(c);
  };

  // Appliquer au montage
  useEffect(() => { applySecondaryColor(secondaryColor); }, []);

  const applyRadius = (r: string) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const base = parseInt(r);
    root.style.setProperty("--radius-sm", `${Math.max(4, base - 4)}px`);
    root.style.setProperty("--radius-md", `${base}px`);
    root.style.setProperty("--radius-lg", `${base + 6}px`);
    root.style.setProperty("--radius-xl", `${base + 12}px`);
  };

  const currentTheme = THEMES.find(t => t.id === (themeId ?? "nuit"));

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Personnalisation</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Adaptez l'interface à vos préférences</p>
      </div>

      <div className="space-y-5 max-w-2xl">

        {/* ── Thème d'interface ─────────────────────────────── */}
        <Section title="Thème d'interface" description="Choisissez l'ambiance visuelle de l'application.">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {THEMES.map((t) => {
              const active = (themeId ?? "nuit") === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id as ThemeId)}
                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all hover:scale-[1.03] ${
                    active
                      ? "border-[var(--amber)] shadow-[0_0_0_1px_var(--amber)]"
                      : "border-[var(--border)] hover:border-[var(--border-accent)]"
                  }`}
                >
                  {/* Aperçu 3 couches de couleur */}
                  <div className="w-full h-10 rounded-lg overflow-hidden relative flex-shrink-0"
                    style={{ background: t.preview[0] }}>
                    <div className="absolute bottom-0 left-0 right-0 h-6 rounded-b-lg"
                      style={{ background: t.preview[1] }} />
                    <div className="absolute bottom-0 left-2 right-2 h-3 rounded-b-md"
                      style={{ background: t.preview[2] }} />
                    {/* Dot accent simulé */}
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: accentColor ?? "#E8960C" }} />
                  </div>
                  <span className={`text-[10px] font-semibold w-full text-center leading-tight break-words hyphens-auto ${
                    active ? "text-[var(--amber)]" : "text-[var(--text-secondary)]"
                  }`}>{t.name}</span>
                  {active && (
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-[var(--amber)] flex items-center justify-center">
                      <Check size={8} weight="bold" className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {currentTheme && (
            <p className="text-[11px] text-[var(--text-muted)]">
              Thème actuel : <span className="font-semibold text-[var(--text-secondary)]">{currentTheme.name}</span>
              {" "}— {currentTheme.isDark ? "Interface sombre" : "Interface claire"}
            </p>
          )}
        </Section>

        {/* ── Couleur d'accent ─────────────────────────────── */}
        <Section title="Couleur d'accent" description="Appliquée instantanément sur toute l'interface et les documents générés.">
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
            <label className="relative aspect-square rounded-xl cursor-pointer overflow-hidden hover:scale-105 transition-all flex items-center justify-center border-2 border-dashed border-[var(--border)] hover:border-[var(--amber)]/50" title="Couleur personnalisée">
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

        {/* ── Mode de données ──────────────────────────────── */}
        <Section title="Mode de données">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setAppMode("lab")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${appMode === "lab" ? "border-[var(--amber)] bg-[var(--amber)]/5" : "border-[var(--border)] hover:border-[var(--border-accent)]"}`}>
              <Flask size={22} weight={appMode === "lab" ? "fill" : "regular"} style={{ color: appMode === "lab" ? accentColor : undefined }} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Lab</span>
              <span className="text-[11px] text-[var(--text-muted)] text-center">Données de démonstration</span>
            </button>
            <button onClick={() => setAppMode("pro")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${appMode === "pro" ? "border-[var(--amber)] bg-[var(--amber)]/5" : "border-[var(--border)] hover:border-[var(--border-accent)]"}`}>
              <Briefcase size={22} weight={appMode === "pro" ? "fill" : "regular"} style={{ color: appMode === "pro" ? accentColor : undefined }} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Production</span>
              <span className="text-[11px] text-[var(--text-muted)] text-center">Vos vraies données métier</span>
            </button>
          </div>
        </Section>

        {/* ── Couleur secondaire ───────────────────────────── */}
        <Section title="Couleur secondaire" description="Appliquée aux textes, onglets survolés et catégories de plats.">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {SECONDARY_PRESETS.map(({ color, label }) => (
              <button key={color} onClick={() => setSecondaryColor(color)} title={label}
                className="relative aspect-square rounded-xl transition-all hover:scale-105 flex items-center justify-center"
                style={{ background: color, boxShadow: secondaryColor === color ? `0 0 0 2px var(--surface-1), 0 0 0 4px ${color}` : "none" }}>
                {secondaryColor === color && <Check size={12} weight="bold" className="text-white drop-shadow" />}
              </button>
            ))}
            <label className="relative aspect-square rounded-xl cursor-pointer overflow-hidden hover:scale-105 transition-all flex items-center justify-center border-2 border-dashed border-[var(--border)]" title="Personnalisée">
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              <Palette size={14} className="text-[var(--text-muted)]" />
            </label>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-7 h-7 rounded-xl shrink-0" style={{ background: secondaryColor }} />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {SECONDARY_PRESETS.find(p => p.color === secondaryColor)?.label ?? "Personnalisée"}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-mono">{secondaryColor.toUpperCase()}</p>
            </div>
          </div>
        </Section>

        {/* ── Style des coins ──────────────────────────────── */}
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
