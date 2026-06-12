"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, Plus, Calendar, Receipt, PencilSimple, Trash, Warning, FilePdf } from "@phosphor-icons/react";
import { generateDevisPDF } from "@/lib/generateDevisPDF";
import { useStore } from "@/lib/store";
import { Devis, DevisStatus } from "@/lib/types";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import { useRouter } from "next/navigation";
import DevisDetail from "./DevisDetail";
import DevisEditModal from "./DevisEditModal";

const STATUS_OPTIONS: (DevisStatus | "Tous")[] = ["Tous", "Brouillon", "Envoyé", "Confirmé", "Annulé"];

export default function DevisClient() {
  const { devisList, updateDevisStatus, updateDevis, deleteDevis } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DevisStatus | "Tous">("Tous");
  const [selected, setSelected] = useState<Devis | null>(null);
  const [editing, setEditing] = useState<Devis | null>(null);
  const [toDelete, setToDelete] = useState<Devis | null>(null);

  const filtered = useMemo(() => {
    return devisList.filter((d) => {
      const matchStatus = statusFilter === "Tous" || d.status === statusFilter;
      const matchSearch =
        d.clientName.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [devisList, search, statusFilter]);

  const stats = useMemo(() => {
    const confirmed = devisList.filter((d) => d.status === "Confirmé");
    return {
      total: devisList.length,
      confirmed: confirmed.length,
      ca: confirmed.reduce((s, d) => s + d.totalTTC, 0),
      pending: devisList.filter((d) => d.status === "Envoyé").length,
    };
  }, [devisList]);

  const handleDelete = (devis: Devis) => {
    setToDelete(devis);
    setSelected(null);
  };

  const confirmDelete = () => {
    if (toDelete) {
      deleteDevis(toDelete.id);
      setToDelete(null);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Gestion de devis</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {devisList.length} devis — {stats.confirmed} confirmés
          </p>
        </div>
        <m.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-sm font-semibold hover:bg-[var(--amber-light)] transition-colors"
        >
          <Plus size={15} weight="bold" />
          Nouveau devis
        </m.button>
      </div>

      {/* KPI mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total devis", value: stats.total, mono: false },
          { label: "Confirmés", value: stats.confirmed, mono: false },
          { label: "En attente", value: stats.pending, mono: false },
          { label: "CA confirmé TTC", value: formatCurrency(stats.ca), mono: true },
        ].map((stat, i) => (
          <m.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 25 }}
            className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)]"
          >
            <p className="text-xs text-[var(--text-muted)] mb-1.5">{stat.label}</p>
            <p className={`text-xl font-bold tracking-tight ${stat.mono ? "font-mono text-[var(--amber)]" : "text-[var(--text-primary)]"}`}>
              {stat.value}
            </p>
          </m.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client, référence..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)]">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table — desktop */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-1)]">

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt size={36} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Aucun devis trouvé</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Modifiez vos filtres ou créez un nouveau devis</p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_130px_120px_120px_100px_80px] gap-0 px-4 py-3 border-b border-[var(--border)]">
              {["Réf.", "Client", "Événement", "Date", "Total TTC", "Statut", "Actions"].map((h) => (
                <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div>
              {filtered.map((devis, i) => (
                <m.div
                  key={devis.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* Desktop row */}
                  <div
                    className="hidden md:grid grid-cols-[80px_1fr_130px_120px_120px_100px_80px] gap-0 px-4 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors group cursor-pointer"
                    onClick={() => setSelected(devis)}
                  >
                    <p className="text-xs font-mono font-medium text-[var(--amber)] self-center">{devis.id}</p>
                    <div className="self-center min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{devis.clientName}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{devis.clientPhone}</p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] self-center truncate">{devis.eventType}</p>
                    <div className="self-center flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Calendar size={12} className="shrink-0" />
                      <span className="truncate">{formatDate(devis.eventDate)}</span>
                    </div>
                    <p className="text-sm font-mono font-bold text-[var(--text-primary)] self-center">{formatCurrency(devis.totalTTC)}</p>
                    <div className="self-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[devis.status]}`}>
                        {devis.status}
                      </span>
                    </div>
                    <div className="self-center flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => generateDevisPDF(devis)} title="Générer PDF" className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-all">
                        <FilePdf size={14} weight="fill" />
                      </button>
                      <button onClick={() => setEditing(devis)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-all">
                        <PencilSimple size={14} />
                      </button>
                      <button onClick={() => handleDelete(devis)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div
                    className="md:hidden px-4 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                    onClick={() => setSelected(devis)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-medium text-[var(--amber)] shrink-0">{devis.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 ${STATUS_COLORS[devis.status]}`}>
                          {devis.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => generateDevisPDF(devis)} title="PDF" className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-all">
                          <FilePdf size={15} weight="fill" />
                        </button>
                        <button onClick={() => setEditing(devis)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-all">
                          <PencilSimple size={15} />
                        </button>
                        <button onClick={() => handleDelete(devis)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all">
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{devis.clientName}</p>
                    <p className="text-xs text-[var(--text-muted)] mb-2">{devis.clientPhone}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-[var(--text-secondary)] truncate">{devis.eventType}</span>
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] shrink-0">
                          <Calendar size={11} />
                          <span>{formatDate(devis.eventDate)}</span>
                        </div>
                      </div>
                      <p className="text-sm font-mono font-bold text-[var(--amber)] shrink-0">{formatCurrency(devis.totalTTC)}</p>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <DevisDetail
            devis={selected}
            onClose={() => setSelected(null)}
            onStatusChange={(status) => {
              updateDevisStatus(selected.id, status);
              setSelected({ ...selected, status });
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <DevisEditModal
            devis={editing}
            onClose={() => setEditing(null)}
            onSave={(updates) => {
              updateDevis(editing.id, updates);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {toDelete && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <m.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-sm bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6 text-center shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Warning size={24} weight="fill" className="text-[var(--danger)]" />
                </div>
                <h3 className="font-bold text-[var(--text-primary)] mb-1">Supprimer le devis ?</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  Le devis <span className="font-mono text-[var(--amber)]">{toDelete.id}</span> de {toDelete.clientName} sera définitivement supprimé.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setToDelete(null)}
                    className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 h-10 rounded-xl bg-[var(--danger)] hover:bg-red-500 text-white font-semibold text-sm transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
