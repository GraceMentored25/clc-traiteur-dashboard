"use client";

import { m } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, PencilSimple, WarningCircle } from "@phosphor-icons/react";
import { Devis, DevisStatus } from "@/lib/types";
import { Select } from "@/components/ui/Select";

const EVENT_TYPES = ["Mariage","Anniversaire","Baptême","Séminaire d'entreprise","Réception privée","Autre"].map(v => ({ value: v, label: v }));
const STATUS_OPTS = ["Brouillon","Envoyé","Confirmé","Annulé"].map(v => ({ value: v, label: v }));

const schema = z.object({
  clientName: z.string().min(2, "Requis"),
  clientPhone: z.string().min(8, "Requis"),
  eventDate: z.string().min(1, "Requis"),
  eventType: z.string().min(1, "Requis"),
  guestCount: z.string().min(1, "Requis"),
  status: z.enum(["Brouillon", "Envoyé", "Confirmé", "Annulé"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  devis: Devis;
  onClose: () => void;
  onSave: (updates: Partial<Devis>) => void;
}

export default function DevisEditModal({ devis, onClose, onSave }: Props) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: devis.clientName,
      clientPhone: devis.clientPhone,
      eventDate: devis.eventDate,
      eventType: devis.eventType,
      guestCount: String(devis.guestCount),
      status: devis.status,
      notes: devis.notes,
    },
  });

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 300));
    onSave({
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      eventDate: data.eventDate,
      eventType: data.eventType,
      guestCount: parseInt(data.guestCount, 10) || devis.guestCount,
      status: data.status as DevisStatus,
      notes: data.notes ?? "",
    });
  };

  return (
    <>
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
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
        <div className="w-full max-w-lg bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <PencilSimple size={17} weight="fill" className="text-[var(--amber)]" />
              <h2 className="font-bold text-[var(--text-primary)]">Modifier — {devis.id}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Nom du client</label>
                  <input {...register("clientName")} className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                  {errors.clientName && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11}/>{errors.clientName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Téléphone</label>
                  <input {...register("clientPhone")} className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                  {errors.clientPhone && <p className="text-[11px] text-[var(--danger)] flex items-center gap-1"><WarningCircle size={11}/>{errors.clientPhone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Date événement</label>
                  <input {...register("eventDate")} type="date" className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Nb. convives</label>
                  <input {...register("guestCount")} type="number" min="1" className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Type d&apos;événement</label>
                  <Controller name="eventType" control={control} render={({ field }) => (
                    <Select value={field.value} onChange={field.onChange} options={EVENT_TYPES} placeholder="Sélectionner..." className="w-full" />
                  )} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Statut</label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select value={field.value} onChange={field.onChange} options={STATUS_OPTS} className="w-full" />
                  )} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
                <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                Annuler
              </button>
              <m.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.97 }}
                className="flex-1 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] disabled:opacity-60 text-[var(--surface)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)]/30 border-t-[var(--surface)] animate-spin" /> : "Enregistrer"}
              </m.button>
            </div>
          </form>
        </div>
      </m.div>
    </>
  );
}
