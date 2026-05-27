"use client";

import { motion } from "framer-motion";
import { X, Trash, Plus, Minus, ShoppingCart } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onGenerateDevis: () => void;
}

export default function CartPanel({ onClose, onGenerateDevis }: Props) {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useStore();

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      {/* Panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-[380px] bg-[var(--surface-1)] border-l border-[var(--border)] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={18} weight="fill" className="text-[var(--amber)]" />
            <h2 className="font-bold text-[var(--text-primary)]">Récapitulatif</h2>
            {cart.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--amber)]/15 text-[var(--amber)] text-xs font-bold">
                {cart.reduce((n, c) => n + c.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
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
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ShoppingCart size={36} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">Panier vide</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Cliquez sur un plat pour l&apos;ajouter
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.dish.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {item.dish.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {formatCurrency(item.dish.price)} / {item.dish.unit}
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1.5 bg-[var(--surface-3)] rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Minus size={11} weight="bold" />
                  </button>
                  <span className="w-7 text-center font-mono text-sm font-bold text-[var(--text-primary)]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors"
                  >
                    <Plus size={11} weight="bold" />
                  </button>
                </div>

                <span className="text-sm font-bold text-[var(--amber)] w-16 text-right shrink-0 font-mono">
                  {formatCurrency(item.dish.price * item.quantity)}
                </span>

                <button
                  onClick={() => removeFromCart(item.dish.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-4 py-5 border-t border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>Sous-total HT</span>
              <span className="font-mono">{formatCurrency(cartTotal())}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>TVA (20%)</span>
              <span className="font-mono">{formatCurrency(cartTotal() * 0.2)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
              <span>Total TTC</span>
              <span className="text-lg text-[var(--amber)] font-mono">
                {formatCurrency(cartTotal() * 1.2)}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onGenerateDevis}
              className="w-full h-11 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-bold text-sm transition-colors"
            >
              Générer un devis
            </motion.button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
