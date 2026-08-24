"use client";

import { useState, useCallback, useMemo } from "react";
import { m } from "framer-motion";
import { X, Phone, Calendar, Users, FileText, Check, FilePdf, Trash, Plus, MapPin } from "@phosphor-icons/react";
import { Devis, DevisItem, DevisStatus } from "@/lib/types";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { downloadDevisPdf } from "@/lib/downloadDevisPdf";
import { Select } from "@/components/ui/SelectV2";
import { DISHES } from "@/lib/data/dishes";
import { ALL_KNOWN_CATEGORIES, SUBSECTION_MAP } from "@/lib/data/subsections";

interface Props {
  devis: Devis;
  onClose: () => void;
  onStatusChange: (status: DevisStatus) => void;
}

const STATUS_OPTIONS: DevisStatus[] = ["Brouillon", "Envoyé", "Confirmé", "Annulé"];

function getDishCategory(dishId: number): string {
  return DISHES.find(d => d.id === dishId)?.category ?? "";
}

export default function DevisDetail({ devis, onClose, onStatusChange }: Props) {
  const { updateDevis } = useStore();
  const [items, setItems] = useState<DevisItem[]>(devis.items.map(i => ({ ...i })));
  const [clientName, setClientName] = useState(devis.clientName);
  const [clientPhone, setClientPhone] = useState(devis.clientPhone);
  const [eventDate, setEventDate] = useState(devis.eventDate);
  const [guestCount, setGuestCount] = useState(devis.guestCount);
  const [eventType, setEventType] = useState(devis.eventType);
  const [lieu, setLieu] = useState(devis.lieu ?? "");
  const [notes, setNotes] = useState(devis.notes ?? "");
  const [saved, setSaved] = useState(false);
  const [addSelections, setAddSelections] = useState<Record<string, number>>({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const payload = { ...devis, items, totalHT, totalTTC, clientName, clientPhone, eventDate, eventType, guestCount, lieu: lieu || undefined };
      await downloadDevisPdf(payload);
    } catch (e) {
      alert(`Erreur : ${e}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPdfAlt = async () => {
    setDocxLoading(true);
    try {
      const SERVICE_RE = /serveur|marmite|service de table|tente|chapiteau|chaise|déco|décoration|transport|livraison|sono|animation|photographe/i;
      const altItems = items.map(i => ({
        ...i,
        quantity: SERVICE_RE.test(i.dishName) ? i.quantity : guestCount,
      }));
      const payload = { ...devis, items: altItems, totalHT, totalTTC, clientName, clientPhone, eventDate, eventType, guestCount, lieu: lieu || undefined };
      await downloadDevisPdf(payload);
    } catch (e) {
      alert(`Erreur : ${e}`);
    } finally {
      setDocxLoading(false);
    }
  };

  const totalHT  = Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * 100) / 100;
  const totalTTC = Math.round(totalHT * 1.2 * 100) / 100;

  const hasSections = useMemo(() => items.some(i => i.section), [items]);

  const sections = useMemo(() => {
    if (!hasSections) return null;
    const map = new Map<string, DevisItem[]>();
    for (const item of items) {
      const key = item.section ?? "Autres";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([label, sectionItems]) => ({
      label,
      items: sectionItems,
      subtotal: sectionItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    }));
  }, [items, hasSections]);

  // Clé composite (dishId + section) pour isoler chaque occurrence d'un plat
  const updateItem = useCallback((dishId: number, section: string | undefined, field: "quantity" | "unitPrice", raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) return;
    setItems(prev => prev.map(i => {
      if (i.dishId !== dishId || i.section !== section) return i;
      const updated = { ...i, [field]: field === "quantity" ? Math.round(val) : val };
      updated.subtotal = updated.quantity * updated.unitPrice;
      return updated;
    }));
  }, []);

  const removeItem = useCallback((dishId: number, section: string | undefined) => {
    setItems(prev => prev.filter(i => !(i.dishId === dishId && i.section === section)));
  }, []);

  const addDishToSection = useCallback((sectionLabel: string, dishId: number) => {
    const dish = DISHES.find(d => d.id === dishId);
    if (!dish) return;
    const exists = items.find(i => i.dishId === dishId && i.section === sectionLabel);
    if (exists) {
      setItems(prev => prev.map(i => {
        if (i.dishId !== dishId || i.section !== sectionLabel) return i;
        const updated = { ...i, quantity: i.quantity + 1 };
        updated.subtotal = updated.quantity * updated.unitPrice;
        return updated;
      }));
    } else {
      setItems(prev => [...prev, {
        dishId: dish.id,
        dishName: dish.name,
        quantity: 1,
        unitPrice: dish.price,
        subtotal: dish.price,
        section: sectionLabel,
      }]);
    }
    setAddSelections(prev => ({ ...prev, [sectionLabel]: 0 }));
  }, [items]);

  const handleSave = () => {
    const newHT  = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
    const newTTC = Math.round(newHT * 1.2 * 100) / 100;
    updateDevis(devis.id, {
      items, totalHT: newHT, totalTTC: newTTC,
      clientName, clientPhone, eventDate,
      guestCount: Number(guestCount) || devis.guestCount,
      eventType, lieu: lieu || undefined, notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const isDirty =
    JSON.stringify(items) !== JSON.stringify(devis.items) ||
    clientName !== devis.clientName ||
    clientPhone !== devis.clientPhone ||
    eventDate !== devis.eventDate ||
    Number(guestCount) !== devis.guestCount ||
    eventType !== devis.eventType ||
    (lieu || undefined) !== devis.lieu ||
    notes !== (devis.notes ?? "");

  const renderItem = (item: DevisItem) => (
    <div key={`${item.dishId}-${item.section ?? ""}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--surface-2)]">
      <button
        onClick={() => removeItem(item.dishId, item.section)}
        className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 transition-colors"
        title="Supprimer ce plat"
      >
        <Trash size={11} weight="bold" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.dishName}</p>
        <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
          {item.quantity} × {formatCurrency(item.unitPrice)} = <span className="text-[var(--amber)]">{formatCurrency(item.subtotal)}</span>
        </p>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Qté</label>
        <input
          type="number" min="0"
          value={item.quantity}
          onChange={(e) => updateItem(item.dishId, item.section, "quantity", e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-14 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)]/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Prix €</label>
        <input
          type="number" min="0" step="0.5"
          value={item.unitPrice}
          onChange={(e) => updateItem(item.dishId, item.section, "unitPrice", e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-16 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--text-muted)]/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );

  // Séparateur de sous-section
  const SubsectionDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 px-1 py-1">
      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );

  // Rendu des items d'une section avec sous-sections et sous-groupes
  const renderSectionBody = (sectionItems: DevisItem[], sectionLabel: string) => (
    <div className="space-y-2">
      {SUBSECTION_MAP.map(subsec => {
        const subsecItems = sectionItems.filter(i =>
          (subsec.categories as readonly string[]).includes(getDishCategory(i.dishId))
        );
        if (subsecItems.length === 0) return null;

        if ("subGroups" in subsec && subsec.subGroups) {
          return (
            <div key={subsec.label}>
              <SubsectionDivider label={subsec.label} />
              <div className="space-y-2 pl-1">
                {subsec.subGroups.map(sg => {
                  const sgItems = subsecItems.filter(i => (sg.categories as readonly string[]).includes(getDishCategory(i.dishId)));
                  if (sgItems.length === 0) return null;
                  return (
                    <div key={sg.label}>
                      <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1">{sg.label}</p>
                      <div className="space-y-1.5">{sgItems.map(renderItem)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={subsec.label}>
            <SubsectionDivider label={subsec.label} />
            <div className="space-y-1.5">{subsecItems.map(renderItem)}</div>
          </div>
        );
      })}

      {/* Items hors catalogue connu */}
      {(() => {
        const others = sectionItems.filter(i => !(ALL_KNOWN_CATEGORIES as readonly string[]).includes(getDishCategory(i.dishId)));
        if (others.length === 0) return null;
        return (
          <div>
            <SubsectionDivider label="Autres" />
            <div className="space-y-1.5">{others.map(renderItem)}</div>
          </div>
        );
      })()}

      {/* Ligne ajout plat dans la section */}
      <div className="flex items-center gap-2 pt-2">
        <select
          value={addSelections[sectionLabel] ?? 0}
          onChange={e => setAddSelections(prev => ({ ...prev, [sectionLabel]: parseInt(e.target.value) }))}
          className="flex-1 h-8 text-xs bg-[var(--surface-3)] border border-dashed border-[var(--amber)]/40 rounded-lg text-[var(--text-secondary)] px-2 outline-none focus:border-[var(--amber)]/60 transition-colors"
        >
          <option value={0} disabled>Ajouter un plat ou service…</option>
          {SUBSECTION_MAP.map(subsec =>
            "subGroups" in subsec && subsec.subGroups
              ? subsec.subGroups.map(sg => (
                  <optgroup key={`${subsec.label}-${sg.label}`} label={`${subsec.label} — ${sg.label}`}>
                    {DISHES.filter(d => (sg.categories as readonly string[]).includes(d.category)).map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {formatCurrency(d.price)}</option>
                    ))}
                  </optgroup>
                ))
              : (
                  <optgroup key={subsec.label} label={subsec.label}>
                    {DISHES.filter(d => (subsec.categories as readonly string[]).includes(d.category)).map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {formatCurrency(d.price)}</option>
                    ))}
                  </optgroup>
                )
          )}
        </select>
        <button
          onClick={() => { const id = addSelections[sectionLabel]; if (id) addDishToSection(sectionLabel, id); }}
          disabled={!addSelections[sectionLabel]}
          className="h-8 w-8 rounded-lg bg-[var(--amber)] text-[var(--surface)] flex items-center justify-center hover:bg-[var(--amber-light)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          title="Ajouter ce plat à la section"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <m.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-[var(--surface-1)] border-l border-[var(--border)] z-50 flex flex-col overflow-y-auto"
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
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              title="Télécharger PDF"
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)] text-xs font-semibold hover:bg-[var(--amber)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--amber)]/30 border-t-[var(--amber)] animate-spin" />
              ) : (
                <FilePdf size={14} weight="fill" />
              )}
              PDF
            </button>
            <button
              onClick={downloadPdfAlt}
              disabled={docxLoading}
              title="PDF avec nombre de convives uniformisé"
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {docxLoading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              ) : (
                <FilePdf size={14} weight="fill" />
              )}
              PDF Alt
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Client info — tous les champs éditables */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Informations client</p>
            <div className="space-y-2">
              {/* Nom */}
              <div className="space-y-0.5">
                <label className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Phone size={10} />Nom du client</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
              </div>
              {/* Téléphone */}
              <div className="space-y-0.5">
                <label className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Phone size={10} />Téléphone</label>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} type="tel"
                  className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
              </div>
              {/* Date + Convives */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10} />Date</label>
                  <input value={eventDate} onChange={e => setEventDate(e.target.value)} type="date"
                    className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Users size={10} />Convives</label>
                  <input value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} type="number" min="1"
                    className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
              {/* Type d'événement */}
              <div className="space-y-0.5">
                <label className="text-[10px] text-[var(--text-muted)]">Type d&apos;événement</label>
                <input value={eventType} onChange={e => setEventType(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
              </div>
              {/* Ville */}
              <div className="space-y-0.5">
                <label className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><MapPin size={10} />Ville du client</label>
                <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Paris, Lyon…"
                  className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors placeholder:text-[var(--text-muted)]" />
              </div>
              {/* Notes */}
              <div className="space-y-0.5">
                <label className="text-[10px] text-[var(--text-muted)]">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors resize-none" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Statut du devis</p>
            <Select
              value={devis.status}
              onChange={(v) => onStatusChange(v as DevisStatus)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s, labelClassName: STATUS_COLORS[s]?.split(" ")[0] }))}
              className="w-full"
            />
          </div>

          {/* Plats — par section avec sous-sections ou flat */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                {hasSections ? `Prestations · ${sections!.length} section${sections!.length > 1 ? "s" : ""}` : "Plats commandés"}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Qté · Prix unit.</p>
            </div>

            {hasSections ? (
              <div className="space-y-4">
                {(() => {
                  const SERVICE_RE = /serveur|marmite|service de table|tente|chapiteau|chaise|déco|décoration|transport|livraison|sono|animation|photographe/i;
                  const platSecs    = sections!.filter(sec => !SERVICE_RE.test(sec.label) && sec.label !== "__services__");
                  const serviceSecs = sections!.filter(sec =>  SERVICE_RE.test(sec.label) || sec.label === "__services__");
                  const serviceItems2 = serviceSecs.flatMap(s => s.items);
                  const serviceSubtotal = serviceItems2.reduce((s,i) => s + i.subtotal, 0);
                  return (
                    <>
                      {platSecs.map((sec) => (
                        <div key={sec.label}>
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-t-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20">
                            <span className="text-[10px] font-bold text-[var(--amber)] uppercase tracking-wider">{sec.label}</span>
                            <span className="text-[10px] font-mono font-semibold text-[var(--amber)]">{formatCurrency(sec.subtotal * 1.2)} TTC</span>
                          </div>
                          <div className="border border-t-0 border-[var(--amber)]/20 rounded-b-xl p-2">
                            {renderSectionBody(sec.items, sec.label)}
                          </div>
                        </div>
                      ))}
                      {serviceItems2.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-t-xl bg-purple-500/10 border border-purple-500/20">
                            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Prestations additionnelles</span>
                            <span className="text-[10px] font-mono font-semibold text-purple-500">{formatCurrency(serviceSubtotal * 1.2)} TTC</span>
                          </div>
                          <div className="border border-t-0 border-purple-500/20 rounded-b-xl p-2 space-y-1.5">
                            {serviceItems2.map(renderItem)}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (() => {
              const SERVICE_RE = /serveur|marmite|service de table|tente|chapiteau|chaise|déco|décoration|transport|livraison|sono|animation|photographe/i;
              const plats    = items.filter(i => !SERVICE_RE.test(i.dishName));
              const services = items.filter(i =>  SERVICE_RE.test(i.dishName));
              return (
                <div className="space-y-4">
                  {plats.length > 0 && (
                    <div className="space-y-1.5">{plats.map(renderItem)}</div>
                  )}
                  {services.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-t-xl bg-purple-500/10 border border-purple-500/20">
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Prestations additionnelles</span>
                        <span className="text-[10px] font-mono font-semibold text-purple-500">{formatCurrency(services.reduce((s,i)=>s+i.subtotal,0) * 1.2)} TTC</span>
                      </div>
                      <div className="border border-t-0 border-purple-500/20 rounded-b-xl p-2 space-y-1.5">
                        {services.map(renderItem)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Save button */}
            {(isDirty || saved) && (
              <m.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className={`mt-3 w-full h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  saved
                    ? "bg-green-500/15 text-[var(--success)] border border-green-500/30"
                    : "bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)]"
                }`}
              >
                {saved ? <><Check size={14} weight="bold" /> Modifications enregistrées</> : "Enregistrer les modifications"}
              </m.button>
            )}
          </div>

          {/* Totaux */}
          <div className="rounded-xl bg-[var(--amber)]/8 border border-[var(--amber)]/20 p-4 space-y-2">
            {hasSections && sections!.map((sec) => (
              <div key={sec.label} className="flex justify-between text-xs text-[var(--text-muted)]">
                <span className="truncate mr-2">{sec.label}</span>
                <span className="font-mono shrink-0">{formatCurrency(sec.subtotal)}</span>
              </div>
            ))}
            {hasSections && <div className="border-t border-[var(--amber)]/20 pt-2" />}
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

        </div>
      </m.aside>
    </>
  );
}
