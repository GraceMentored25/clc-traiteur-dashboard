"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Truck, CaretDown, CaretUp, Trash, Calendar, Users } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

type Rubrique = "repas" | "logistique";

export default function TabCourses() {
  const [rubrique, setRubrique] = useState<Rubrique>("repas");
  const { demandesCourses, demandesLogistique, removeDemandeCoursesRepas, removeDemandeLogistique } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div>
      {/* Sous-onglets */}
      <div className="flex items-center gap-1 mb-5 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit">
        {([["repas", "Repas"], ["logistique", "Logistique"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
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
              <button
                onClick={() => toggle(d.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
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
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[var(--border)]"
                  >
                    <div className="hidden md:grid grid-cols-[1fr_70px_90px_70px_90px] gap-0 px-4 py-2 bg-[var(--surface-2)]">
                      {["Ingrédient", "Qté", "Unité", "€/u", "Total"].map((h) => (
                        <p key={h} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
                      ))}
                    </div>
                    {d.items.map((item) => (
                      <div key={item.ingredientId} className="flex md:grid md:grid-cols-[1fr_70px_90px_70px_90px] items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] first:border-0">
                        <p className="text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate">{item.ingredientName}</p>
                        <p className="text-sm font-mono text-[var(--text-secondary)] shrink-0">{item.qty}</p>
                        <p className="text-xs text-[var(--text-muted)] shrink-0 hidden md:block">{item.unit}</p>
                        <p className="text-xs font-mono text-[var(--text-muted)] shrink-0 hidden md:block">{item.pricePerUnit.toFixed(2)} €</p>
                        <p className="text-sm font-mono font-bold text-[var(--amber)] shrink-0">{formatCurrency(item.total)}</p>
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
              <button
                onClick={() => toggle(d.id + "-log")}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
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
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[var(--border)]"
                  >
                    {d.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] first:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--text-primary)]">{item.name}</p>
                          {item.note && <p className="text-xs text-[var(--text-muted)] italic">{item.note}</p>}
                        </div>
                        <span className="text-sm font-mono font-semibold text-[var(--amber)] shrink-0 ml-3">
                          {item.qty} {item.unit}
                        </span>
                      </div>
                    ))}
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
