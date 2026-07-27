"use client";

import { memo, useCallback } from "react";
import { m } from "framer-motion";
import { X, Trash, Plus, Minus, ShoppingCart } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/data/event-types";

interface Props {
  onClose: () => void;
  onGenerateDevis: () => void;
}

export default function CartPanel({ onClose, onGenerateDevis }: Props) {
  const cart = useStore((s) => s.cart);
  const cartTotal = useStore((s) => s.cartTotal);
  const clearCart = useStore((s) => s.clearCart);
  const sectionCarts = useStore((s) => s.sectionCarts);
  const activeEventType = useStore((s) => s.activeEventType);
  const activeSubMoment = useStore((s) => s.activeSubMoment);
  const total = cartTotal();
  const currentEvent = EVENT_TYPES.find((event) => event.id === activeEventType);
  const currentEventSectionIds = new Set(currentEvent?.subMoments.map((subMoment) => subMoment.id) ?? []);
  const sectionEntries = Object.entries(sectionCarts).filter(
    ([sectionId, items]) => items.length > 0 && currentEventSectionIds.has(sectionId),
  );
  const hasSections = sectionEntries.length > 0 && !!activeEventType;
  const sectionsTotal = sectionEntries.reduce(
    (sum, [, items]) => sum + items.reduce((subtotal, item) => subtotal + item.dish.price * item.quantity, 0),
    0,
  );
  const sectionsItemCount = sectionEntries.reduce(
    (sum, [, items]) => sum + items.reduce((subtotal, item) => subtotal + item.quantity, 0),
    0,
  );
  const itemCount = hasSections ? sectionsItemCount : cart.reduce((n, c) => n + c.quantity, 0);
  const activeSectionLabel = currentEvent?.subMoments.find((subMoment) => subMoment.id === activeSubMoment)?.label;

  return (
    <>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <m.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
        className="fixed right-0 top-0 h-full w-[380px] max-w-[92vw] bg-[var(--surface-1)] border-l border-[var(--border)] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={18} weight="fill" className="text-[var(--amber)]" />
            <h2 className="font-bold text-[var(--text-primary)]">Récapitulatif</h2>
            {itemCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--amber)]/15 text-[var(--amber)] text-xs font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(cart.length > 0 || (!activeSubMoment && hasSections)) && (
              <button
                onClick={clearCart}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors px-2 py-1 rounded-lg hover:bg-red-500/8"
              >
                Vider
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {cart.length === 0 && !hasSections ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ShoppingCart size={36} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">Panier vide</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Cliquez sur un plat pour l&apos;ajouter</p>
            </div>
          ) : (
            <>
              {hasSections && (
                <div className="space-y-2">
                  {sectionEntries.map(([sectionId, items]) => {
                    if (sectionId === activeSubMoment && cart.length > 0) return null;
                    const subtotal = items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
                    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
                    const sectionLabel = currentEvent?.subMoments.find((subMoment) => subMoment.id === sectionId)?.label ?? sectionId;
                    return (
                      <div key={sectionId} className="rounded-xl border border-[var(--amber)]/20 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--amber)]/7">
                          <span className="text-xs font-bold text-[var(--amber)] uppercase tracking-wide">{sectionLabel}</span>
                          <span className="text-xs font-mono font-semibold text-[var(--amber)]">
                            {quantity} convive{quantity > 1 ? "s" : ""} · {formatCurrency(subtotal)}
                          </span>
                        </div>
                        <div className="px-3 py-2 space-y-1 bg-[var(--surface-2)]">
                          {items.map((item) => (
                            <div key={`${sectionId}-${item.dish.id}`} className="flex items-center justify-between gap-3 text-xs">
                              <span className="min-w-0 truncate text-[var(--text-secondary)]">{item.dish.name}</span>
                              <span className="shrink-0 font-mono text-[var(--text-primary)]">{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasSections && cart.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      Section active
                    </p>
                    {activeSectionLabel && (
                      <span className="text-xs font-semibold text-[var(--amber)]">{activeSectionLabel}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cart.map((item) => <CartItemRow key={item.dish.id} item={item} />)}
                  </div>
                </div>
              )}

              {!hasSections && cart.map((item) => <CartItemRow key={item.dish.id} item={item} />)}
            </>
          )}
        </div>

        {/* Footer */}
        {(cart.length > 0 || hasSections) && (
          <div className="px-4 py-5 border-t border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>Sous-total HT</span>
              <span className="font-mono">{formatCurrency(hasSections ? sectionsTotal : total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>TVA (20%)</span>
              <span className="font-mono">{formatCurrency((hasSections ? sectionsTotal : total) * 0.2)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
              <span>Total TTC</span>
              <span className="text-lg text-[var(--amber)] font-mono">{formatCurrency((hasSections ? sectionsTotal : total) * 1.2)}</span>
            </div>
            {hasSections && (
              <p className="text-xs text-[var(--text-muted)]">
                {sectionEntries.length} section{sectionEntries.length > 1 ? "s" : ""} · {sectionsItemCount} convive{sectionsItemCount > 1 ? "s" : ""}
              </p>
            )}
            <m.button
              whileTap={{ scale: 0.97 }}
              onClick={onGenerateDevis}
              className="w-full h-11 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-bold text-sm transition-colors"
            >
              Générer un devis
            </m.button>
          </div>
        )}
      </m.aside>
    </>
  );
}

// Chaque ligne du cart se re-rend uniquement si son item change
const CartItemRow = memo(function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);

  const dec = useCallback(() => updateQuantity(item.dish.id, item.quantity - 1), [item.dish.id, item.quantity, updateQuantity]);
  const inc = useCallback(() => updateQuantity(item.dish.id, item.quantity + 1), [item.dish.id, item.quantity, updateQuantity]);
  const remove = useCallback(() => removeFromCart(item.dish.id), [item.dish.id, removeFromCart]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.dish.name}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatCurrency(item.dish.price)} / {item.dish.unit}</p>
      </div>
      <div className="flex items-center gap-1.5 bg-[var(--surface-3)] rounded-lg p-0.5">
        <button onClick={dec} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-90">
          <Minus size={11} weight="bold" />
        </button>
        <span className="w-7 text-center font-mono text-sm font-bold text-[var(--text-primary)]">{item.quantity}</span>
        <button onClick={inc} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors active:scale-90">
          <Plus size={11} weight="bold" />
        </button>
      </div>
      <span className="text-sm font-bold text-[var(--amber)] w-16 text-right shrink-0 font-mono">
        {formatCurrency(item.dish.price * item.quantity)}
      </span>
      <button onClick={remove} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors shrink-0">
        <Trash size={14} />
      </button>
    </div>
  );
});
