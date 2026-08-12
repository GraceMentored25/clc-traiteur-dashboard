"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { PaintBrush, FileText, Truck, Plus, Trash, PencilSimple, Check, X, CurrencyEur, ForkKnife, Eye, EyeSlash, DotsSixVertical } from "@phosphor-icons/react";
import PersonnalisationClient from "@/components/personnalisation/PersonnalisationClient";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data/dishes";
import { cn } from "@/lib/utils";

type Tab = "personnalisation" | "catalogue" | "devis" | "logistique" | "facturation";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "personnalisation", label: "Apparence",   icon: PaintBrush },
  { id: "catalogue",        label: "Catalogue",   icon: ForkKnife },
  { id: "devis",            label: "Devis",       icon: FileText },
  { id: "logistique",       label: "Logistique",  icon: Truck },
  { id: "facturation",      label: "Facturation", icon: CurrencyEur },
];

// ── Onglet Catalogue ─────────────────────────────────────────────────────
const STATIC_CATS = CATEGORIES.filter((c) => c !== "Tous");

function TabCatalogue() {
  const {
    customCategories, addCustomCategory, removeCustomCategory,
    categoryOrder, reorderCategories,
    hiddenCategories, toggleHideCategory,
    categoryRenames, renameCategory,
    unitOptions, addUnitOption, removeUnitOption,
  } = useStore();

  const allCatKeys = useMemo(() => {
    const all = [...STATIC_CATS, ...customCategories];
    if (categoryOrder.length === 0) return all;
    const inOrder = categoryOrder.filter((c) => all.includes(c));
    const rest = all.filter((c) => !categoryOrder.includes(c));
    return [...inOrder, ...rest];
  }, [customCategories, categoryOrder]);

  const [newCat, setNewCat] = useState("");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  // ── Unités ──
  const [newUnit, setNewUnit] = useState("");
  const [confirmDelUnit, setConfirmDelUnit] = useState<string | null>(null);

  const isCustom = (key: string) => customCategories.includes(key);

  const commitRename = (key: string) => { renameCategory(key, editVal); setEditKey(null); };

  const addCat = () => {
    const name = newCat.trim();
    if (!name || allCatKeys.some((k) => (categoryRenames[k] ?? k).toLowerCase() === name.toLowerCase())) return;
    addCustomCategory(name);
    setNewCat("");
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
    dragIdxRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(idx);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(fromIdx) || fromIdx === toIdx) { setDragOver(null); return; }
    const next = [...allCatKeys];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    reorderCategories(next);
    setDragOver(null);
  };

  return (
    <div className="space-y-5 max-w-xl">
      {/* Aperçu barre */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Aperçu de la barre</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Tel qu'affiché dans le dashboard — les catégories masquées n'y apparaissent pas.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {["Tous", ...allCatKeys.filter((c) => !hiddenCategories.includes(c))].map((cat) => (
            <span key={cat} className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)]">
              {categoryRenames[cat] ?? cat}
            </span>
          ))}
        </div>
      </div>

      {/* Liste complète avec drag */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Toutes les catégories</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Glissez ≡ pour réordonner, renommez, masquez ou supprimez.</p>
        </div>

        <div className="space-y-1.5">
          {allCatKeys.map((key, idx) => {
            const label = categoryRenames[key] ?? key;
            const isHidden = hiddenCategories.includes(key);
            const custom = isCustom(key);
            const isDropTarget = dragOver === idx;
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => setDragOver(null)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group",
                  isHidden ? "opacity-50" : "",
                  isDropTarget ? "border-[var(--amber)] bg-[var(--amber)]/5" : "bg-[var(--surface-2)] border-[var(--border)]"
                )}
              >
                {/* Poignée drag 3 traits */}
                <div
                  className="flex flex-col justify-center shrink-0 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  title="Glisser pour déplacer"
                >
                  <DotsSixVertical size={16} weight="bold" />
                </div>

                {/* Nom / édition */}
                {editKey === key ? (
                  <>
                    <input autoFocus value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(key); if (e.key === "Escape") setEditKey(null); }}
                      className="flex-1 h-7 px-2 rounded-lg bg-[var(--surface-3)] border border-[var(--amber)]/50 text-sm text-[var(--text-primary)] outline-none"
                    />
                    <button onClick={() => commitRename(key)} className="w-6 h-6 rounded-lg bg-[var(--amber)] flex items-center justify-center text-white"><Check size={10} weight="bold" /></button>
                    <button onClick={() => setEditKey(null)} className="w-6 h-6 rounded-lg bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-muted)]"><X size={10} /></button>
                  </>
                ) : (
                  <>
                    <span className={cn("flex-1 text-sm font-medium truncate", isHidden && "line-through text-[var(--text-muted)]")}>
                      {label}
                      {categoryRenames[key] && (
                        <span className="ml-1.5 text-[10px] text-[var(--text-muted)] font-normal font-mono">({key})</span>
                      )}
                    </span>
                    {!custom && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded shrink-0">système</span>
                    )}
                    <button onClick={() => { setEditKey(key); setEditVal(label); }}
                      title="Renommer"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-colors opacity-0 group-hover:opacity-100">
                      <PencilSimple size={11} />
                    </button>
                    <button onClick={() => toggleHideCategory(key)}
                      title={isHidden ? "Afficher" : "Masquer"}
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                        isHidden ? "text-[var(--amber)] opacity-100" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] opacity-0 group-hover:opacity-100"
                      )}>
                      {isHidden ? <EyeSlash size={11} /> : <Eye size={11} />}
                    </button>
                    {custom && (
                      confirmDel === key ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { removeCustomCategory(key); setConfirmDel(null); }}
                            className="h-5 px-1.5 rounded bg-red-500/15 text-[var(--danger)] text-[10px] font-semibold hover:bg-red-500/25 transition-colors">Oui</button>
                          <button onClick={() => setConfirmDel(null)}
                            className="h-5 px-1.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)] text-[10px] font-semibold transition-colors">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDel(key)}
                          title="Supprimer"
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash size={11} />
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCat(); }}
            placeholder="Nouvelle catégorie…"
            className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
          <button onClick={addCat} disabled={!newCat.trim()}
            className="w-9 h-9 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center disabled:opacity-40 transition-colors">
            <Plus size={14} weight="bold" />
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Les catégories système peuvent être renommées et masquées mais pas supprimées.
        </p>
      </div>

      {/* Gestion des unités */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Unités disponibles</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Unités proposées dans le select de chaque plat (prix badge + modal d'édition).</p>
        </div>
        <div className="space-y-1.5">
          {unitOptions.map((u) => (
            <div key={u} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] group">
              <span className="flex-1 text-sm text-[var(--text-primary)]">{u}</span>
              {confirmDelUnit === u ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => { removeUnitOption(u); setConfirmDelUnit(null); }}
                    className="h-5 px-1.5 rounded bg-red-500/15 text-[var(--danger)] text-[10px] font-semibold hover:bg-red-500/25 transition-colors">Oui</button>
                  <button onClick={() => setConfirmDelUnit(null)}
                    className="h-5 px-1.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)] text-[10px] font-semibold transition-colors">Non</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelUnit(u)}
                  title="Supprimer"
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
          <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newUnit.trim()) { addUnitOption(newUnit.trim()); setNewUnit(""); } }}
            placeholder="Nouvelle unité…"
            className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
          <button onClick={() => { if (newUnit.trim()) { addUnitOption(newUnit.trim()); setNewUnit(""); } }} disabled={!newUnit.trim()}
            className="w-9 h-9 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center disabled:opacity-40 transition-colors">
            <Plus size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
// conviveDiviseur: 0 = quantité fixe | 1 = 1 par convive | N>1 = 1 pour N convives (ex: 1 table/10 convives)
type LogItem = { name: string; qtyBase: number; unit: string; perConvive: boolean; conviveDiviseur?: number; pricePerUnit?: number; note?: string };

// Calcule la quantité réelle selon les convives
function calcQty(item: LogItem, guestCount: number): number {
  const d = item.conviveDiviseur ?? (item.perConvive ? 1 : 0);
  if (d === 0) return item.qtyBase;
  return Math.ceil((guestCount / d) * item.qtyBase);
}

const EVENT_TYPES_LOGISTIQUE = ["default", "Mariage", "Anniversaire", "Baptême", "Séminaire", "Réception privée"];

const DEFAULT_LOGISTIQUE: Record<string, LogItem[]> = {
  default: [
    { name: "Grande marmite 40L", qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Plaque chauffante",  qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Bouteille de gaz",   qtyBase: 2, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Louche de service",  qtyBase: 4, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Gants de cuisine",   qtyBase: 6, unit: "paire", perConvive: false, conviveDiviseur: 0 },
  ],
  Mariage: [
    { name: "Tente de réception",  qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0, note: "À réserver" },
    { name: "Table pliante",       qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 10 },
    { name: "Chaise pliante",      qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
    { name: "Assiette de service", qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
    { name: "Marmite chauffante",  qtyBase: 4, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Système sonore",      qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0, note: "À louer" },
  ],
  Anniversaire: [
    { name: "Table pliante",       qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 10 },
    { name: "Chaise pliante",      qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
    { name: "Marmite chauffante",  qtyBase: 2, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Assiette de service", qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
  ],
  Baptême: [
    { name: "Table pliante",      qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 10 },
    { name: "Chaise pliante",     qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
    { name: "Marmite chauffante", qtyBase: 2, unit: "unité", perConvive: false, conviveDiviseur: 0 },
  ],
  Séminaire: [
    { name: "Table pliante",      qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 8 },
    { name: "Chaise pliante",     qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
    { name: "Système sonore",     qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0, note: "Micro + enceinte" },
  ],
  "Réception privée": [
    { name: "Tente de réception",  qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0, note: "À réserver" },
    { name: "Table pliante",       qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 10 },
    { name: "Chaise pliante",      qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
    { name: "Marmite chauffante",  qtyBase: 3, unit: "unité", perConvive: false, conviveDiviseur: 0 },
    { name: "Assiette de service", qtyBase: 1, unit: "unité", perConvive: true,  conviveDiviseur: 1 },
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
  const [newItem, setNewItem] = useState<Partial<LogItem>>({ name: "", qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0, pricePerUnit: 0 });

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
    const diviseur = newItem.conviveDiviseur ?? 0;
    const item: LogItem = {
      name: newItem.name.trim(),
      qtyBase: newItem.qtyBase ?? 1,
      unit: newItem.unit ?? "unité",
      perConvive: diviseur > 0,
      conviveDiviseur: diviseur,
      pricePerUnit: newItem.pricePerUnit ?? 0,
    };
    save({ ...config, [selectedEvent]: [...items, item] });
    if (item.pricePerUnit && item.pricePerUnit > 0) syncMaterielPrice(item.name, item.pricePerUnit);
    setNewItem({ name: "", qtyBase: 1, unit: "unité", perConvive: false, conviveDiviseur: 0, pricePerUnit: 0 });
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
          {items.map((item, i) => {
            const d = item.conviveDiviseur ?? (item.perConvive ? 1 : 0);
            const modeLabel = d === 0 ? `${item.qtyBase} ${item.unit} (fixe)` : d === 1 ? `${item.qtyBase} par convive` : `${item.qtyBase} / ${d} convives`;
            return (
            <div key={i} className="flex items-center gap-2 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{item.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {modeLabel}{item.note && <span className="ml-1 italic"> — {item.note}</span>}
                </p>
              </div>
              {/* Quantité */}
              <input type="text" inputMode="decimal" value={item.qtyBase === 0 ? "" : item.qtyBase}
                placeholder="qté"
                onChange={(e) => { const v = parseFloat(e.target.value); updateQty(i, isNaN(v) ? 0 : v); }}
                title="Quantité"
                className="w-12 h-7 px-1 text-xs text-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50" />
              {/* Prix unitaire */}
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="text" inputMode="decimal" value={(item.pricePerUnit ?? 0) === 0 ? "" : item.pricePerUnit}
                  placeholder="prix"
                  onChange={(e) => { const v = parseFloat(e.target.value); updatePrice(i, isNaN(v) ? 0 : v); }}
                  title="Prix unitaire (€)"
                  className="w-14 h-7 px-1 text-xs text-right bg-[var(--surface-2)] border border-[var(--amber)]/30 rounded-lg text-[var(--amber)] font-mono outline-none focus:border-[var(--amber)]/70" />
                <span className="text-[10px] text-[var(--text-muted)]">€</span>
              </div>
              <button onClick={() => removeItem(i)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 flex items-center justify-center transition-all">
                <Trash size={12} />
              </button>
            </div>
          );})}
        </div>

        {/* Formulaire ajout */}
        <div className="border-t border-[var(--border)] pt-3 space-y-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Ajouter un élément</p>
          <input value={newItem.name ?? ""} onChange={(e) => setNewItem(n => ({ ...n, name: e.target.value }))}
            placeholder="Nom du matériel…"
            className="w-full h-8 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
          <div className="flex gap-2 flex-wrap items-center">
            {/* Quantité */}
            <input type="text" inputMode="decimal"
              value={(newItem.qtyBase ?? 1) === 0 ? "" : newItem.qtyBase}
              placeholder="qté"
              onChange={(e) => { const v = parseFloat(e.target.value); setNewItem(n => ({ ...n, qtyBase: isNaN(v) ? 0 : v })); }}
              title="Quantité de base"
              className="w-14 h-8 px-2 text-xs text-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50" />
            {/* Unité */}
            <input value={newItem.unit ?? "unité"} onChange={(e) => setNewItem(n => ({ ...n, unit: e.target.value }))}
              placeholder="unité"
              className="w-20 h-8 px-2 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50" />
            {/* Prix */}
            <div className="flex items-center gap-1">
              <input type="text" inputMode="decimal"
                value={(newItem.pricePerUnit ?? 0) === 0 ? "" : newItem.pricePerUnit}
                placeholder="prix"
                onChange={(e) => { const v = parseFloat(e.target.value); setNewItem(n => ({ ...n, pricePerUnit: isNaN(v) ? 0 : v })); }}
                title="Prix unitaire (€)"
                className="w-14 h-8 px-2 text-xs text-right bg-[var(--surface-2)] border border-[var(--amber)]/30 rounded-lg text-[var(--amber)] font-mono outline-none focus:border-[var(--amber)]/70" />
              <span className="text-[10px] text-[var(--text-muted)]">€</span>
            </div>
            {/* Mode calcul : fixe / par convive / tous les N convives */}
            <div className="flex items-center gap-1.5">
              <select value={newItem.conviveDiviseur ?? 0}
                onChange={(e) => setNewItem(n => ({ ...n, conviveDiviseur: parseInt(e.target.value) }))}
                className="h-8 px-2 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50">
                <option value={0}>Fixe</option>
                <option value={1}>Par convive</option>
                <option value={2}>1 / 2 conv.</option>
                <option value={5}>1 / 5 conv.</option>
                <option value={8}>1 / 8 conv.</option>
                <option value={10}>1 / 10 conv.</option>
                <option value={15}>1 / 15 conv.</option>
                <option value={20}>1 / 20 conv.</option>
              </select>
            </div>
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
        nom: "CLC TRAITEUR",
        sousTitre: "Traiteur événementiel",
        ville: "Rouen",
        tva: 20,
        mentionLegale: "Dispensé d'immatriculation au RCS et au RM",
        conditionsPaiement: "Acompte de 30% à la commande. Solde le jour de l'événement.",
        siret: "",
        iban: "",
        delaiPaiement: 30,
      };
    }
    return { nom: "CLC TRAITEUR", sousTitre: "Traiteur événementiel", ville: "Rouen", tva: 20, mentionLegale: "", conditionsPaiement: "", siret: "", iban: "", delaiPaiement: 30 };
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
          {field("Nom commercial", "nom")}
          {field("Sous-titre / Description", "sousTitre")}
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
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams?.get("tab");
    return (TABS.some((x) => x.id === t) ? t : "personnalisation") as Tab;
  });

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, [searchParams]);

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
          {tab === "catalogue"       && <TabCatalogue />}
          {tab === "devis"           && <TabDevis />}
          {tab === "logistique"      && <TabLogistique />}
          {tab === "facturation"     && <TabFacturation />}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
