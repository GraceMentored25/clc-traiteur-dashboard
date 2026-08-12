"use client";

import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, CheckCircle, WarningCircle, FileText } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { DevisItem, DevisStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Select } from "@/components/ui/SelectV2";
import { EVENT_TYPES } from "@/lib/data/event-types";

const EVENT_TYPE_OPTS = ["Mariage","Anniversaire","Baptême","Séminaire d'entreprise","Réception privée","Autre"].map(v => ({ value: v, label: v }));

const schema = z.object({
  clientName: z.string().min(2, "Nom requis (min 2 caractères)"),
  clientPhone: z.string().min(8, "Numéro de téléphone requis"),
  eventDate: z.string().min(1, "Date de l'événement requise"),
  eventType: z.string().min(1, "Type d'événement requis"),
  guestCount: z.string().min(1, "Nombre de convives requis"),
  lieu: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { onClose: () => void; }

export default function DevisModal({ onClose }: Props) {
  const router = useRouter();
  const cart = useStore((s) => s.cart);
  const cartTotal = useStore((s) => s.cartTotal);
  const clearCart = useStore((s) => s.clearCart);
  const addDevis = useStore((s) => s.addDevis);
  const clearAllSectionCarts = useStore((s) => s.clearAllSectionCarts);
  const sectionCarts = useStore((s) => s.sectionCarts);
  const activeEventType = useStore((s) => s.activeEventType);

  // Label du type d'événement sélectionné (ex: "mariage" → "Mariage")
  const prefilledEventType = useMemo(() => {
    const ev = EVENT_TYPES.find((e) => e.id === activeEventType);
    return ev?.label ?? "";
  }, [activeEventType]);

  const [success, setSuccess] = useState(false);

  // ── Construire les sections depuis sectionCarts ────────────────────────────
  const sections = useMemo(() => {
    const currentEvent = EVENT_TYPES.find((e) => e.id === activeEventType);
    if (!currentEvent) return [];

    return currentEvent.subMoments
      .map((sub) => {
        const items = sectionCarts[sub.id] ?? [];
        if (items.length === 0) return null;
        return {
          id: sub.id,
          label: sub.label,
          items,
          subtotal: items.reduce((s, c) => s + c.dish.price * c.quantity, 0),
        };
      })
      .filter(Boolean) as { id: string; label: string; items: typeof cart; subtotal: number }[];
  }, [sectionCarts, activeEventType]);

  // Mode sections si au moins une section est remplie, sinon mode panier simple
  const hasEventSections = sections.length > 0;

  const totalHT = hasEventSections
    ? sections.reduce((s, sec) => s + sec.subtotal, 0)
    : cartTotal();

  const totalItems = hasEventSections
    ? sections.reduce((n, sec) => n + sec.items.length, 0)
    : cart.length;

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventType: prefilledEventType },
  });

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 600));

    let items: DevisItem[];
    if (hasEventSections) {
      // Aplatir toutes les sections avec le label de section dans chaque item
      items = sections.flatMap((sec) =>
        sec.items.map((c) => ({
          dishId: c.dish.id,
          dishName: c.dish.name,
          quantity: c.quantity,
          unitPrice: c.dish.price,
          subtotal: c.dish.price * c.quantity,
          section: sec.label,
        }))
      );
    } else {
      items = cart.map((c) => ({
        dishId: c.dish.id,
        dishName: c.dish.name,
        quantity: c.quantity,
        unitPrice: c.dish.price,
        subtotal: c.dish.price * c.quantity,
      }));
    }

    addDevis({
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      eventDate: data.eventDate,
      eventType: data.eventType,
      guestCount: parseInt(data.guestCount, 10) || 1,
      lieu: data.lieu || undefined,
      status: "Brouillon" as DevisStatus,
      items,
      totalHT,
      totalTTC: totalHT * 1.2,
      notes: data.notes ?? "",
    });

    if (hasEventSections) {
      clearAllSectionCarts();
    } else {
      clearCart();
    }
    setSuccess(true);
  };

  const handleGoToDevis = () => { onClose(); router.push("/devis"); };

  return (
    <>
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50"
      />
      <m.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-lg bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <FileText size={18} weight="fill" className="text-[var(--amber)]" />
              <h2 className="font-bold text-[var(--text-primary)]">
                {success ? "Devis généré" : "Nouveau devis"}
              </h2>
              {hasEventSections && !success && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--amber)]/15 text-[var(--amber)]">
                  {sections.length} section{sections.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
              <X size={16} />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
              <m.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5"
              >
                <CheckCircle size={32} weight="fill" className="text-[var(--success)]" />
              </m.div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Devis créé avec succès</h3>
              <p className="text-sm text-[var(--text-muted)] mb-8 max-w-xs">
                Le devis a été enregistré en statut Brouillon. Vous pouvez le consulter et modifier son statut.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors">
                  Nouveau devis
                </button>
                <m.button whileTap={{ scale: 0.97 }} onClick={handleGoToDevis}
                  className="flex-1 h-10 rounded-xl bg-[var(--amber)] text-[var(--surface)] font-semibold text-sm hover:bg-[var(--amber-light)] transition-colors">
                  Voir les devis
                </m.button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">

                {/* ── Récap sections ou panier simple ── */}
                {hasEventSections ? (
                  <div className="rounded-xl border border-[var(--amber)]/20 overflow-hidden">
                    {sections.map((sec, i) => (
                      <div key={sec.id} className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                        {/* En-tête section */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--amber)]/6">
                          <span className="text-xs font-bold text-[var(--amber)] uppercase tracking-wide">{sec.label}</span>
                          <span className="text-xs font-mono font-semibold text-[var(--amber)]">{formatCurrency(sec.subtotal * 1.2)} TTC</span>
                        </div>
                        {/* Plats de la section */}
                        <div className="px-4 py-2 space-y-0.5 bg-[var(--surface-2)]">
                          {sec.items.map((c) => (
                            <div key={c.dish.id} className="flex justify-between text-xs text-[var(--text-secondary)] py-0.5">
                              <span className="truncate mr-2">{c.dish.name} × {c.quantity}</span>
                              <span className="font-mono shrink-0">{formatCurrency(c.dish.price * c.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Récap global */}
                    <div className="border-t border-[var(--amber)]/20 bg-[var(--amber)]/8 px-4 py-3 space-y-1">
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>{totalItems} plat{totalItems > 1 ? "s" : ""} · {sections.length} section{sections.length > 1 ? "s" : ""}</span>
                        <span className="font-mono">HT {formatCurrency(totalHT)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-[var(--amber)]">
                        <span>Total TTC</span>
                        <span className="font-mono">{formatCurrency(totalHT * 1.2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[var(--amber)]/8 border border-[var(--amber)]/20">
                    <p className="text-xs font-semibold text-[var(--amber)] mb-2">
                      {cart.length} plat{cart.length > 1 ? "s" : ""} sélectionné{cart.length > 1 ? "s" : ""}
                    </p>
                    {cart.slice(0, 3).map((c) => (
                      <div key={c.dish.id} className="flex justify-between text-xs text-[var(--text-secondary)] py-0.5">
                        <span>{c.dish.name} × {c.quantity}</span>
                        <span className="font-mono">{formatCurrency(c.dish.price * c.quantity)}</span>
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">+{cart.length - 3} autre{cart.length - 3 > 1 ? "s" : ""} plat{cart.length - 3 > 1 ? "s" : ""}</p>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[var(--amber)] pt-2 mt-1 border-t border-[var(--amber)]/20">
                      <span>Total TTC</span>
                      <span className="font-mono">{formatCurrency(totalHT * 1.2)}</span>
                    </div>
                  </div>
                )}

                {/* Infos client */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Nom du client</label>
                    <input {...register("clientName")} type="text" placeholder="Rosalie Ekindi"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors" />
                    {errors.clientName && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11} /> {errors.clientName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Téléphone</label>
                    <input {...register("clientPhone")} type="tel" placeholder="+33 6 xx xx xx xx"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors" />
                    {errors.clientPhone && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11} /> {errors.clientPhone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Date de l&apos;événement</label>
                    <input {...register("eventDate")} type="date"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors" />
                    {errors.eventDate && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11} /> {errors.eventDate.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Nb. convives</label>
                    <input {...register("guestCount")} type="number" min="1" placeholder="50"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors" />
                    {errors.guestCount && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11} /> {errors.guestCount.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Lieu (optionnel)</label>
                  <input {...register("lieu")} type="text" placeholder="Salle des fêtes, Rouen..."
                    className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Type d&apos;événement</label>
                  {prefilledEventType ? (
                    <div className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--amber)]/30 text-sm text-[var(--text-primary)] flex items-center justify-between">
                      <span>{prefilledEventType}</span>
                      <span className="text-[10px] text-[var(--amber)] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--amber)]/10">Auto</span>
                    </div>
                  ) : (
                    <>
                      <Controller name="eventType" control={control} render={({ field }) => (
                        <Select value={field.value} onChange={field.onChange} options={EVENT_TYPE_OPTS} placeholder="Sélectionner..." className="w-full" />
                      )} />
                      {errors.eventType && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11} /> {errors.eventType.message}</p>}
                    </>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Notes (optionnel)</label>
                  <textarea {...register("notes")} rows={2}
                    placeholder="Instructions de livraison, allergies, demandes spéciales..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors resize-none" />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <m.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.97 }}
                  className="flex-1 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] disabled:opacity-60 text-[var(--surface)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  {isSubmitting ? (
                    <><span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)]/30 border-t-[var(--surface)] animate-spin" />Génération...</>
                  ) : "Créer le devis"}
                </m.button>
              </div>
            </form>
          )}
        </div>
      </m.div>
    </>
  );
}
