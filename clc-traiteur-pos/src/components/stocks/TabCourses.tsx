"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Truck, CaretDown, CaretUp, Trash, Calendar, Users, Check, Clock } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoursesStatut } from "@/lib/types";

type Rubrique = "repas" | "logistique";

function StatutBadge({ statut, onToggle }: { statut?: CoursesStatut; onToggle: () => void }) {
  const confirmed = statut === "confirmé";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
        confirmed
          ? "bg-green-500/15 text-[var(--success)] border border-green-500/20"
          : "bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--amber)]/30"
      }`}
    >
      {confirmed ? <Check size={10} weight="bold" /> : <Clock size={10} />}
      {confirmed ? "Confirmé" : "En attente"}
    </button>
  );
}

function QtyEdit({ value, onSave }: { value: number; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const commit = () => {
    const n = parseFloat(val.replace(",", "."));
    if (!isNaN(n) && n >= 0) onSave(n);
    else setVal(String(value));
    setEditing(false);
  };
  if (editing) return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      <input autoFocus type="number" min="0" step="0.01" value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(String(value)); setEditing(false); } }}
        onBlur={commit}
        className="w-16 h-6 px-1 text-xs font-mono text-right bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <button onMouseDown={(e) => { e.preventDefault(); commit(); }} className="w-5 h-5 rounded flex items-center justify-center bg-[var(--amber)] text-white shrink-0"><Check size={9} weight="bold" /></button>
    </div>
  );
  return (
    <button onClick={() => { setVal(String(value)); setEditing(true); }}
      className="text-sm font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors shrink-0"
      title="Modifier la quantité">{value}</button>
  );
}

// Input stock : − [valeur/max] +
function StockInput({ value, max, onSave }: { value: number; max: number; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  const inc = () => { const n = Math.min(value + 1, max); onSave(n); setVal(String(n)); };
  const dec = () => { const n = Math.max(value - 1, 0); onSave(n); setVal(String(n)); };
  const commit = () => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0) onSave(Math.min(n, max));
    else setVal(String(value));
    setEditing(false);
  };

  return (
    <div className="flex items-stretch h-6 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-3)] w-fit" onClick={(e) => e.stopPropagation()}>
      {/* − */}
      <button onClick={dec} disabled={value <= 0}
        className="px-1.5 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-30 font-bold text-sm transition-all border-r border-[var(--border)]">
        −
      </button>

      {/* valeur/max cliquable */}
      {editing ? (
        <input autoFocus type="number" min="0" max={max} value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(String(value)); setEditing(false); } }}
          className="w-12 text-center text-xs font-mono font-bold bg-transparent text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      ) : (
        <button onClick={() => { setEditing(true); setVal(String(value)); }}
          className="px-1 text-xs font-mono font-bold text-[var(--amber)] hover:bg-[var(--surface-2)] transition-all min-w-[40px] text-center">
          {value}<span className="text-[var(--text-muted)] font-normal">/{max}</span>
        </button>
      )}

      {/* + */}
      <button onClick={inc} disabled={value >= max}
        className="px-1.5 flex items-center justify-center bg-[var(--amber)] text-[var(--surface)] hover:bg-[var(--amber-light)] disabled:opacity-30 font-bold text-sm transition-all border-l border-[var(--border)]">
        +
      </button>
    </div>
  );
}

export default function TabCourses() {
  const [rubrique, setRubrique] = useState<Rubrique>("repas");
  const { demandesCourses, demandesLogistique, removeDemandeCoursesRepas, removeDemandeLogistique,
          updateShoppingItem, updateLogistiqueItem, materiel, ingredients,
          setCoursesStatut, setLogistiqueStatut,
          setShoppingItemStock, setLogistiqueItemStock } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div>
      <div className="flex items-center gap-1 mb-5 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit">
        {([["repas", "Repas"], ["logistique", "Logistique"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>{label}</button>
        ))}
      </div>

      {/* ── Repas ────────────────────────────────────────────── */}
      {rubrique === "repas" && (
        <div className="space-y-3">
          {demandesCourses.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ShoppingCart size={32} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Aucune liste de courses</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Appuyez sur « Commencer » dans l'onglet Commandes</p>
            </div>
          ) : demandesCourses.map((d) => (
            <div key={d.id} className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
              <button onClick={() => toggle(d.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left">
                <ShoppingCart size={16} className="text-[var(--amber)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.clientName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10}/>{formatDate(d.eventDate)}</span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Users size={10}/>{d.guestCount}</span>
                    <span className="text-xs font-mono text-[var(--amber)]">{formatCurrency(d.totalEstime)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatutBadge statut={d.statut}
                    onToggle={() => setCoursesStatut(d.id, d.statut === "confirmé" ? "en_attente" : "confirmé")} />
                  <button onClick={(e) => { e.stopPropagation(); removeDemandeCoursesRepas(d.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all">
                    <Trash size={13} />
                  </button>
                  {expanded === d.id ? <CaretUp size={14} className="text-[var(--text-muted)]" /> : <CaretDown size={14} className="text-[var(--text-muted)]" />}
                </div>
              </button>

              <AnimatePresence>
                {expanded === d.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[var(--border)]">
                    {/* Header */}
                    <div className="grid grid-cols-[2fr_60px_55px_88px_75px] gap-2 px-4 py-2 bg-[var(--surface-2)]">
                      {["Ingrédient", "À acheter", "Unité", "Stock", "Total"].map((h, i) => (
                        <p key={h} className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide ${i === 3 ? "text-center" : i === 4 ? "text-right" : ""}`}>{h}</p>
                      ))}
                    </div>
                    {d.items.map((item) => {
                      const ing = ingredients.find((i) => i.id === item.ingredientId);
                      const stockDispo = ing?.stockQty ?? 0;
                      const stockUsed = item.stockUtilise ?? 0;
                      const qtyAcheter = Math.max(0, item.qty - stockUsed);
                      return (
                        <div key={item.ingredientId} className="grid grid-cols-[2fr_60px_55px_88px_75px] items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] first:border-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{item.ingredientName}</p>
                          <QtyEdit value={item.qty} onSave={(n) => updateShoppingItem(d.id, item.ingredientId, n)} />
                          <p className="text-xs text-[var(--text-muted)]">{item.unit}</p>
                          <div className="flex justify-center">
                            <StockInput value={stockUsed} max={Math.min(stockDispo, item.qty)}
                              onSave={(n) => setShoppingItemStock(d.id, item.ingredientId, n)} />
                          </div>
                          <p className={`text-sm font-mono font-bold text-right ${qtyAcheter === 0 ? "text-[var(--success)]" : "text-[var(--amber)]"}`}>
                            {qtyAcheter === 0 ? "✓" : formatCurrency(item.total)}
                          </p>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border)]">
                      <span className="text-sm font-bold text-[var(--text-primary)]">TOTAL À ACHETER</span>
                      <span className="text-base font-mono font-bold text-[var(--amber)]">{formatCurrency(d.totalEstime)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* ── Logistique ───────────────────────────────────────── */}
      {rubrique === "logistique" && (
        <div className="space-y-3">
          {demandesLogistique.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Truck size={32} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Aucune demande logistique</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Appuyez sur « Commencer » dans l'onglet Commandes</p>
            </div>
          ) : demandesLogistique.map((d) => {
            const total = d.totalEstime ?? d.items.reduce((sum, item) => {
              const mat = materiel.find((m) => m.name === item.name);
              const qtyAcheter = Math.max(0, item.qty - (item.stockUtilise ?? 0));
              return sum + (mat?.pricePerUnit ?? 0) * qtyAcheter;
            }, 0);

            return (
              <div key={d.id} className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
                <button onClick={() => toggle(d.id + "-log")}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left">
                  <Truck size={16} className="text-[var(--amber)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.clientName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[var(--text-muted)]">{d.eventType}</span>
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10}/>{formatDate(d.eventDate)}</span>
                      {total > 0 && <span className="text-xs font-mono text-[var(--amber)]">{formatCurrency(total)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatutBadge statut={d.statut}
                      onToggle={() => setLogistiqueStatut(d.id, d.statut === "confirmé" ? "en_attente" : "confirmé")} />
                    <button onClick={(e) => { e.stopPropagation(); removeDemandeLogistique(d.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all">
                      <Trash size={13} />
                    </button>
                    {expanded === d.id + "-log" ? <CaretUp size={14} className="text-[var(--text-muted)]" /> : <CaretDown size={14} className="text-[var(--text-muted)]" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded === d.id + "-log" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[var(--border)]">
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_65px_88px_90px] gap-2 px-4 py-2 bg-[var(--surface-2)]">
                        {["Élément", "Quantité", "Stock", "Prix est."].map((h, i) => (
                          <p key={h} className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide ${i === 2 ? "text-center" : i === 3 ? "text-right" : ""}`}>{h}</p>
                        ))}
                      </div>
                      {d.items.map((item, i) => {
                        const mat = materiel.find((m) => m.name === item.name);
                        const prix = mat?.pricePerUnit ?? 0;
                        const stockDispo = mat?.stockQty ?? 0;
                        const stockUsed = item.stockUtilise ?? 0;
                        const qtyAcheter = Math.max(0, item.qty - stockUsed);
                        const itemTotal = prix * qtyAcheter;
                        return (
                          <div key={i} className="grid grid-cols-[1fr_65px_88px_90px] items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] first:border-0">
                            <div>
                              <p className="text-sm text-[var(--text-primary)]">{item.name}</p>
                              {item.note && <p className="text-xs text-[var(--text-muted)] italic">{item.note}</p>}
                            </div>
                            <QtyEdit value={item.qty} onSave={(n) => updateLogistiqueItem(d.id, i, n)} />
                            <div className="flex justify-center">
                              <StockInput value={stockUsed} max={Math.min(stockDispo, item.qty)}
                                onSave={(n) => setLogistiqueItemStock(d.id, i, n)} />
                            </div>
                            <p className={`text-sm font-mono font-bold text-right ${qtyAcheter === 0 ? "text-[var(--success)]" : "text-[var(--amber)]"}`}>
                              {qtyAcheter === 0 ? "✓" : (itemTotal > 0 ? formatCurrency(itemTotal) : "—")}
                            </p>
                          </div>
                        );
                      })}
                      {total > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border)]">
                          <span className="text-sm font-bold text-[var(--text-primary)]">TOTAL À ACHETER</span>
                          <span className="text-base font-mono font-bold text-[var(--amber)]">{formatCurrency(total)}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
