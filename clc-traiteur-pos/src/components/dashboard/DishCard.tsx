"use client";

import { useState, memo, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCartSimple, Check, X, Trash } from "@phosphor-icons/react";
import { Dish } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  dish: Dish;
}

const UNITS = ["portion", "pièce", "assiette", "verre", "100g", "litre", "demi-poulet"];

const DishCard = memo(function DishCard({ dish }: Props) {
  const [quantity, setQuantity] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ price: "", unit: dish.unit });
  const priceRef = useRef<HTMLInputElement>(null);

  const { addToCart, updateQuantity, removeFromCart, cart, customPrices, setCustomPrice, customDishes, removeCustomDish } = useStore();

  const effectivePrice = customPrices[dish.id] ?? dish.price;
  const effectiveUnit = editForm.unit; // on affiche l'unité éditée localement mais c'est dans le store qu'on persiste

  const cartItem = cart.find((c) => c.dish.id === dish.id);
  const inCart = !!cartItem;
  const displayQty = inCart ? cartItem!.quantity : quantity;
  const isCustomDish = customDishes.some((d) => d.id === dish.id);

  const openEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditForm({ price: String(effectivePrice), unit: dish.unit });
    setEditOpen(true);
  }, [effectivePrice, dish.unit]);

  const confirmEdit = useCallback(() => {
    const val = parseFloat(editForm.price.replace(",", "."));
    if (!isNaN(val) && val > 0) setCustomPrice(dish.id, val);
    setEditOpen(false);
  }, [editForm, dish.id, setCustomPrice]);

  const handleDelete = useCallback(() => {
    if (inCart) removeFromCart(dish.id);
    removeCustomDish(dish.id);
    setEditOpen(false);
  }, [dish.id, inCart, removeFromCart, removeCustomDish]);

  // Prix badge inline
  const handlePriceBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPriceInput(String(effectivePrice));
    setEditingPrice(true);
    setTimeout(() => priceRef.current?.select(), 10);
  }, [effectivePrice]);

  const confirmPrice = useCallback(() => {
    const val = parseFloat(priceInput.replace(",", "."));
    if (!isNaN(val) && val > 0) setCustomPrice(dish.id, val);
    setEditingPrice(false);
  }, [priceInput, dish.id, setCustomPrice]);

  const handlePriceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmPrice();
    if (e.key === "Escape") setEditingPrice(false);
  }, [confirmPrice]);

  const increment = useCallback(() => {
    if (inCart) {
      updateQuantity(dish.id, cartItem!.quantity + 1);
    } else {
      const next = quantity + 1;
      setQuantity(next);
      addToCart({ dish: { ...dish, price: effectivePrice }, quantity: next });
    }
  }, [inCart, quantity, dish, cartItem, effectivePrice, addToCart, updateQuantity]);

  const decrement = useCallback(() => {
    if (inCart) {
      if (cartItem!.quantity === 1) removeFromCart(dish.id);
      else updateQuantity(dish.id, cartItem!.quantity - 1);
    } else {
      setQuantity((q) => Math.max(0, q - 1));
    }
  }, [inCart, dish.id, cartItem, removeFromCart, updateQuantity]);

  const handleManualInput = useCallback((raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 0) return;
    if (n === 0) {
      if (inCart) removeFromCart(dish.id);
      setQuantity(0);
      return;
    }
    setQuantity(n);
    if (inCart) updateQuantity(dish.id, n);
    else addToCart({ dish: { ...dish, price: effectivePrice }, quantity: n });
  }, [inCart, dish, effectivePrice, addToCart, updateQuantity, removeFromCart]);

  const total = displayQty * effectivePrice;
  const isPriceCustom = customPrices[dish.id] !== undefined && customPrices[dish.id] !== dish.price;

  return (
    <>
      <motion.div
        layout
        className={cn(
          "relative rounded-2xl overflow-hidden border transition-all duration-200 group flex flex-col",
          inCart
            ? "border-[var(--amber)]/40 bg-[var(--surface-2)] shadow-[0_0_0_1px_rgba(232,150,12,0.15),0_4px_20px_rgba(232,150,12,0.06)]"
            : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--surface-3)]"
        )}
      >
        {/* Image — clic pour éditer */}
        <div
          className="relative w-full h-32 overflow-hidden bg-[var(--surface-3)] shrink-0 cursor-pointer"
          onClick={openEdit}
        >
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Price badge — cliquable */}
          <div className="absolute bottom-2 left-2.5">
            <AnimatePresence mode="wait">
              {editingPrice ? (
                <motion.div
                  key="editing"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center gap-1 bg-[var(--surface-1)] rounded-lg px-1.5 py-0.5 border border-[var(--amber)]/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={priceRef}
                    type="number" min="0" step="0.5"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    onBlur={confirmPrice}
                    className="w-14 text-xs font-bold text-[var(--text-primary)] bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">€</span>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); confirmPrice(); }}
                    className="w-4 h-4 rounded flex items-center justify-center bg-[var(--amber)] text-white"
                  >
                    <Check size={9} weight="bold" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="display"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={handlePriceBadgeClick}
                  title="Cliquer pour modifier le prix"
                  className={cn(
                    "flex items-center gap-1 text-xs font-bold text-white backdrop-blur-sm px-2 py-0.5 rounded-lg transition-all group/price",
                    isPriceCustom
                      ? "bg-[var(--amber)]/80 hover:bg-[var(--amber)]"
                      : "bg-black/50 hover:bg-black/70"
                  )}
                >
                  {formatCurrency(effectivePrice)}
                  <span className="text-white/60 font-normal text-[10px]"> / {dish.unit}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* In-cart dot */}
          {inCart && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--amber)] shadow-[0_0_6px_rgba(232,150,12,0.8)]" />
          )}

        </div>

        {/* Body */}
        <div className="p-3 flex flex-col gap-2.5 flex-1">
          <div className="cursor-pointer" onClick={openEdit}>
            <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight truncate">
              {dish.name}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
              {dish.description}
            </p>
          </div>

          {/* Quantity controls */}
          <div className="grid grid-cols-[28px_1fr_28px] items-center gap-1.5">
            <button
              onClick={decrement}
              disabled={displayQty === 0}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95",
                displayQty > 0
                  ? "bg-[var(--amber)]/15 text-[var(--amber)] hover:bg-[var(--amber)]/25"
                  : "bg-[var(--surface-3)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
              )}
            >
              <Minus size={11} weight="bold" />
            </button>
            <input
              type="number" min="0"
              value={displayQty === 0 ? "" : displayQty}
              placeholder="0"
              onChange={(e) => handleManualInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={increment}
              className="w-7 h-7 rounded-lg bg-[var(--amber)] hover:bg-[var(--amber-light)] flex items-center justify-center text-[var(--surface)] transition-all active:scale-95"
            >
              <Plus size={11} weight="bold" />
            </button>
          </div>

          {/* Total line */}
          <div className="flex items-center justify-between">
            {displayQty > 0 ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <ShoppingCartSimple size={12} className="text-[var(--amber)]" />
                  <span>{displayQty} × {formatCurrency(effectivePrice)}</span>
                </div>
                <span className="text-sm font-bold font-mono text-[var(--amber)]">
                  {formatCurrency(total)}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-[var(--text-muted)]">Saisir une quantité</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Modale édition plat ──────────────────────────────── */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-xs bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[var(--text-primary)] text-sm">{dish.name}</h3>
                  <button onClick={() => setEditOpen(false)} className="w-7 h-7 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Prix (€)</label>
                    <input
                      type="number" min="0" step="0.5"
                      value={editForm.price}
                      onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Unité</label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm(f => ({ ...f, unit: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  {isCustomDish && (
                    <button
                      onClick={handleDelete}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-[var(--danger)] hover:bg-red-500/20 transition-all shrink-0"
                      title="Supprimer ce plat"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                  <button onClick={() => setEditOpen(false)} className="flex-1 h-9 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 h-9 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default DishCard;
