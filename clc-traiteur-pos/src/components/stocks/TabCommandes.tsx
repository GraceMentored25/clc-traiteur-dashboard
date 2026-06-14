"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Play, Receipt, Calendar, Users, Check } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RECIPES, LOGISTIQUE_PAR_EVENEMENT, DEFAULT_INGREDIENTS } from "@/lib/data/stocks";

// Charge la config logistique depuis les Paramètres (localStorage) ou fallback statique
function getLogistiqueConfig(): Record<string, Array<{ name: string; qtyBase: number; unit: string; perConvive: boolean; pricePerUnit?: number; note?: string }>> {
  if (typeof window === "undefined") return LOGISTIQUE_PAR_EVENEMENT as never;
  try {
    const saved = localStorage.getItem("clc-logistique-config");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return LOGISTIQUE_PAR_EVENEMENT as never;
}
import { DemandeCoursesRepas, DemandeLogistique, ShoppingItem, LogistiqueItem } from "@/lib/types";

export default function TabCommandes() {
  const { devisList, addDemandeCoursesRepas, addDemandeLogistique, demandesCourses, demandesLogistique } = useStore();
  const [started, setStarted] = useState<Set<string>>(new Set());

  const confirmed = devisList.filter((d) => d.status === "Confirmé");

  const alreadyStarted = (devisId: string) =>
    demandesCourses.some((d) => d.devisId === devisId) ||
    demandesLogistique.some((d) => d.devisId === devisId);

  const handleCommencer = (devisId: string) => {
    const devis = devisList.find((d) => d.id === devisId);
    if (!devis) return;

    // ── Calcul des courses repas ──────────────────────────────
    const totaux: Record<string, { qty: number; ingredientId: string }> = {};

    devis.items.forEach((item) => {
      const recipe = RECIPES.find((r) => r.dishId === item.dishId);
      if (!recipe) return;
      recipe.ingredients.forEach((ri) => {
        if (!totaux[ri.ingredientId]) totaux[ri.ingredientId] = { qty: 0, ingredientId: ri.ingredientId };
        totaux[ri.ingredientId].qty += ri.qtyPerPerson * item.quantity;
      });
    });

    const ingredients = useStore.getState().ingredients;
    const shoppingItems: ShoppingItem[] = Object.values(totaux).map(({ ingredientId, qty }) => {
      const ing = ingredients.find((i) => i.id === ingredientId) ??
        DEFAULT_INGREDIENTS.find((i) => i.id === ingredientId);
      const qtyArrondie = Math.ceil(qty * 10) / 10;
      // Utiliser automatiquement le stock disponible
      const ingStock = ingredients.find((i) => i.id === ingredientId);
      const stockUtilise = Math.min(ingStock?.stockQty ?? 0, qtyArrondie);
      const qtyAcheter = Math.max(0, qtyArrondie - stockUtilise);
      return {
        ingredientId,
        ingredientName: ing?.name ?? ingredientId,
        unit: ing?.unit ?? "kg",
        qty: qtyArrondie,
        stockUtilise,
        pricePerUnit: ing?.pricePerUnit ?? 0,
        total: Math.round((qtyAcheter * (ing?.pricePerUnit ?? 0)) * 100) / 100,
      };
    });

    const totalEstime = shoppingItems.reduce((s, i) => s + i.total, 0);

    const demandeRepas: DemandeCoursesRepas = {
      id: `CR-${crypto.randomUUID()}`,
      devisId: devis.id,
      clientName: devis.clientName,
      eventDate: devis.eventDate,
      guestCount: devis.guestCount,
      createdAt: new Date().toISOString(),
      items: shoppingItems,
      totalEstime,
    };
    addDemandeCoursesRepas(demandeRepas);

    // ── Calcul logistique — utilise la config des Paramètres ──
    const logConfig = getLogistiqueConfig();
    const baseItems = logConfig["default"] ?? LOGISTIQUE_PAR_EVENEMENT["default"] ?? [];
    const eventItems = logConfig[devis.eventType] ?? LOGISTIQUE_PAR_EVENEMENT[devis.eventType] ?? [];
    const allLogItems = [...baseItems, ...eventItems];

    const materiaux = useStore.getState().materiel;

    const logItems: LogistiqueItem[] = allLogItems.map((item) => {
      const qty = item.unit === "par convive" ? devis.guestCount : item.qtyBase;
      const mat = materiaux.find((m) => m.name === item.name);
      // Utiliser automatiquement le stock disponible (sans dépasser la quantité demandée)
      const stockUtilise = Math.min(mat?.stockQty ?? 0, qty);
      return {
        name: item.name,
        qty,
        stockUtilise,
        unit: item.unit === "par convive" ? "unité" : item.unit,
        note: item.note,
      };
    });

    const totalEstimeLog = logItems.reduce((sum, item, idx) => {
      const mat = materiaux.find((m) => m.name === item.name);
      // Prix : store matériel > config logistique > 0
      const configItem = allLogItems[idx];
      const price = mat?.pricePerUnit ?? (configItem as { pricePerUnit?: number }).pricePerUnit ?? 0;
      const qtyAcheter = Math.max(0, item.qty - (item.stockUtilise ?? 0));
      return sum + price * qtyAcheter;
    }, 0);

    const demandeLog: DemandeLogistique = {
      id: `LOG-${crypto.randomUUID()}`,
      devisId: devis.id,
      clientName: devis.clientName,
      eventType: devis.eventType,
      eventDate: devis.eventDate,
      createdAt: new Date().toISOString(),
      items: logItems,
      totalEstime: totalEstimeLog,
    };
    addDemandeLogistique(demandeLog);

    setStarted((prev) => new Set([...prev, devisId]));
  };

  if (confirmed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Receipt size={36} className="text-[var(--text-muted)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Aucun devis confirmé</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Les devis confirmés apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)] mb-4">
        {confirmed.length} devis confirmé{confirmed.length > 1 ? "s" : ""} — appuyez sur « Commencer » pour générer les listes de courses et de logistique
      </p>
      {confirmed.map((devis) => {
        const done = alreadyStarted(devis.id) || started.has(devis.id);
        return (
          <m.div
            key={devis.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-[var(--amber)]">{devis.id}</span>
                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs text-[var(--text-secondary)]">{devis.eventType}</span>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{devis.clientName}</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Calendar size={11} />{formatDate(devis.eventDate)}
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Users size={11} />{devis.guestCount} convives
                </div>
                <span className="text-xs font-mono text-[var(--amber)]">{formatCurrency(devis.totalTTC)}</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {done ? (
                <m.div
                  key="done"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-[var(--success)] text-sm font-semibold shrink-0"
                >
                  <Check size={14} weight="bold" />
                  <span className="hidden sm:inline">Généré</span>
                </m.div>
              ) : (
                <m.button
                  key="start"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCommencer(devis.id)}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-sm font-semibold shrink-0 transition-all"
                >
                  <Play size={13} weight="fill" />
                  Commencer
                </m.button>
              )}
            </AnimatePresence>
          </m.div>
        );
      })}
    </div>
  );
}
