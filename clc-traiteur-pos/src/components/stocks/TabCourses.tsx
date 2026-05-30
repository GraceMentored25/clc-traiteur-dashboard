"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Truck, CaretDown, CaretUp, Trash, Calendar, Users, Check } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

type Rubrique = "repas" | "logistique";

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
      title="Modifier la quantité">
      {value}
    </button>
  );
}

export default function TabCourses() {
  const [rubrique, setRubrique] = useState<Rubrique>("repas");
  const { demandesCourses, demandesLogistique, removeDemandeCoursesRepas, removeDemandeLogistique,
          updateShoppingItem, updateLogistiqueItem, materiel } = useStore();
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
                    <div className="grid grid-cols-[2fr_70px_60px_80px] gap-2 px-4 py-2 bg-[var(--surface-2)]">
                      {["Ingrédient", "Quantité", "Unité", "Total"].map((h) => (
                        <p key={h} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
                      ))}
                    </div>
                    {d.items.map((item) => (
                      <div key={item.ingredientId} className="grid grid-cols-[2fr_70px_60px_80px] items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] first:border-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{item.ingredientName}</p>
                        <QtyEdit value={item.qty}
                          onSave={(n) => updateShoppingItem(d.id, item.ingredientId, n)} />
                        <p className="text-xs text-[var(--text-muted)]">{item.unit}</p>
                        <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border)]">
                      <span className="text-sm font-bold text-[var(--text-primary)]">TOTAL ESTIMÉ</span>
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
          ) : demandesLogistique.map((d) => (
            <div key={d.id} className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
              <button onClick={() => toggle(d.id + "-log")}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left">
                <Truck size={16} className="text-[var(--amber)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.clientName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">{d.eventType}</span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10}/>{formatDate(d.eventDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                    <div className="grid grid-cols-[1fr_80px_90px] gap-2 px-4 py-2 bg-[var(--surface-2)]">
                      {["Élément", "Quantité", "Prix est."].map((h) => (
                        <p key={h} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
                      ))}
                    </div>
                    {d.items.map((item, i) => {
                      const mat = materiel.find((m) => m.name === item.name);
                      const prix = mat?.pricePerUnit ?? 0;
                      const total = prix * item.qty;
                      return (
                        <div key={i} className="grid grid-cols-[1fr_80px_90px] items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] first:border-0">
                          <div>
                            <p className="text-sm text-[var(--text-primary)]">{item.name}</p>
                            {item.note && <p className="text-xs text-[var(--text-muted)] italic">{item.note}</p>}
                          </div>
                          <QtyEdit value={item.qty}
                            onSave={(n) => updateLogistiqueItem(d.id, i, n)} />
                          <p className="text-sm font-mono font-bold text-[var(--amber)]">
                            {total > 0 ? formatCurrency(total) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                          </p>
                        </div>
                      );
                    })}
                    {/* Total logistique */}
                    {d.items.some((item) => materiel.find((m) => m.name === item.name)?.pricePerUnit) && (
                      <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border)]">
                        <span className="text-sm font-bold text-[var(--text-primary)]">TOTAL ESTIMÉ</span>
                        <span className="text-base font-mono font-bold text-[var(--amber)]">
                          {formatCurrency(d.items.reduce((sum, item) => {
                            const mat = materiel.find((m) => m.name === item.name);
                            return sum + (mat?.pricePerUnit ?? 0) * item.qty;
                          }, 0))}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
