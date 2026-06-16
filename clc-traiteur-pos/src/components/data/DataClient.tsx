"use client";

import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  DownloadSimple, UploadSimple, CheckCircle, Warning,
  Database, Trash, ClockCounterClockwise,
} from "@phosphor-icons/react";
import { z } from "zod";
import { useStore } from "@/lib/store";

// ── Chiffrement export AES-256-GCM (CWE-312) ─────────────────────────────
async function encryptBackup(json: string, password: string): Promise<Blob> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(json));
  // Format : salt(16) + iv(12) + ciphertext
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  combined.set(salt); combined.set(iv, 16); combined.set(new Uint8Array(encrypted), 28);
  return new Blob([combined], { type: "application/octet-stream" });
}

async function decryptBackup(buffer: ArrayBuffer, password: string): Promise<string> {
  const data = new Uint8Array(buffer);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
import { MOCK_DEVIS } from "@/lib/data/mock-events";

// ── Schéma de validation des imports ────────────────────────────────────────
const safeString = z.string().max(500).trim();
const safeNumber = z.number().finite().nonnegative();

const DevisItemSchema = z.object({
  dishId: z.number(),
  dishName: safeString,
  quantity: safeNumber,
  unitPrice: safeNumber,
  subtotal: safeNumber,
});

const DevisSchema = z.object({
  id: safeString,
  clientName: safeString,
  clientPhone: safeString,
  eventDate: safeString,
  eventType: safeString,
  guestCount: safeNumber,
  status: z.enum(["Brouillon", "Envoyé", "Confirmé", "Annulé"]),
  items: z.array(DevisItemSchema),
  totalHT: safeNumber,
  totalTTC: safeNumber,
  notes: z.string().max(2000).optional().default(""),
  createdAt: safeString,
});

const BackupSchema = z.object({
  _app: z.literal("clc-traiteur"),
  _version: safeString,
  _exportedAt: safeString,
  devisListPro: z.array(DevisSchema).max(5000).default([]),
  devisListLab: z.array(DevisSchema).max(5000).default([]),
  customPrices: z.record(z.string(), z.number().nonnegative()).default({}),
  customDishes: z.array(z.object({
    id: z.number(),
    name: safeString,
    category: safeString,
    price: safeNumber,
    image: z.string().max(2000000).default("/dishes/ndole.jpg"),
    description: safeString,
    unit: safeString,
  })).max(500).default([]),
  customCategories: z.array(safeString).max(100).default([]),
  entreesCapital: z.array(z.object({
    id: safeString,
    libelle: safeString,
    montant: safeNumber,
    date: safeString,
    source: z.enum(["vente", "apport", "subvention", "autre"]),
  })).max(5000).default([]),
  ingredients: z.array(z.object({
    id: safeString,
    name: safeString,
    unit: safeString,
    pricePerUnit: safeNumber,
    stockQty: safeNumber,
  })).max(500).default([]),
  materiel: z.array(z.object({
    id: safeString,
    name: safeString,
    unit: safeString,
    pricePerUnit: z.number().nonnegative().finite().optional().default(0),
    stockQty: safeNumber,
  })).max(500).default([]),
  customRecipes: z.array(z.object({
    dishId: z.number(),
    dishName: safeString,
    ingredients: z.array(z.object({
      ingredientId: safeString,
      qtyPerPerson: safeNumber,
    })).max(100),
  })).max(500).default([]),
  demandesCourses: z.array(z.object({
    id: safeString,
    devisId: safeString,
    clientName: safeString,
    eventDate: safeString,
    totalEstime: safeNumber,
    statut: z.enum(["en_attente", "confirmé"]).optional().default("en_attente"),
    items: z.array(z.object({
      ingredientId: safeString,
      name: safeString,
      qty: safeNumber,
      unit: safeString,
      inStock: z.boolean().optional().default(false),
    })).max(500),
  })).max(5000).default([]),
  _parametres: z.record(z.string(), z.unknown()).optional().default({}),
  demandesLogistique: z.array(z.object({
    id: safeString,
    devisId: safeString,
    clientName: safeString,
    eventDate: safeString,
    totalEstime: safeNumber.optional().default(0),
    statut: z.enum(["en_attente", "confirmé"]).optional().default("en_attente"),
    items: z.array(z.object({
      name: safeString,
      qty: safeNumber,
      inStock: z.boolean().optional().default(false),
    })).max(500),
  })).max(5000).default([]),
});

const EXPORT_VERSION = "1.0";
const EXPORT_KEY = "clc-traiteur-backup";

export default function DataClient() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [showExportPwd, setShowExportPwd] = useState(false);

  // ── Export (chiffré AES-256-GCM) ──────────────────────────────────────
  const handleExport = async () => {
    if (!exportPassword.trim()) {
      setStatus("error");
      setMessage("Saisissez un mot de passe pour chiffrer la sauvegarde.");
      setTimeout(() => setStatus("idle"), 4000);
      return;
    }
    const s = useStore.getState();
    // Inclure les paramètres localStorage (logistique, facturation, types d'événements, organisation)
    const lsKeys = ["clc-logistique-config", "clc-facturation-config", "clc-event-types",
                    "clc-org-checklists", "clc-org-notes", "clc-org-rappels"];
    const lsData: Record<string, unknown> = {};
    lsKeys.forEach(k => { try { const v = localStorage.getItem(k); if (v) lsData[k] = JSON.parse(v); } catch {} });

    const backup = {
      _version: EXPORT_VERSION,
      _exportedAt: new Date().toISOString(),
      _app: "clc-traiteur",
      devisListPro: s.devisListPro,
      devisListLab: s.devisListLab,
      devisList: s.devisList,
      appMode: s.appMode,
      theme: s.theme,
      themeId: s.themeId,
      accentColor: s.accentColor,
      customPrices: s.customPrices,
      customDishes: s.customDishes,
      customCategories: s.customCategories,
      entreesCapital: s.entreesCapital,
      ingredients: s.ingredients,
      materiel: s.materiel,
      customRecipes: s.customRecipes,
      demandesCourses: s.demandesCourses,
      demandesLogistique: s.demandesLogistique,
      _parametres: lsData,
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = await encryptBackup(json, exportPassword);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    a.download = `clc-traiteur-backup-${date}.clcbak`;
    a.click();
    URL.revokeObjectURL(url);
    setExportPassword("");

    setStatus("success");
    setMessage(`Sauvegarde chiffrée exportée — ${backup.devisListPro.length + backup.devisListLab.length} devis`);
    setTimeout(() => setStatus("idle"), 4000);
  };

  // ── Import (chiffré ou JSON) ───────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setMessage("Fichier trop volumineux (max 10 MB).");
      setTimeout(() => setStatus("idle"), 4000);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const isEncrypted = file.name.endsWith(".clcbak");
    if (isEncrypted && !importPassword.trim()) {
      setStatus("error");
      setMessage("Ce fichier est chiffré. Saisissez le mot de passe d'import.");
      setTimeout(() => setStatus("idle"), 5000);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    if (isEncrypted) {
      reader.onload = async (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const json = await decryptBackup(buffer, importPassword);
          setImportPassword("");
          processImport(json);
        } catch {
          setStatus("error");
          setMessage("Mot de passe incorrect ou fichier corrompu.");
          setTimeout(() => setStatus("idle"), 5000);
        }
      };
      reader.readAsArrayBuffer(file);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    // Fallback : import JSON non chiffré (rétrocompatibilité)
    const readerText = new FileReader();
    readerText.onload = (ev) => {
      const raw = ev.target?.result as string;
      processImport(raw);
    };
    readerText.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const processImport = (raw: string) => {
    try {
        const parsed = JSON.parse(raw);

        // Validation stricte via Zod — rejette tout champ malformé ou inattendu
        const result = BackupSchema.safeParse(parsed);
        if (!result.success) {
          const firstError = result.error.issues[0];
          throw new Error(`Fichier invalide : ${firstError.path.join(".")} — ${firstError.message}`);
        }
        const data = result.data;

        // Fusionner avec l'état actuel — ne pas changer le mode ni le thème en cours
        const current = useStore.getState();

        // Dédupliquer par id pour éviter les doublons à l'import
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mergeById = (existing: any[], incoming: any[]): any[] => {
          const existingIds = new Set(existing.map((x) => x.id));
          return [...existing, ...incoming.filter((x) => !existingIds.has(x.id))];
        };

        const importedPro = data.devisListPro ?? [];
        const importedLab = data.devisListLab ?? [];
        const newProList = mergeById(current.devisListPro, importedPro);
        const newLabList = mergeById(current.devisListLab, importedLab);

        useStore.setState({
          devisListPro: newProList,
          devisListLab: newLabList,
          // Mettre à jour la vue active selon le mode EN COURS (pas celui du backup)
          devisList: current.appMode === "pro" ? newProList : newLabList,
          // Conserver le mode et thème actuels
          appMode: current.appMode,
          theme: current.theme,
          // Fusionner les autres données
          customPrices: { ...data.customPrices, ...current.customPrices }, // priorité aux modifs locales
          customDishes: mergeById(current.customDishes, data.customDishes ?? []),
          customCategories: [...new Set([...current.customCategories, ...(data.customCategories ?? [])])],
          entreesCapital: mergeById(current.entreesCapital, data.entreesCapital ?? []),
          // Stocks : prendre les données du backup si actuelles sont vides
          ingredients: current.ingredients?.length > 0 ? current.ingredients : (data.ingredients?.length > 0 ? data.ingredients : DEFAULT_INGREDIENTS),
          materiel: current.materiel?.length > 0 ? current.materiel : (data.materiel?.length > 0 ? data.materiel : DEFAULT_MATERIEL),
          customRecipes: data.customRecipes ?? current.customRecipes,
          demandesCourses: mergeById(current.demandesCourses, data.demandesCourses ?? []),
          demandesLogistique: mergeById(current.demandesLogistique, data.demandesLogistique ?? []),
        });

        // Restaurer les paramètres localStorage du backup
        if (data._parametres && typeof data._parametres === "object") {
          Object.entries(data._parametres).forEach(([k, v]) => {
            try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
          });
        }

        const nbDevis = importedPro.length + importedLab.length;
        setStatus("success");
        setMessage(`Fusion réussie — ${nbDevis} devis ajoutés, ${data.entreesCapital?.length ?? 0} entrées capital, fichier du ${new Date(data._exportedAt).toLocaleDateString("fr-FR")}`);
        setTimeout(() => setStatus("idle"), 6000);
      } catch (err) {
        setStatus("error");
        setMessage((err as Error).message || "Fichier invalide ou corrompu.");
        setTimeout(() => setStatus("idle"), 5000);
      }
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
          <m.div
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
          </m.div>
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
          {/* Export chiffré */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6 space-y-3">
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-sm mb-1">Exporter les données</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Sauvegarde chiffrée AES-256 — protégée par un mot de passe. Format <code className="font-mono bg-[var(--surface-2)] px-1 rounded">.clcbak</code>.
              </p>
            </div>
            <div className="relative">
              <input
                type={showExportPwd ? "text" : "password"}
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                placeholder="Mot de passe de chiffrement…"
                className="w-full h-9 px-3 pr-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors"
              />
              <button type="button" onClick={() => setShowExportPwd(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                {showExportPwd ? "🙈" : "👁"}
              </button>
            </div>
            <m.button whileTap={{ scale: 0.97 }} onClick={handleExport}
              disabled={!exportPassword.trim()}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] disabled:opacity-40 text-[var(--surface)] font-semibold text-sm transition-colors">
              <DownloadSimple size={16} weight="bold" />
              Télécharger la sauvegarde chiffrée
            </m.button>
          </div>

          {/* Import chiffré ou JSON */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-6 space-y-3">
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-sm mb-1">Importer des données</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Accepte les fichiers <code className="font-mono bg-[var(--surface-2)] px-1 rounded">.clcbak</code> (chiffrés) et <code className="font-mono bg-[var(--surface-2)] px-1 rounded">.json</code> (anciens backups).
              </p>
            </div>
            <input
              type="password"
              value={importPassword}
              onChange={(e) => setImportPassword(e.target.value)}
              placeholder="Mot de passe (pour fichiers .clcbak)"
              className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors"
            />
            <input ref={fileRef} type="file" accept=".clcbak,.json,application/json"
              onChange={handleImport} className="hidden" id="import-file" />
            <m.button whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--amber)]/40 hover:text-[var(--amber)] font-semibold text-sm transition-all">
              <UploadSimple size={16} weight="bold" />
              Importer un fichier de sauvegarde
            </m.button>
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
              <m.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--danger)] hover:bg-red-500/20 font-semibold text-sm transition-all"
              >
                <Trash size={15} />
                Réinitialiser les données
              </m.button>
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
