"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DownloadSimple, UploadSimple, CheckCircle, Warning,
  Database, Trash, ClockCounterClockwise,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
import { MOCK_DEVIS } from "@/lib/data/mock-events";

const EXPORT_VERSION = "1.0";
const EXPORT_KEY = "clc-traiteur-backup";

export default function DataClient() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const s = useStore.getState();
    const backup = {
      _version: EXPORT_VERSION,
      _exportedAt: new Date().toISOString(),
      _app: "clc-traiteur",
      // Toutes les données persistées
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

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    a.download = `clc-traiteur-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus("success");
    setMessage(`Sauvegarde exportée — ${backup.devisListPro.length + backup.devisListLab.length} devis, ${backup.entreesCapital.length} entrées capital`);
    setTimeout(() => setStatus("idle"), 4000);
  };

  // ── Import ─────────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);

        // Vérification basique
        if (data._app !== "clc-traiteur") {
          throw new Error("Ce fichier ne provient pas de C.LC. Traiteur.");
        }

        // Restaurer le store avec toutes les données du backup
        useStore.setState({
          devisListPro: data.devisListPro ?? [],
          devisListLab: data.devisListLab ?? [],
          devisList: data.devisList ?? (data.appMode === "pro" ? data.devisListPro ?? [] : data.devisListLab ?? []),
          appMode: data.appMode ?? "pro",
          theme: data.theme ?? "dark",
          customPrices: data.customPrices ?? {},
          customDishes: data.customDishes ?? [],
          customCategories: data.customCategories ?? [],
          entreesCapital: data.entreesCapital ?? [],
          ingredients: data.ingredients?.length > 0 ? data.ingredients : DEFAULT_INGREDIENTS,
          materiel: data.materiel?.length > 0 ? data.materiel : DEFAULT_MATERIEL,
          customRecipes: data.customRecipes ?? [],
          demandesCourses: data.demandesCourses ?? [],
          demandesLogistique: data.demandesLogistique ?? [],
        });

        const nbDevis = (data.devisListPro?.length ?? 0) + (data.devisListLab?.length ?? 0);
        setStatus("success");
        setMessage(`Importation réussie — ${nbDevis} devis, ${data.entreesCapital?.length ?? 0} entrées capital, sauvegarde du ${new Date(data._exportedAt).toLocaleDateString("fr-FR")}`);
        setTimeout(() => setStatus("idle"), 6000);
      } catch (err) {
        setStatus("error");
        setMessage((err as Error).message || "Fichier invalide ou corrompu.");
        setTimeout(() => setStatus("idle"), 5000);
      }
    };
    reader.readAsText(file);
    // Reset l'input pour permettre de ré-importer le même fichier
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    useStore.setState({
      devisListPro: [],
      devisListLab: MOCK_DEVIS,
      devisList: [],
      appMode: "pro",
      theme: "dark",
      customPrices: {},
      customDishes: [],
      customCategories: [],
      entreesCapital: [],
      ingredients: DEFAULT_INGREDIENTS,
      materiel: DEFAULT_MATERIEL,
      customRecipes: [],
      demandesCourses: [],
      demandesLogistique: [],
    });
    setConfirmReset(false);
    setStatus("success");
    setMessage("Toutes les données ont été réinitialisées.");
    setTimeout(() => setStatus("idle"), 4000);
  };

  const s = useStore.getState();
  const stats = {
    devisPro: s.devisListPro?.length ?? 0,
    devisLab: s.devisListLab?.length ?? 0,
    capital: s.entreesCapital?.length ?? 0,
    courses: s.demandesCourses?.length ?? 0,
    logistique: s.demandesLogistique?.length ?? 0,
    customDishes: s.customDishes?.length ?? 0,
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Gestion des données</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Exportez, importez et gérez les données de l'application</p>
      </div>

      {/* Statut */}
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm ${
              status === "success"
                ? "bg-green-500/10 border border-green-500/20 text-[var(--success)]"
                : "bg-red-500/10 border border-red-500/20 text-[var(--danger)]"
            }`}
          >
            {status === "success" ? <CheckCircle size={18} weight="fill" /> : <Warning size={18} weight="fill" />}
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Snapshot actuel */}
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Database size={18} className="text-[var(--amber)]" />
            <h2 className="font-bold text-[var(--text-primary)] text-sm">État actuel des données</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Devis Pro", stats.devisPro],
              ["Devis Lab (démo)", stats.devisLab],
              ["Entrées de capital", stats.capital],
              ["Listes de courses repas", stats.courses],
              ["Demandes logistique", stats.logistique],
              ["Plats personnalisés", stats.customDishes],
            ].map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className={`text-sm font-mono font-bold ${Number(count) > 0 ? "text-[var(--amber)]" : "text-[var(--text-muted)]"}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Export */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6">
            <h2 className="font-bold text-[var(--text-primary)] text-sm mb-1">Exporter les données</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Télécharge un fichier <code className="font-mono bg-[var(--surface-2)] px-1 rounded">.json</code> contenant tous vos devis, stocks, recettes, courses et entrées comptables.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors"
            >
              <DownloadSimple size={16} weight="bold" />
              Télécharger la sauvegarde
            </motion.button>
          </div>

          {/* Import */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6">
            <h2 className="font-bold text-[var(--text-primary)] text-sm mb-1">Importer des données</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Restaure toutes les données depuis un fichier de sauvegarde <code className="font-mono bg-[var(--surface-2)] px-1 rounded">.json</code>. <span className="text-[var(--warning)]">Les données actuelles seront remplacées.</span>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--amber)]/40 hover:text-[var(--amber)] font-semibold text-sm transition-all"
            >
              <UploadSimple size={16} weight="bold" />
              Importer un fichier de sauvegarde
            </motion.button>
          </div>

          {/* Reset */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-red-500/20 p-6">
            <div className="flex items-center gap-2 mb-1">
              <ClockCounterClockwise size={16} className="text-[var(--danger)]" />
              <h2 className="font-bold text-[var(--text-primary)] text-sm">Réinitialiser toutes les données</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Supprime tous vos devis, stocks personnalisés et entrées comptables. Les données de démonstration (Lab) seront restaurées.
            </p>
            {!confirmReset ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--danger)] hover:bg-red-500/20 font-semibold text-sm transition-all"
              >
                <Trash size={15} />
                Réinitialiser les données
              </motion.button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setConfirmReset(false)} className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <button onClick={handleReset} className="flex-1 h-10 rounded-xl bg-[var(--danger)] text-white font-semibold text-sm hover:bg-red-500 transition-colors">
                  Confirmer la réinitialisation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Format du fichier */}
      <div className="mt-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6">
        <h2 className="font-bold text-[var(--text-primary)] text-sm mb-3">Ce que contient la sauvegarde</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ["Devis Pro & Lab", "Tous les devis créés dans les deux modes"],
            ["Comptabilité", "Entrées de capital"],
            ["Stocks", "Ingrédients et matériel avec quantités"],
            ["Recettes", "Recettes personnalisées"],
            ["Courses", "Listes de courses et logistique"],
            ["Paramètres", "Mode, thème, prix personnalisés"],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 rounded-xl bg-[var(--surface-2)]">
              <p className="text-xs font-semibold text-[var(--amber)] mb-1">{title}</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
