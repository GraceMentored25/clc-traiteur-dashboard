"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { PaintBrush, FileText, Truck, Plus, Trash, PencilSimple, Check, X, CurrencyEur } from "@phosphor-icons/react";
import PersonnalisationClient from "@/components/personnalisation/PersonnalisationClient";
import { useStore } from "@/lib/store";

type Tab = "personnalisation" | "devis" | "logistique" | "facturation";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "personnalisation", label: "Apparence",   icon: PaintBrush },
  { id: "devis",            label: "Devis",       icon: FileText },
  { id: "logistique",       label: "Logistique",  icon: Truck },
  { id: "facturation",      label: "Facturation", icon: CurrencyEur },
];

// ── Onglet Devis ──────────────────────────────────────────────────────────
const EVENT_TYPES_DEFAULT = ["Mariage", "Anniversaire", "Baptême", "Séminaire", "Réception privée", "Autre"];

function TabDevis() {
  const [eventTypes, setEventTypes] = useState<string[]>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("clc-event-types");
        return saved ? JSON.parse(saved) : EVENT_TYPES_DEFAULT;
      }
      return EVENT_TYPES_DEFAULT;
    }
  );
  const [newType, setNewType] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const save = (list: string[]) => {
    setEventTypes(list);
    localStorage.setItem("clc-event-types", JSON.stringify(list));
  };

  const add = () => {
    if (!newType.trim() || eventTypes.includes(newType.trim())) return;
    save([...eventTypes, newType.trim()]);
    setNewType("");
  };

  const remove = (i: number) => save(eventTypes.filter((_, idx) => idx !== i));

  const commitEdit = (i: number) => {
    if (!editVal.trim()) return;
    const updated = [...eventTypes];
    updated[i] = editVal.trim();
    save(updated);
    setEditIdx(null);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Types d&apos;événements</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Ces types apparaissent dans la liste lors de la création d&apos;un devis.</p>
        </div>
        <div className="space-y-1.5">
          {eventTypes.map((t, i) => (
            <div key={i} className="flex items-center gap-2 group">
              {editIdx === i ? (
                <>
                  <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(i); if (e.key === "Escape") setEditIdx(null); }}
                    className="flex-1 h-8 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--amber)]/50 text-sm text-[var(--text-primary)] outline-none" />
                  <button onClick={() => commitEdit(i)} className="w-7 h-7 rounded-lg bg-[var(--amber)] text-white flex items-center justify-center"><Check size={11} weight="bold" /></button>
                  <button onClick={() => setEditIdx(null)} className="w-7 h-7 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center"><X size={11} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-[var(--text-primary)] px-3 py-1.5 rounded-lg bg-[var(--surface-2)]">{t}</span>
                  <button onClick={() => { setEditIdx(i); setEditVal(t); }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--amber)] flex items-center justify-center transition-all">
                    <PencilSimple size={12} />
                  </button>
                  <button onClick={() => remove(i)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] flex items-center justify-center transition-all">
                    <Trash size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newType} onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder="Nouveau type d'événement…"
            className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
          <button onClick={add} disabled={!newType.trim()}
            className="w-9 h-9 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center disabled:opacity-40 transition-colors">
            <Plus size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Logistique ─────────────────────────────────────────────────────
type LogItem = { name: string; qtyBase: number; unit: string; perConvive: boolean; pricePerUnit?: number; note?: string };

const EVENT_TYPES_LOGISTIQUE = ["default", "Mariage", "Anniversaire", "Baptême", "Séminaire", "Réception privée"];

const DEFAULT_LOGISTIQUE: Record<string, LogItem[]> = {
  default: [
    { name: "Grande marmite 40L", qtyBase: 1, unit: "unité", perConvive: false },
    { name: "Plaque chauffante",  qtyBase: 1, unit: "unité", perConvive: false },
    { name: "Bouteille de gaz",   qtyBase: 2, unit: "unité", perConvive: false },
    { name: "Louche de service",  qtyBase: 4, unit: "unité", perConvive: false },
    { name: "Gants de cuisine",   qtyBase: 6, unit: "paire", perConvive: false },
  ],
  Mariage: [
    { name: "Tente de réception",  qtyBase: 1,  unit: "unité",      perConvive: false, note: "À réserver" },
    { name: "Table pliante",       qtyBase: 10, unit: "unité",      perConvive: false },
    { name: "Chaise pliante",      qtyBase: 1,  unit: "par convive",perConvive: true },
    { name: "Assiette de service", qtyBase: 1,  unit: "par convive",perConvive: true },
    { name: "Marmite chauffante",  qtyBase: 4,  unit: "unité",      perConvive: false },
    { name: "Système sonore",      qtyBase: 1,  unit: "unité",      perConvive: false, note: "À louer" },
  ],
  Anniversaire: [
    { name: "Table pliante",       qtyBase: 5, unit: "unité",      perConvive: false },
    { name: "Chaise pliante",      qtyBase: 1, unit: "par convive",perConvive: true },
    { name: "Marmite chauffante",  qtyBase: 2, unit: "unité",      perConvive: false },
    { name: "Assiette de service", qtyBase: 1, unit: "par convive",perConvive: true },
  ],
  Baptême: [
    { name: "Table pliante",      qtyBase: 4, unit: "unité",      perConvive: false },
    { name: "Chaise pliante",     qtyBase: 1, unit: "par convive",perConvive: true },
    { name: "Marmite chauffante", qtyBase: 2, unit: "unité",      perConvive: false },
  ],
  Séminaire: [
    { name: "Table pliante",      qtyBase: 6, unit: "unité",      perConvive: false },
    { name: "Chaise pliante",     qtyBase: 1, unit: "par convive",perConvive: true },
    { name: "Système sonore",     qtyBase: 1, unit: "unité",      perConvive: false, note: "Micro + enceinte" },
  ],
  "Réception privée": [
    { name: "Tente de réception",  qtyBase: 1, unit: "unité",      perConvive: false, note: "À réserver" },
    { name: "Table pliante",       qtyBase: 8, unit: "unité",      perConvive: false },
    { name: "Chaise pliante",      qtyBase: 1, unit: "par convive",perConvive: true },
    { name: "Marmite chauffante",  qtyBase: 3, unit: "unité",      perConvive: false },
    { name: "Assiette de service", qtyBase: 1, unit: "par convive",perConvive: true },
  ],
};

function TabLogistique() {
  const { materiel, addMateriel, setMaterielPrice } = useStore();
  const [selectedEvent, setSelectedEvent] = useState("default");
  const [config, setConfig] = useState<Record<string, LogItem[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clc-logistique-config");
      return saved ? JSON.parse(saved) : DEFAULT_LOGISTIQUE;
    }
    return DEFAULT_LOGISTIQUE;
  });
  const [newItem, setNewItem] = useState<Partial<LogItem>>({ name: "", qtyBase: 1, unit: "unité", perConvive: false, pricePerUnit: 0 });

  const items = config[selectedEvent] ?? [];

  const save = (updated: Record<string, LogItem[]>) => {
    setConfig(updated);
    localStorage.setItem("clc-logistique-config", JSON.stringify(updated));
  };

  // Synchronise le prix dans la section Matériel du store Zustand
  const syncMaterielPrice = (name: string, price: number) => {
    const existing = materiel.find((m) => m.name === name);
    if (existing) {
      setMaterielPrice(existing.id, price);
    } else if (price > 0) {
      // Créer l'entrée matériel si elle n'existe pas
      addMateriel({ id: `log-${crypto.randomUUID()}`, name, unit: "unité", stockQty: 0, pricePerUnit: price });
    }
  };

  const addItem = () => {
    if (!newItem.name?.trim()) return;
    const item: LogItem = {
      name: newItem.name.trim(),
      qtyBase: newItem.qtyBase ?? 1,
      unit: newItem.unit ?? "unité",
      perConvive: newItem.perConvive ?? false,
      pricePerUnit: newItem.pricePerUnit ?? 0,
    };
    save({ ...config, [selectedEvent]: [...items, item] });
    // Sync prix dans le store matériel
    if (item.pricePerUnit && item.pricePerUnit > 0) {
      syncMaterielPrice(item.name, item.pricePerUnit);
    }
    setNewItem({ name: "", qtyBase: 1, unit: "unité", perConvive: false, pricePerUnit: 0 });
  };

  const removeItem = (i: number) => save({ ...config, [selectedEvent]: items.filter((_, idx) => idx !== i) });

  const updateQty = (i: number, v: number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], qtyBase: v };
    save({ ...config, [selectedEvent]: updated });
  };

  const updatePrice = (i: number, price: number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], pricePerUnit: price };
    save({ ...config, [selectedEvent]: updated });
    // Sync immédiate dans le store matériel
    syncMaterielPrice(items[i].name, price);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Configuration logistique par événement</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Définissez le matériel nécessaire pour chaque type d&apos;événement. La quantité &ldquo;par convive&rdquo; est multipliée par le nombre de convives du devis lors de la génération.
          </p>
        </div>

        {/* Sélecteur de type d'événement */}
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES_LOGISTIQUE.map((e) => (
            <button key={e} onClick={() => setSelectedEvent(e)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedEvent === e
                  ? "bg-[var(--amber)] text-[var(--surface)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              {e === "default" ? "Commun (tous)" : e}
            </button>
          ))}
        </div>

        {/* Liste des items */}
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] italic text-center py-4">Aucun élément — ajoutez du matériel ci-dessous.</p>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{item.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {item.perConvive ? `${item.qtyBase} × nb convives` : `${item.qtyBase} ${item.unit}`}
                  {item.note && <span className="ml-1 italic">{item.note}</span>}
                </p>
              </div>
              {/* Quantité */}
              <input type="number" min="1" value={item.qtyBase}
                onChange={(e) => updateQty(i, parseInt(e.target.value) || 1)}
                title="Quantité"
                className="w-12 h-7 px-1 text-xs text-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              {/* Prix unitaire */}
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min="0" step="0.01" value={item.pricePerUnit ?? 0}
                  onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                  title="Prix unitaire (€)"
                  className="w-16 h-7 px-1 text-xs text-right bg-[var(--surface-2)] border border-[var(--amber)]/30 rounded-lg text-[var(--amber)] font-mono outline-none focus:border-[var(--amber)]/70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <span className="text-[10px] text-[var(--text-muted)]">€</span>
              </div>
              <button onClick={() => removeItem(i)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 flex items-center justify-center transition-all">
                <Trash size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire ajout */}
        <div className="border-t border-[var(--border)] pt-3 space-y-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Ajouter un élément</p>
          <input value={newItem.name ?? ""} onChange={(e) => setNewItem(n => ({ ...n, name: e.target.value }))}
            placeholder="Nom du matériel…"
            className="w-full h-8 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
          <div className="flex gap-2 flex-wrap">
            <input type="number" min="1" value={newItem.qtyBase ?? 1}
              onChange={(e) => setNewItem(n => ({ ...n, qtyBase: parseInt(e.target.value) || 1 }))}
              title="Quantité"
              className="w-14 h-8 px-2 text-xs text-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <input value={newItem.unit ?? "unité"} onChange={(e) => setNewItem(n => ({ ...n, unit: e.target.value }))}
              placeholder="unité"
              className="w-20 h-8 px-2 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" step="0.01" value={newItem.pricePerUnit ?? 0}
                onChange={(e) => setNewItem(n => ({ ...n, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                title="Prix unitaire (€)"
                className="w-16 h-8 px-2 text-xs text-right bg-[var(--surface-2)] border border-[var(--amber)]/30 rounded-lg text-[var(--amber)] font-mono outline-none focus:border-[var(--amber)]/70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <span className="text-[10px] text-[var(--text-muted)]">€/u</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newItem.perConvive ?? false}
                onChange={(e) => setNewItem(n => ({ ...n, perConvive: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[var(--amber)]" />
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Par convive</span>
            </label>
            <button onClick={addItem} disabled={!newItem.name?.trim()}
              className="w-8 h-8 rounded-lg bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
              <Plus size={13} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Facturation ────────────────────────────────────────────────────
const TVA_RATES = [0, 5.5, 10, 20];

function TabFacturation() {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clc-facturation-config");
      return saved ? JSON.parse(saved) : {
        tva: 20,
        mentionLegale: "Dispensé d'immatriculation au RCS et au RM",
        conditionsPaiement: "Acompte de 30% à la commande. Solde le jour de l'événement.",
        siret: "",
        iban: "",
        delaiPaiement: 30,
      };
    }
    return { tva: 20, mentionLegale: "", conditionsPaiement: "", siret: "", iban: "", delaiPaiement: 30 };
  });

  const save = (updated: typeof settings) => {
    setSettings(updated);
    localStorage.setItem("clc-facturation-config", JSON.stringify(updated));
  };

  const field = (label: string, key: keyof typeof settings, type: "text" | "textarea" | "number" = "text") => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      {type === "textarea" ? (
        <textarea value={String(settings[key])} rows={2}
          onChange={(e) => save({ ...settings, [key]: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors resize-none" />
      ) : (
        <input type={type} value={String(settings[key])}
          onChange={(e) => save({ ...settings, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
          className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
      )}
    </div>
  );

  return (
    <div className="space-y-4 max-w-xl">
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Taux de TVA</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Appliqué automatiquement sur tous les devis générés.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {TVA_RATES.map((r) => (
            <button key={r} onClick={() => save({ ...settings, tva: r })}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                settings.tva === r ? "bg-[var(--amber)] text-[var(--surface)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              {r === 0 ? "Exonéré" : `${r}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Informations entreprise</h3>
        <div className="grid grid-cols-1 gap-3">
          {field("SIRET", "siret")}
          {field("IBAN (pour virement)", "iban")}
          {field("Délai de paiement (jours)", "delaiPaiement", "number")}
          {field("Mention légale", "mentionLegale", "textarea")}
          {field("Conditions de paiement", "conditionsPaiement", "textarea")}
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">Ces informations apparaissent sur les PDFs générés.</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function ParametresClient() {
  const [tab, setTab] = useState<Tab>("personnalisation");

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Paramètres</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Personnalisation, configuration des devis et de la logistique</p>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>
            <Icon size={13} weight={tab === id ? "fill" : "regular"} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <m.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === "personnalisation" && <PersonnalisationClient />}
          {tab === "devis"           && <TabDevis />}
          {tab === "logistique"      && <TabLogistique />}
          {tab === "facturation"     && <TabFacturation />}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
