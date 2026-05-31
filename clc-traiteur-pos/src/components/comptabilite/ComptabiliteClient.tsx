"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CurrencyEur,
  Receipt,
  TrendUp,
  CheckCircle,
  FilePdf,
  Download,
  Calendar,
  X,
  Plus,
  Trash,
  PiggyBank,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { Devis, EntreeCapital } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type Period = "all" | "month" | "quarter" | "year";

const SOURCES: { value: EntreeCapital["source"]; label: string }[] = [
  { value: "vente", label: "Vente" },
  { value: "apport", label: "Apport personnel" },
  { value: "subvention", label: "Subvention" },
  { value: "autre", label: "Autre" },
];

const TVA_RATE = 0.20;

export default function ComptabiliteClient() {
  const { devisList, entreesCapital, addEntreeCapital, removeEntreeCapital } = useStore();
  const [period, setPeriod] = useState<Period>("all");
  const [docModal, setDocModal] = useState<"summary" | "invoices" | "tva" | null>(null);
  const [capitalModal, setCapitalModal] = useState(false);
  const [capitalForm, setCapitalForm] = useState({ libelle: "", montant: "", date: new Date().toISOString().split("T")[0], source: "vente" as EntreeCapital["source"] });

  const confirmed = useMemo(() => {
    const now = new Date();
    return devisList.filter((d) => {
      if (d.status !== "Confirmé") return false;
      if (period === "all") return true;
      const date = new Date(d.eventDate);
      if (period === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === "quarter") {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(date.getMonth() / 3) === q && date.getFullYear() === now.getFullYear();
      }
      if (period === "year") return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [devisList, period]);

  // Filtrer les entrées capital par période
  const confirmedCapital = useMemo(() => {
    const now = new Date();
    return entreesCapital.filter((e) => {
      if (period === "all") return true;
      const date = new Date(e.date);
      if (period === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === "quarter") {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(date.getMonth() / 3) === q && date.getFullYear() === now.getFullYear();
      }
      if (period === "year") return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [entreesCapital, period]);

  const metrics = useMemo(() => {
    const totalHT = confirmed.reduce((s, d) => s + d.totalHT, 0);
    const totalTVA = confirmed.reduce((s, d) => s + (d.totalTTC - d.totalHT), 0);
    const totalTTC = confirmed.reduce((s, d) => s + d.totalTTC, 0);
    const avgDevis = confirmed.length ? totalTTC / confirmed.length : 0;
    const totalCapital = confirmedCapital.reduce((s, e) => s + e.montant, 0);
    const totalEntrees = totalTTC + totalCapital;
    return { totalHT, totalTVA, totalTTC, avgDevis, count: confirmed.length, totalCapital, totalEntrees };
  }, [confirmed, confirmedCapital]);

  const handleAddCapital = () => {
    const montant = parseFloat(capitalForm.montant.replace(",", "."));
    if (!capitalForm.libelle.trim() || isNaN(montant) || montant <= 0) return;
    addEntreeCapital({
      id: `CAP-${Date.now()}`,
      libelle: capitalForm.libelle.trim(),
      montant,
      date: capitalForm.date,
      source: capitalForm.source,
    });
    setCapitalForm({ libelle: "", montant: "", date: new Date().toISOString().split("T")[0], source: "vente" });
    setCapitalModal(false);
  };

  const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "all", label: "Tout" },
    { value: "month", label: "Ce mois" },
    { value: "quarter", label: "Ce trimestre" },
    { value: "year", label: "Cette année" },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Gestion comptable</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Suivi financier des devis confirmés</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCapitalModal(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 text-xs font-semibold transition-colors"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Entrée de capital</span>
            <span className="sm:hidden">Capital</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setDocModal("summary")}
            className="flex items-center gap-2 h-9 px-3 lg:px-4 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-xs lg:text-sm font-semibold transition-colors"
          >
            <FilePdf size={15} weight="fill" />
            <span className="hidden sm:inline">Générer</span>
          </motion.button>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-full lg:w-fit mb-6 lg:mb-8">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`flex-1 lg:flex-none px-2 lg:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === opt.value
                ? "bg-[var(--amber)] text-[var(--surface)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total encaissé TTC", value: formatCurrency(metrics.totalEntrees), icon: <CurrencyEur size={18} weight="fill" />, accent: true },
          { label: "CA devis TTC", value: formatCurrency(metrics.totalTTC), icon: <TrendUp size={18} weight="fill" />, accent: false },
          { label: "Entrées de capital", value: formatCurrency(metrics.totalCapital), icon: <PiggyBank size={18} weight="fill" />, accent: false },
          { label: "TVA collectée (20%)", value: formatCurrency(metrics.totalTVA), icon: <Receipt size={18} weight="fill" />, accent: false },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 25 }}
            className={`p-5 rounded-2xl border ${
              card.accent
                ? "bg-[var(--amber)]/8 border-[var(--amber)]/20"
                : "bg-[var(--surface-1)] border-[var(--border)]"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${
              card.accent ? "bg-[var(--amber)]/20 text-[var(--amber)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
            }`}>
              {card.icon}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-1">{card.label}</p>
            <p className={`text-xl font-bold font-mono tracking-tight ${card.accent ? "text-[var(--amber)]" : "text-[var(--text-primary)]"}`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Récapitulatif financier par devis */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-1)] mb-6">
        <div className="px-4 lg:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-bold text-[var(--text-primary)] text-sm">Détail des encaissements</h2>
          <span className="text-xs text-[var(--text-muted)]">{confirmed.length} facture{confirmed.length > 1 ? "s" : ""}</span>
        </div>

        {confirmed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CurrencyEur size={36} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Aucun devis confirmé</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Les devis confirmés apparaîtront ici</p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_130px_110px_110px_120px] gap-0 px-6 py-3 border-b border-[var(--border)]">
              {["Réf.", "Client", "Événement", "Montant HT", "TVA 20%", "Total TTC"].map((h, i) => (
                <p key={h} className={`text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide ${i >= 3 ? "text-right pr-4" : ""}`}>{h}</p>
              ))}
            </div>

            {confirmed.map((devis, i) => (
              <motion.div key={devis.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[80px_1fr_130px_110px_110px_120px] gap-0 px-6 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                  <p className="text-xs font-mono font-medium text-[var(--amber)] self-center">{devis.id}</p>
                  <div className="self-center min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{devis.clientName}</p>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
                      <Calendar size={11} />{formatDate(devis.eventDate)}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] self-center truncate">{devis.eventType}</p>
                  <p className="text-sm font-mono text-[var(--text-primary)] self-center text-right pr-4">{formatCurrency(devis.totalHT)}</p>
                  <p className="text-sm font-mono text-[var(--text-secondary)] self-center text-right pr-4">{formatCurrency(devis.totalTTC - devis.totalHT)}</p>
                  <p className="text-sm font-mono font-bold text-[var(--amber)] self-center text-right pr-2">{formatCurrency(devis.totalTTC)}</p>
                </div>

                {/* Mobile card */}
                <div className="md:hidden px-4 py-4 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-[var(--amber)]">{devis.id}</span>
                    <span className="text-xs font-mono font-bold text-[var(--amber)]">{formatCurrency(devis.totalTTC)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{devis.clientName}</p>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">{devis.eventType}</p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />{formatDate(devis.eventDate)}
                    </div>
                    <span>HT {formatCurrency(devis.totalHT)} · TVA {formatCurrency(devis.totalTTC - devis.totalHT)}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Total row */}
            <div className="px-4 lg:px-6 py-4 bg-[var(--surface-2)] border-t-2 border-[var(--amber)]/20">
              {/* Desktop — lignes totaux */}
              <div className="hidden md:block space-y-0">
                {/* Total devis */}
                <div className="grid grid-cols-[1fr_110px_110px_120px] gap-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] self-center py-1">Total devis</p>
                  <p className="text-sm font-mono font-bold text-[var(--text-primary)] self-center text-right pr-4 py-1">{formatCurrency(metrics.totalHT)}</p>
                  <p className="text-sm font-mono font-bold text-[var(--text-secondary)] self-center text-right pr-4 py-1">{formatCurrency(metrics.totalTVA)}</p>
                  <p className="text-sm font-mono font-bold text-[var(--amber)] self-center text-right pr-2 py-1">{formatCurrency(metrics.totalTTC)}</p>
                </div>
                {metrics.totalCapital > 0 && (
                  <>
                    {/* Entrées capital */}
                    <div className="grid grid-cols-[1fr_110px_110px_120px] gap-0">
                      <p className="text-sm text-[var(--text-secondary)] self-center py-1">Total Entrées</p>
                      <p className="text-sm font-mono text-[var(--text-muted)] self-center text-right pr-4 py-1">—</p>
                      <p className="text-sm font-mono text-[var(--text-muted)] self-center text-right pr-4 py-1">—</p>
                      <p className="text-sm font-mono font-semibold text-[var(--amber)] self-center text-right pr-2 py-1">{formatCurrency(metrics.totalCapital)}</p>
                    </div>
                    {/* Total général */}
                    <div className="grid grid-cols-[1fr_110px_110px_120px] gap-0 pt-2 border-t border-[var(--amber)]/30 mt-1">
                      <p className="text-base font-bold text-[var(--text-primary)] self-center">TOTAL GÉNÉRAL</p>
                      <p className="text-sm font-mono font-bold text-[var(--text-primary)] self-center text-right pr-4">{formatCurrency(metrics.totalHT)}</p>
                      <p className="text-sm font-mono font-bold text-[var(--text-secondary)] self-center text-right pr-4">{formatCurrency(metrics.totalTVA)}</p>
                      <p className="text-base font-mono font-bold text-[var(--amber)] self-center text-right pr-2">{formatCurrency(metrics.totalEntrees)}</p>
                    </div>
                  </>
                )}
              </div>
              {/* Mobile */}
              <div className="md:hidden space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Total devis</p>
                  <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalTTC)}</p>
                </div>
                {metrics.totalCapital > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--text-secondary)]">Total Entrées</p>
                      <p className="text-sm font-mono text-[var(--amber)]">{formatCurrency(metrics.totalCapital)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[var(--amber)]/30">
                      <p className="text-base font-bold text-[var(--text-primary)]">TOTAL GÉNÉRAL</p>
                      <p className="text-base font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalEntrees)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Entrées de capital ─────────────────────────────────── */}
      {confirmedCapital.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-1)] mb-6">
          <div className="px-4 lg:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank size={16} className="text-[var(--amber)]" />
              <h2 className="font-bold text-[var(--text-primary)] text-sm">Entrées de capital</h2>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {confirmedCapital.length} entrée{confirmedCapital.length > 1 ? "s" : ""} · Total : <span className="font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalCapital)}</span>
            </span>
          </div>
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_90px_40px] gap-0 px-6 py-3 border-b border-[var(--border)]">
            {["Libellé", "Source", "Date", "Montant", ""].map((h) => (
              <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          {confirmedCapital.map((e) => (
            <div key={e.id}>
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[1fr_100px_120px_90px_40px] items-center gap-0 px-6 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.libelle}</p>
                <p className="text-xs text-[var(--text-secondary)] capitalize">{SOURCES.find(s => s.value === e.source)?.label}</p>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Calendar size={11}/>{formatDate(e.date)}</div>
                <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(e.montant)}</p>
                <button onClick={() => removeEntreeCapital(e.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all">
                  <Trash size={13} />
                </button>
              </div>
              {/* Mobile */}
              <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.libelle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-secondary)]">{SOURCES.find(s => s.value === e.source)?.label}</span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10}/>{formatDate(e.date)}</span>
                  </div>
                </div>
                <p className="text-sm font-mono font-bold text-[var(--amber)] shrink-0">{formatCurrency(e.montant)}</p>
                <button onClick={() => removeEntreeCapital(e.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all shrink-0">
                  <Trash size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal entrée de capital ─────────────────────────────── */}
      <AnimatePresence>
        {capitalModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCapitalModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-sm bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={18} className="text-[var(--amber)]" />
                    <h3 className="font-bold text-[var(--text-primary)]">Nouvelle entrée de capital</h3>
                  </div>
                  <button onClick={() => setCapitalModal(false)} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Libellé *</label>
                    <input autoFocus value={capitalForm.libelle}
                      onChange={(e) => setCapitalForm(f => ({ ...f, libelle: e.target.value }))}
                      placeholder="Ex: Apport initial, Vente événement..."
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Montant (€) *</label>
                      <input type="number" min="0" step="0.01" value={capitalForm.montant}
                        onChange={(e) => setCapitalForm(f => ({ ...f, montant: e.target.value }))}
                        placeholder="0.00"
                        className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Date</label>
                      <input type="date" value={capitalForm.date}
                        onChange={(e) => setCapitalForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Source</label>
                    <select value={capitalForm.source}
                      onChange={(e) => setCapitalForm(f => ({ ...f, source: e.target.value as EntreeCapital["source"] }))}
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all">
                      {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setCapitalModal(false)} className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Annuler</button>
                  <button onClick={handleAddCapital}
                    disabled={!capitalForm.libelle.trim() || !capitalForm.montant}
                    className="flex-1 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors disabled:opacity-40">
                    Ajouter
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Doc generation modal */}
      <AnimatePresence>
        {docModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDocModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-md bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <FilePdf size={18} weight="fill" className="text-[var(--amber)]" />
                    <h2 className="font-bold text-[var(--text-primary)]">Documentation légale</h2>
                  </div>
                  <button onClick={() => setDocModal(null)} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="px-6 py-6 space-y-3">
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    Sélectionnez le document à générer pour la période : <span className="text-[var(--amber)] font-semibold">{PERIOD_OPTIONS.find(p => p.value === period)?.label}</span>
                  </p>

                  {[
                    {
                      id: "summary",
                      icon: <Receipt size={20} weight="fill" />,
                      title: "Récapitulatif comptable",
                      desc: `Tableau de synthèse CA HT/TVA/TTC — ${confirmed.length} devis confirmés`,
                    },
                    {
                      id: "invoices",
                      icon: <FilePdf size={20} weight="fill" />,
                      title: "Journal des ventes",
                      desc: "Liste chronologique des prestations facturées avec références",
                    },
                    {
                      id: "tva",
                      icon: <CurrencyEur size={20} weight="fill" />,
                      title: "Déclaration TVA",
                      desc: `TVA collectée : ${formatCurrency(metrics.totalTVA)} — Base imposable HT : ${formatCurrency(metrics.totalHT)}`,
                    },
                  ].map((doc) => (
                    <DocButton
                      key={doc.id}
                      icon={doc.icon}
                      title={doc.title}
                      desc={doc.desc}
                      onGenerate={() => handleGenerate(doc.id, confirmed, metrics)}
                    />
                  ))}
                </div>

                <div className="px-6 pb-5">
                  <p className="text-[11px] text-[var(--text-muted)] text-center">
                    Les documents sont générés au format texte imprimable. Pour un usage comptable officiel, transmettez-les à votre expert-comptable.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocButton({ icon, title, desc, onGenerate }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onGenerate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onGenerate();
    setLoading(false);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--amber)]/20 transition-all group">
      <div className="w-10 h-10 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{desc}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-all shrink-0 ${
          done
            ? "bg-green-500/15 text-[var(--success)] border border-green-500/30"
            : "bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--surface)] border border-[var(--amber)]/20"
        }`}
      >
        {loading ? (
          <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
        ) : done ? (
          "Généré"
        ) : (
          <><Download size={12} weight="bold" /> Générer</>
        )}
      </motion.button>
    </div>
  );
}

async function handleGenerate(
  type: string,
  confirmed: Devis[],
  metrics: { totalHT: number; totalTVA: number; totalTTC: number; count: number; avgDevis: number }
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR");
  const fileName = `clc-traiteur-${type}-${dateStr.replace(/\//g, "-")}.pdf`;

  const AMBER = [232, 150, 12] as [number, number, number];
  const DARK  = [26, 30, 36]  as [number, number, number];
  const GRAY  = [87, 96, 106] as [number, number, number];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  const addHeader = (title: string, subtitle: string) => {
    // Bande amber
    doc.setFillColor(...AMBER);
    doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("C.LC. Traiteur — Chez La Camerounaise", 14, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Traiteur événementiel · contact@clctraiteur.fr", 14, 17);

    // Titre document
    doc.setTextColor(...DARK);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 34);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(subtitle, 14, 40);
    doc.text(`Généré le ${dateStr}`, W - 14, 40, { align: "right" });

    // Ligne séparatrice
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.5);
    doc.line(14, 43, W - 14, 43);
  };

  const addFooter = (pageNum: number, total: number) => {
    const y = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text("Document conforme aux obligations légales françaises (CGI art. 289) — À conserver 10 ans", 14, y);
    doc.text(`Page ${pageNum} / ${total}`, W - 14, y, { align: "right" });
  };

  // ─── RÉCAPITULATIF COMPTABLE ───────────────────────────────────────────────
  if (type === "summary") {
    addHeader("Récapitulatif Comptable", `Période : ensemble des devis confirmés — ${metrics.count} facture(s)`);

    // Synthèse
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Synthèse financière", 14, 52);

    autoTable(doc, {
      startY: 56,
      head: [["Indicateur", "Montant"]],
      body: [
        ["Chiffre d'affaires Hors Taxes", `${metrics.totalHT.toFixed(2)} €`],
        ["TVA collectée (taux 20%)", `${metrics.totalTVA.toFixed(2)} €`],
        ["Chiffre d'affaires TTC", `${metrics.totalTTC.toFixed(2)} €`],
        ["Nombre de prestations facturées", String(metrics.count)],
        ["Valeur moyenne par devis TTC", `${metrics.count ? (metrics.totalTTC / metrics.count).toFixed(2) : "0.00"} €`],
      ],
      headStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    const afterSummary = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Détail par prestation", 14, afterSummary);

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [["Réf.", "Client", "Type", "Date", "HT", "TVA", "TTC"]],
      body: confirmed.map(d => [
        d.id,
        d.clientName,
        d.eventType,
        formatDate(d.eventDate),
        `${d.totalHT.toFixed(2)} €`,
        `${(d.totalTTC - d.totalHT).toFixed(2)} €`,
        `${d.totalTTC.toFixed(2)} €`,
      ]),
      foot: [["", "", "", "TOTAL", `${metrics.totalHT.toFixed(2)} €`, `${metrics.totalTVA.toFixed(2)} €`, `${metrics.totalTTC.toFixed(2)} €`]],
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" } },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });

    addFooter(1, 1);
  }

  // ─── JOURNAL DES VENTES ────────────────────────────────────────────────────
  else if (type === "invoices") {
    addHeader("Journal des Ventes", `Registre chronologique des prestations — ${confirmed.length} entrée(s)`);

    const rows: string[][] = [];
    confirmed.forEach((d, i) => {
      rows.push([
        `${String(i + 1).padStart(3, "0")}`,
        d.id,
        d.clientName,
        d.clientPhone,
        d.eventType,
        formatDate(d.eventDate),
        String(d.guestCount),
        `${d.totalHT.toFixed(2)} €`,
        `${(d.totalTTC - d.totalHT).toFixed(2)} €`,
        `${d.totalTTC.toFixed(2)} €`,
      ]);
    });

    autoTable(doc, {
      startY: 50,
      head: [["N°", "Réf.", "Client", "Téléphone", "Type", "Date", "Conv.", "HT", "TVA", "TTC"]],
      body: rows,
      foot: [["", "", "", "", "", "", "", `${metrics.totalHT.toFixed(2)} €`, `${metrics.totalTVA.toFixed(2)} €`, `${metrics.totalTTC.toFixed(2)} €`]],
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: {
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right", fontStyle: "bold" },
      },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        addFooter(data.pageNumber, doc.getNumberOfPages());
      },
    });

    // Détail des prestations
    confirmed.forEach((d, idx) => {
      doc.addPage();
      addHeader(`Détail Prestation — ${d.id}`, `${d.clientName} · ${d.eventType} · ${formatDate(d.eventDate)}`);

      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(`Client : ${d.clientName} · ${d.clientPhone}`, 14, 52);
      doc.text(`Convives : ${d.guestCount} · Statut : ${d.status}`, 14, 57);

      autoTable(doc, {
        startY: 62,
        head: [["Plat / Prestation", "Quantité", "Prix unit.", "Sous-total"]],
        body: d.items.map(item => [
          item.dishName,
          String(item.quantity),
          `${item.unitPrice.toFixed(2)} €`,
          `${item.subtotal.toFixed(2)} €`,
        ]),
        foot: [
          ["", "", "Sous-total HT", `${d.totalHT.toFixed(2)} €`],
          ["", "", "TVA 20%", `${(d.totalTTC - d.totalHT).toFixed(2)} €`],
          ["", "", "TOTAL TTC", `${d.totalTTC.toFixed(2)} €`],
        ],
        headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold" },
        footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 250] },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
        styles: { fontSize: 9, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });

      addFooter(idx + 2, confirmed.length + 1);
    });
  }

  // ─── DÉCLARATION TVA ───────────────────────────────────────────────────────
  else if (type === "tva") {
    addHeader("Déclaration de TVA Collectée", `Régime réel simplifié · Taux 20% · ${dateStr}`);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Récapitulatif des opérations imposables", 14, 52);

    autoTable(doc, {
      startY: 56,
      head: [["Intitulé", "Montant"]],
      body: [
        ["Base d'imposition HT (taux 20%)", `${metrics.totalHT.toFixed(2)} €`],
        ["TVA collectée due (20%)", `${metrics.totalTVA.toFixed(2)} €`],
        ["Chiffre d'affaires TTC", `${metrics.totalTTC.toFixed(2)} €`],
      ],
      headStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      styles: { fontSize: 11, cellPadding: 4 },
      margin: { left: 14, right: 14 },
    });

    const afterTotals = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Détail des opérations", 14, afterTotals);

    autoTable(doc, {
      startY: afterTotals + 4,
      head: [["Réf.", "Client", "Date événement", "Base HT", "TVA 20%"]],
      body: confirmed.map(d => [
        d.id,
        d.clientName,
        formatDate(d.eventDate),
        `${d.totalHT.toFixed(2)} €`,
        `${(d.totalTTC - d.totalHT).toFixed(2)} €`,
      ]),
      foot: [["", "", "TOTAL", `${metrics.totalHT.toFixed(2)} €`, `${metrics.totalTVA.toFixed(2)} €`]],
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });

    const afterDetail = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    const mention = [
      "Conformément à l'article 289 du Code Général des Impôts, ce document récapitulatif de TVA collectée doit être",
      "conservé pendant 10 ans et transmis à votre expert-comptable pour établissement de votre déclaration CA3.",
    ];
    mention.forEach((line, i) => doc.text(line, 14, afterDetail + i * 5));

    addFooter(1, 1);
  }

  doc.save(fileName);
}
