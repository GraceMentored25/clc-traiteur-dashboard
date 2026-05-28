"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Phone, Calendar, Users, FileText, CaretDown, Check } from "@phosphor-icons/react";
import { Devis, DevisItem, DevisStatus } from "@/lib/types";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface Props {
  devis: Devis;
  onClose: () => void;
  onStatusChange: (status: DevisStatus) => void;
}

const STATUS_OPTIONS: DevisStatus[] = ["Brouillon", "Envoyé", "Confirmé", "Annulé"];

export default function DevisDetail({ devis, onClose, onStatusChange }: Props) {
  const { updateDevis } = useStore();
  const [items, setItems] = useState<DevisItem[]>(devis.items.map(i => ({ ...i })));
  const [saved, setSaved] = useState(false);

  const totalHT = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTTC = totalHT * 1.2;

  const updateItem = useCallback((dishId: number, field: "quantity" | "unitPrice", raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) return;
    setItems(prev => prev.map(i => {
      if (i.dishId !== dishId) return i;
      const updated = { ...i, [field]: field === "quantity" ? Math.round(val) : val };
      updated.subtotal = updated.quantity * updated.unitPrice;
      return updated;
    }));
  }, []);

  const handleSave = () => {
    const newHT = items.reduce((s, i) => s + i.subtotal, 0);
    updateDevis(devis.id, {
      items,
      totalHT: newHT,
      totalTTC: newHT * 1.2,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const isDirty = JSON.stringify(items) !== JSON.stringify(devis.items);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-[var(--surface-1)] border-l border-[var(--border)] z-50 flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] sticky top-0 bg-[var(--surface-1)] z-10">
          <div className="flex items-center gap-2.5">
            <FileText size={18} weight="fill" className="text-[var(--amber)]" />
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-sm leading-none">Devis {devis.id}</h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Créé le {formatDate(devis.createdAt.split("T")[0])}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Client info */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Informations client</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--amber)]/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[var(--amber)]">
                    {devis.clientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{devis.clientName}</p>
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Phone size={11} />
                    {devis.clientPhone}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="px-3 py-2 rounded-xl bg-[var(--surface-2)] flex items-center gap-2">
                  <Calendar size={13} className="text-[var(--amber)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Événement</p>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{formatDate(devis.eventDate)}</p>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-[var(--surface-2)] flex items-center gap-2">
                  <Users size={13} className="text-[var(--amber)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Convives</p>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{devis.guestCount} personnes</p>
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[var(--surface-2)]">
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Type d&apos;événement</p>
                <p className="text-xs font-medium text-[var(--text-primary)]">{devis.eventType}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Statut du devis</p>
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <span className={`text-sm font-semibold ${STATUS_COLORS[devis.status].split(" ")[0]}`}>{devis.status}</span>
                <CaretDown size={14} className="text-[var(--text-muted)]" />
              </div>
              <select
                value={devis.status}
                onChange={(e) => onStatusChange(e.target.value as DevisStatus)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Items — editable */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Plats commandés</p>
              <p className="text-[10px] text-[var(--text-muted)]">Qté · Prix unit.</p>
            </div>
            <div className="space-y-1.5">
              {items.map((item) => (
                <div key={item.dishId} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--surface-2)]">
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.dishName}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      {item.quantity} × {formatCurrency(item.unitPrice)} = <span className="text-[var(--amber)]">{formatCurrency(item.subtotal)}</span>
                    </p>
                  </div>

                  {/* Qty input */}
                  <div className="flex flex-col items-center gap-0.5">
                    <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Qté</label>
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.dishId, "quantity", e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-14 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Price input */}
                  <div className="flex flex-col items-center gap-0.5">
                    <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Prix €</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.dishId, "unitPrice", e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-16 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save button — shown only if changed */}
            {(isDirty || saved) && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className={`mt-3 w-full h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  saved
                    ? "bg-green-500/15 text-[var(--success)] border border-green-500/30"
                    : "bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)]"
                }`}
              >
                {saved ? <><Check size={14} weight="bold" /> Modifications enregistrées</> : "Enregistrer les modifications"}
              </motion.button>
            )}
          </div>

          {/* Total — recalculé dynamiquement */}
          <div className="rounded-xl bg-[var(--amber)]/8 border border-[var(--amber)]/20 p-4 space-y-2">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Sous-total HT</span>
              <span className="font-mono">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>TVA 20%</span>
              <span className="font-mono">{formatCurrency(totalHT * 0.2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--amber)] pt-2 border-t border-[var(--amber)]/20">
              <span>Total TTC</span>
              <span className="font-mono text-lg">{formatCurrency(totalTTC)}</span>
            </div>
          </div>

          {/* Notes */}
          {devis.notes && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Notes</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-2)] px-3 py-2.5 rounded-xl">
                {devis.notes}
              </p>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
