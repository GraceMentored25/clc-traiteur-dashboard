"use client";

import { useMemo, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  CurrencyEur,
  Receipt,
  TrendUp,
  CheckCircle,
  FilePdf,
  Eye,
  Download,
  Calendar,
  X,
  Plus,
  Trash,
  PiggyBank,
  PencilSimple,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { Devis, EntreeCapital } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDown, ArrowUp, ShoppingCart, Truck } from "@phosphor-icons/react";
import { Select } from "@/components/ui/SelectV2";

type Period = "all" | "month" | "quarter" | "year";

const SOURCES: { value: EntreeCapital["source"]; label: string }[] = [
  { value: "vente", label: "Vente" },
  { value: "apport", label: "Apport personnel" },
  { value: "subvention", label: "Subvention" },
  { value: "autre", label: "Autre" },
];

const TVA_RATE = 0.20;

export default function ComptabiliteClientFinal() {
  const { devisList, entreesCapital, addEntreeCapital, removeEntreeCapital,
          demandesCourses, demandesLogistique } = useStore();
  const [period, setPeriod] = useState<Period>("all");
  const [docModal, setDocModal] = useState<"summary" | "invoices" | "tva" | null>(null);
  const [docModalPreview, setDocModalPreview] = useState(false);
  const [capitalModal, setCapitalModal] = useState(false);
  const [editingCapitalId, setEditingCapitalId] = useState<string | null>(null);
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

  // Sorties confirmées (courses repas + logistique)
  const sortiesRepas = useMemo(() =>
    demandesCourses.filter((d) => d.statut === "confirmé"), [demandesCourses]);
  const { materiel } = useStore();
  const sortiesLogistique = useMemo(() =>
    demandesLogistique.filter((d) => d.statut === "confirmé").map((d) => ({
      ...d,
      // Recalculer totalEstime si absent (anciennes demandes)
      totalEstime: d.totalEstime && d.totalEstime > 0
        ? d.totalEstime
        : d.items.reduce((sum, item) => {
            const mat = materiel.find((m) => m.name === item.name);
            return sum + (mat?.pricePerUnit ?? 0) * item.qty;
          }, 0),
    })),
  [demandesLogistique, materiel]);

  const metrics = useMemo(() => {
    const totalHT = confirmed.reduce((s, d) => s + d.totalHT, 0);
    const totalTVA = confirmed.reduce((s, d) => s + (d.totalTTC - d.totalHT), 0);
    const totalTTC = confirmed.reduce((s, d) => s + d.totalTTC, 0);
    const avgDevis = confirmed.length ? totalTTC / confirmed.length : 0;
    const totalCapital = confirmedCapital.reduce((s, e) => s + e.montant, 0);
    const totalEntrees = totalTTC + totalCapital;
    const totalSortiesRepas = sortiesRepas.reduce((s, d) => s + d.totalEstime, 0);
    const totalSortiesLog = sortiesLogistique.reduce((s, d) => s + (d.totalEstime ?? 0), 0);
    const totalSorties = totalSortiesRepas + totalSortiesLog;
    const solde = totalEntrees - totalSorties;
    return { totalHT, totalTVA, totalTTC, avgDevis, count: confirmed.length, totalCapital, totalEntrees, totalSorties, solde };
  }, [confirmed, confirmedCapital, sortiesRepas, sortiesLogistique]);

  const handleAddCapital = () => {
    const montant = parseFloat(capitalForm.montant.replace(",", "."));
    if (!capitalForm.libelle.trim() || isNaN(montant) || montant <= 0) return;
    if (editingCapitalId) {
      // Modification
      removeEntreeCapital(editingCapitalId);
      addEntreeCapital({ id: editingCapitalId, libelle: capitalForm.libelle.trim(), montant, date: capitalForm.date, source: capitalForm.source });
      setEditingCapitalId(null);
    } else {
      addEntreeCapital({ id: `CAP-${crypto.randomUUID()}`, libelle: capitalForm.libelle.trim(), montant, date: capitalForm.date, source: capitalForm.source });
    }
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
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCapitalModal(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 text-xs font-semibold transition-colors"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Entrée de capital</span>
            <span className="sm:hidden">Capital</span>
          </m.button>
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setDocModalPreview(true); setDocModal("summary"); }}
            className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 text-xs font-semibold transition-colors"
          >
            <Eye size={14} weight="fill" />
            <span className="hidden sm:inline">Visualiser</span>
          </m.button>
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setDocModal("summary")}
            className="flex items-center gap-2 h-9 px-3 lg:px-4 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-xs lg:text-sm font-semibold transition-colors"
          >
            <FilePdf size={15} weight="fill" />
            <span className="hidden sm:inline">Générer</span>
          </m.button>
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
          { label: "Total encaissé", value: formatCurrency(metrics.totalEntrees), icon: <ArrowDown size={18} weight="fill" />, accent: true },
          { label: "Sorties confirmées", value: formatCurrency(metrics.totalSorties), icon: <ArrowUp size={18} weight="fill" />, negative: true },
          { label: "Solde net", value: formatCurrency(metrics.solde), icon: <CurrencyEur size={18} weight="fill" />, accent: false },
          { label: "TVA collectée (20%)", value: formatCurrency(metrics.totalTVA), icon: <Receipt size={18} weight="fill" />, accent: false },
        ].map((card, i) => (
          <m.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 25 }}
            className={`p-5 rounded-2xl border ${
              (card as {negative?: boolean}).negative
                ? "bg-red-500/5 border-red-500/20"
                : card.accent
                  ? "bg-[var(--amber)]/8 border-[var(--amber)]/20"
                  : "bg-[var(--surface-1)] border-[var(--border)]"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${
              (card as {negative?: boolean}).negative
                ? "bg-red-500/15 text-[var(--danger)]"
                : card.accent
                  ? "bg-[var(--amber)]/20 text-[var(--amber)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
            }`}>
              {card.icon}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-1">{card.label}</p>
            <p className={`text-xl font-bold font-mono tracking-tight ${
              (card as {negative?: boolean}).negative
                ? "text-[var(--danger)]"
                : card.accent
                  ? "text-[var(--amber)]"
                  : "text-[var(--text-primary)]"
            }`}>
              {card.value}
            </p>
          </m.div>
        ))}
      </div>

      {/* Récapitulatif financier par devis */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-1)] mb-6">
        <div className="px-4 lg:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-[var(--amber)]" />
            <h2 className="font-bold text-[var(--text-primary)] text-sm">Détail des encaissements</h2>
          </div>
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
              {(["Réf.", "Client", "Événement", "Montant HT", "TVA 20%", "Total TTC"] as const).map((h, i) => (
                <p key={h} className={`text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide ${i === 3 || i === 4 ? "text-right pr-4" : i === 5 ? "text-right pr-2" : ""}`}>{h}</p>
              ))}
            </div>

            {confirmed.map((devis, i) => (
              <m.div key={devis.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
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
              </m.div>
            ))}

            {/* Total section devis */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-[var(--surface-2)] border-t-2 border-[var(--amber)]/20">
              <p className="text-sm font-bold text-[var(--text-primary)]">Total encaissements devis</p>
              <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalTTC)}</p>
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
              {confirmedCapital.length} entrée{confirmedCapital.length > 1 ? "s" : ""}
            </span>
          </div>
          {/* Desktop header — même grille exacte que Détail encaissements */}
          <div className="hidden md:grid gap-0 px-6 py-3 border-b border-[var(--border)]" style={{ gridTemplateColumns: "80px 1fr 130px 110px 110px 120px" }}>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide" style={{ gridColumn: "1 / 3" }}>Libellé</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Source</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right pr-2" style={{ gridColumn: "4 / 6" }}>Date</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right pr-2">Montant</p>
          </div>
          {confirmedCapital.map((e) => (
            <div key={e.id}>
              {/* Desktop */}
              <div className="hidden md:grid items-center gap-0 px-6 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors group" style={{ gridTemplateColumns: "80px 1fr 130px 110px 110px 120px" }}>
                <p className="text-sm font-medium text-[var(--text-primary)] truncate" style={{ gridColumn: "1 / 3" }}>{e.libelle}</p>
                <p className="text-xs text-[var(--text-secondary)] capitalize">{SOURCES.find(s => s.value === e.source)?.label}</p>
                <div className="flex w-full items-center justify-end gap-1 text-xs text-[var(--text-muted)] pr-2" style={{ gridColumn: "4 / 6" }}><Calendar size={11}/>{formatDate(e.date)}</div>
                {/* Montant + boutons alignés à droite */}
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => { setCapitalForm({ libelle: e.libelle, montant: String(e.montant), date: e.date, source: e.source }); setEditingCapitalId(e.id); setCapitalModal(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-all opacity-0 group-hover:opacity-100">
                    <PencilSimple size={13} />
                  </button>
                  <button onClick={() => removeEntreeCapital(e.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash size={13} />
                  </button>
                  <p className="text-sm font-mono font-bold text-[var(--amber)] min-w-[80px] text-right">{formatCurrency(e.montant)}</p>
                </div>
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
                <button onClick={() => { setCapitalForm({ libelle: e.libelle, montant: String(e.montant), date: e.date, source: e.source }); setEditingCapitalId(e.id); setCapitalModal(true); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-all shrink-0">
                  <PencilSimple size={13} />
                </button>
                <button onClick={() => removeEntreeCapital(e.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all shrink-0">
                  <Trash size={13} />
                </button>
              </div>
            </div>
          ))}
          {/* Total en pied */}
          <div className="hidden md:flex items-center justify-between px-6 py-3 bg-[var(--surface-2)] border-t-2 border-[var(--amber)]/20">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total entrées de capital</p>
            <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalCapital)}</p>
          </div>
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-t-2 border-[var(--amber)]/20">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total entrées de capital</p>
            <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalCapital)}</p>
          </div>
        </div>
      )}

      {/* ── Modal entrée de capital ─────────────────────────────── */}
      <AnimatePresence>
        {capitalModal && (
          <>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCapitalModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <m.div
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
                    <h3 className="font-bold text-[var(--text-primary)]">{editingCapitalId ? "Modifier l'entrée" : "Nouvelle entrée de capital"}</h3>
                  </div>
                  <button onClick={() => { setCapitalModal(false); setEditingCapitalId(null); }} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
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
                    <Select
                      value={capitalForm.source}
                      onChange={(v) => setCapitalForm(f => ({ ...f, source: v as EntreeCapital["source"] }))}
                      options={SOURCES}
                      className="w-full"
                    />
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
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sorties (courses confirmées) ───────────────────────── */}
      {(sortiesRepas.length > 0 || sortiesLogistique.length > 0) && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-1)] mb-6">
          <div className="px-4 lg:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDown size={16} className="text-[var(--amber)]" />
              <h2 className="font-bold text-[var(--text-primary)] text-sm">Sorties confirmées</h2>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalSorties)}</span>
          </div>

          {/* Header desktop — même grille que Détail */}
          <div className="hidden md:grid gap-0 px-6 py-3 border-b border-[var(--border)]" style={{ gridTemplateColumns: "80px 1fr 130px 110px 110px 120px" }}>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide" style={{ gridColumn: "1" }}>Type</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide" style={{ gridColumn: "2" }}>Référence</p>
            <p style={{ gridColumn: "3" }}></p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right pr-2" style={{ gridColumn: "4 / 6" }}>Date</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-right pr-2" style={{ gridColumn: "6" }}>Montant</p>
          </div>

          {sortiesRepas.map((d) => (
            <div key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
              {/* Desktop */}
              <div className="hidden md:grid items-center gap-0 px-6 py-3" style={{ gridTemplateColumns: "80px 1fr 130px 110px 110px 120px" }}>
                <div style={{ gridColumn: "1" }} className="flex items-center gap-1.5"><ShoppingCart size={12} className="text-[var(--text-muted)]"/><span className="text-xs text-[var(--text-secondary)]">Repas</span></div>
                <p style={{ gridColumn: "2" }} className="text-sm font-medium text-[var(--text-primary)] truncate">{d.clientName}</p>
                <div style={{ gridColumn: "3" }}></div>
                <div style={{ gridColumn: "4 / 6" }} className="flex w-full items-center justify-end gap-1 text-xs text-[var(--text-muted)] pr-2"><Calendar size={11}/>{formatDate(d.eventDate)}</div>
                <p style={{ gridColumn: "6" }} className="text-sm font-mono font-bold text-[var(--amber)] text-right pr-2">{formatCurrency(d.totalEstime)}</p>
              </div>
              {/* Mobile */}
              <div className="md:hidden flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">Courses repas — {d.clientName}</p>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10}/>{formatDate(d.eventDate)}</span>
                </div>
                <p className="text-sm font-mono font-bold text-[var(--amber)] shrink-0">{formatCurrency(d.totalEstime)}</p>
              </div>
            </div>
          ))}

          {sortiesLogistique.map((d) => {
            const total = d.totalEstime ?? 0;
            return (
              <div key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                {/* Desktop */}
                <div className="hidden md:grid items-center gap-0 px-6 py-3" style={{ gridTemplateColumns: "80px 1fr 130px 110px 110px 120px" }}>
                  <div style={{ gridColumn: "1" }} className="flex items-center gap-1.5"><Truck size={12} className="text-[var(--text-muted)]"/><span className="text-xs text-[var(--text-secondary)]">Logistique</span></div>
                  <p style={{ gridColumn: "2" }} className="text-sm font-medium text-[var(--text-primary)] truncate">{d.clientName}</p>
                  <div style={{ gridColumn: "3" }}></div>
                  <div style={{ gridColumn: "4 / 6" }} className="flex w-full items-center justify-end gap-1 text-xs text-[var(--text-muted)] pr-2"><Calendar size={11}/>{formatDate(d.eventDate)}</div>
                  <p style={{ gridColumn: "6" }} className="text-sm font-mono font-bold text-[var(--amber)] text-right pr-2">{total > 0 ? formatCurrency(total) : "—"}</p>
                </div>
                {/* Mobile */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">Logistique — {d.clientName}</p>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10}/>{formatDate(d.eventDate)}</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-[var(--amber)] shrink-0">{total > 0 ? formatCurrency(total) : "—"}</p>
                </div>
              </div>
            );
          })}
          {/* Total sorties — aligné sur la colonne Montant */}
          <div className="hidden md:flex items-center justify-between px-6 py-3 bg-[var(--surface-2)] border-t-2 border-[var(--amber)]/20">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total sorties confirmées</p>
            <p className="text-sm font-mono font-bold text-[var(--amber)] pr-2">{formatCurrency(metrics.totalSorties)}</p>
          </div>
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-t-2 border-[var(--amber)]/20">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total sorties confirmées</p>
            <p className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalSorties)}</p>
          </div>
        </div>
      )}

      {/* ── Bilan général ──────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-[var(--amber)]/30 overflow-hidden bg-[var(--surface-1)] mb-6">
        <div className="px-4 lg:px-6 py-4 border-b border-[var(--amber)]/20 bg-[var(--amber)]/5 flex items-center gap-2">
          <CurrencyEur size={16} className="text-[var(--amber)]" />
          <h2 className="font-bold text-[var(--text-primary)] text-sm">Bilan général</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Encaissements devis (TTC)</span>
            <span className="text-sm font-mono font-semibold text-[var(--amber)]">{formatCurrency(metrics.totalTTC)}</span>
          </div>
          {metrics.totalCapital > 0 && (
            <div className="flex items-center justify-between px-4 lg:px-6 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Entrées de capital</span>
              <span className="text-sm font-mono font-semibold text-[var(--amber)]">{formatCurrency(metrics.totalCapital)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-[var(--amber)]/5">
            <span className="text-sm font-bold text-[var(--text-primary)]">Total encaissé</span>
            <span className="text-sm font-mono font-bold text-[var(--amber)]">{formatCurrency(metrics.totalEntrees)}</span>
          </div>
          {metrics.totalSorties > 0 && (
            <>
              <div className="flex items-center justify-between px-4 lg:px-6 py-3">
                <span className="text-sm text-[var(--text-secondary)]">Sorties confirmées</span>
                <span className="text-sm font-mono font-semibold text-[var(--amber)]">− {formatCurrency(metrics.totalSorties)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between px-4 lg:px-6 py-4 bg-[var(--amber)]/8">
            <span className="text-base font-bold text-[var(--text-primary)]">SOLDE NET</span>
            <span className={`text-base font-mono font-bold ${metrics.solde >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
              {formatCurrency(metrics.solde)}
            </span>
          </div>
        </div>
      </div>

      {/* Doc generation modal */}
      <AnimatePresence>
        {docModal && (
          <>
            <m.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setDocModal(null); setDocModalPreview(false); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <m.div
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
                    {docModalPreview ? <Eye size={18} weight="fill" className="text-[var(--amber)]" /> : <FilePdf size={18} weight="fill" className="text-[var(--amber)]" />}
                    <h2 className="font-bold text-[var(--text-primary)]">{docModalPreview ? "Visualiser un document" : "Documentation légale"}</h2>
                  </div>
                  <button onClick={() => { setDocModal(null); setDocModalPreview(false); }} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="px-6 py-6 space-y-3">
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    {docModalPreview ? "Sélectionnez le document à visualiser" : "Sélectionnez le document à générer"} pour la période : <span className="text-[var(--amber)] font-semibold">{PERIOD_OPTIONS.find(p => p.value === period)?.label}</span>
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
                      preview={docModalPreview}
                      onGenerate={() => handleGenerate(doc.id, confirmed, metrics, confirmedCapital, sortiesRepas, sortiesLogistique, docModalPreview)}
                    />
                  ))}
                </div>

                <div className="px-6 pb-5">
                  <p className="text-[11px] text-[var(--text-muted)] text-center">
                    Les documents sont générés au format texte imprimable. Pour un usage comptable officiel, transmettez-les à votre expert-comptable.
                  </p>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocButton({ icon, title, desc, preview, onGenerate }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  preview?: boolean;
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
      <m.button
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
          preview ? "Ouvert" : "Généré"
        ) : preview ? (
          <><Eye size={12} weight="fill" /> Visualiser</>
        ) : (
          <><Download size={12} weight="bold" /> Générer</>
        )}
      </m.button>
    </div>
  );
}

async function handleGenerate(
  type: string,
  confirmed: Devis[],
  metrics: { totalHT: number; totalTVA: number; totalTTC: number; count: number; avgDevis: number; totalCapital?: number; totalEntrees?: number; totalSorties?: number; solde?: number },
  entreesCapital: EntreeCapital[] = [],
  sortiesRepas: import("@/lib/types").DemandeCoursesRepas[] = [],
  sortiesLogistique: import("@/lib/types").DemandeLogistique[] = [],
  preview = false
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

    let y = 52;

    // ── Section 1 : Encaissements devis ──────────────────────────────
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text("1. Encaissements — Devis confirmés", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Réf.", "Client", "Type", "Date", "HT", "TVA", "TTC"]],
      body: confirmed.map(d => [d.id, d.clientName, d.eventType, formatDate(d.eventDate),
        `${d.totalHT.toFixed(2)} €`, `${(d.totalTTC - d.totalHT).toFixed(2)} €`, `${d.totalTTC.toFixed(2)} €`]),
      foot: [["", "", "", "Total", `${metrics.totalHT.toFixed(2)} €`, `${metrics.totalTVA.toFixed(2)} €`, `${metrics.totalTTC.toFixed(2)} €`]],
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: {
        0: { cellWidth: 16, halign: "left" },
        1: { cellWidth: 46, halign: "left" },
        2: { cellWidth: 26, halign: "left" },
        3: { cellWidth: 28, halign: "center" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 20, halign: "right", fontStyle: "bold" },
      },
      styles: { fontSize: 9, cellPadding: 2.5 }, margin: { left: 14, right: 14 },
    }); // total: 16+46+26+28+24+22+20 = 182mm = A4-margins
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // ── Section 2 : Entrées de capital ────────────────────────────────
    if (entreesCapital.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
      doc.text("2. Entrées de capital", 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [["Libellé", "Source", "Date", "Montant"]],
        body: entreesCapital.map(e => [e.libelle, e.source, formatDate(e.date), `${e.montant.toFixed(2)} €`]),
        foot: [["", "", "Total entrées", `${(metrics.totalCapital ?? 0).toFixed(2)} €`]],
        headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 250] },
        columnStyles: {
          0: { cellWidth: 84, halign: "left" },
          1: { cellWidth: 36, halign: "left" },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        }, // 84+36+30+32=182mm
        styles: { fontSize: 9, cellPadding: 2.5 }, margin: { left: 14, right: 14 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // ── Section 3 : Sorties confirmées ────────────────────────────────
    const toutesLesSorties = [
      ...sortiesRepas.map(d => [`Courses repas`, d.clientName, formatDate(d.eventDate), `${d.totalEstime.toFixed(2)} €`]),
      ...sortiesLogistique.map(d => [`Logistique`, d.clientName, formatDate(d.eventDate), `${(d.totalEstime ?? 0).toFixed(2)} €`]),
    ];
    if (toutesLesSorties.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
      doc.text("3. Sorties confirmées", 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [["Type", "Référence", "Date", "Montant"]],
        body: toutesLesSorties,
        foot: [["", "", "Total sorties", `${(metrics.totalSorties ?? 0).toFixed(2)} €`]],
        headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        footStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 250] },
        columnStyles: {
          0: { cellWidth: 28, halign: "left" },
          1: { cellWidth: 92, halign: "left" },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        }, // 28+92+30+32=182mm
        styles: { fontSize: 9, cellPadding: 2.5 }, margin: { left: 14, right: 14 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // ── Section 4 : Bilan général ─────────────────────────────────────
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text("4. Bilan général", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Rubrique", "Montant"]],
      body: [
        ["Encaissements devis TTC", `${metrics.totalTTC.toFixed(2)} €`],
        ["Entrées de capital", `${(metrics.totalCapital ?? 0).toFixed(2)} €`],
        ["Total encaissé", `${(metrics.totalEntrees ?? metrics.totalTTC).toFixed(2)} €`],
        ["Sorties confirmées", `-${(metrics.totalSorties ?? 0).toFixed(2)} €`],
        ["SOLDE NET", `${(metrics.solde ?? metrics.totalTTC).toFixed(2)} €`],
        ["TVA collectée (20%)", `${metrics.totalTVA.toFixed(2)} €`],
      ],
      headStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: {
        0: { cellWidth: 132, halign: "left" },
        1: { cellWidth: 50, halign: "right", fontStyle: "bold" },
      }, // 132+50=182mm
      styles: { fontSize: 10, cellPadding: 3.5 }, margin: { left: 14, right: 14 },
    });

    addFooter(1, doc.getNumberOfPages());
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
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 18, halign: "left" },
        2: { cellWidth: "auto", halign: "left" },
        3: { cellWidth: 26, halign: "left" },
        4: { cellWidth: 22, halign: "left" },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: 12, halign: "center" },
        7: { cellWidth: 22, halign: "right" },
        8: { cellWidth: 20, halign: "right" },
        9: { cellWidth: 24, halign: "right", fontStyle: "bold" },
      },
      styles: { fontSize: 7.5, cellPadding: 2 },
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
        columnStyles: {
          0: { cellWidth: "auto", halign: "left" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 28, halign: "right" },
          3: { cellWidth: 34, halign: "right", fontStyle: "bold" },
        },
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
      columnStyles: {
        0: { cellWidth: 20, halign: "left" },
        1: { cellWidth: "auto", halign: "left" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 32, halign: "right" },
        4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      },
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

  if (preview) {
    const url = doc.output("bloburl");
    window.open(url as unknown as string, "_blank");
  } else {
    doc.save(fileName);
  }
}

 
