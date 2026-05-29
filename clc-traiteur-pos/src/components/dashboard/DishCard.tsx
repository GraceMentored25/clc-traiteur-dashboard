"use client";

import { useState, memo, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCartSimple, PencilSimple, Check } from "@phosphor-icons/react";
import { Dish } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  dish: Dish;
}

const DishCard = memo(function DishCard({ dish }: Props) {
  const [quantity, setQuantity] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const priceRef = useRef<HTMLInputElement>(null);

  const { addToCart, updateQuantity, removeFromCart, cart, customPrices, setCustomPrice } = useStore();

  const effectivePrice = customPrices[dish.id] ?? dish.price;

  const cartItem = cart.find((c) => c.dish.id === dish.id);
  const inCart = !!cartItem;
  const displayQty = inCart ? cartItem!.quantity : quantity;

  const handlePriceBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPriceInput(String(effectivePrice));
    setEditingPrice(true);
    setTimeout(() => priceRef.current?.select(), 10);
  }, [effectivePrice]);

  const confirmPrice = useCallback(() => {
    const val = parseFloat(priceInput.replace(",", "."));
    if (!isNaN(val) && val > 0) {
      setCustomPrice(dish.id, val);
      // Si le plat est dans le panier, mettre à jour son prix
      if (inCart && cartItem) {
        updateQuantity(dish.id, cartItem.quantity);
      }
    }
    setEditingPrice(false);
  }, [priceInput, dish.id, setCustomPrice, inCart, cartItem, updateQuantity]);

  const handlePriceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmPrice();
    if (e.key === "Escape") setEditingPrice(false);
  }, [confirmPrice]);

  const handleInput = useCallback(
    (raw: string) => {
      const n = parseInt(raw, 10);
      if (isNaN(n) || n < 0) return;
      if (inCart) {
        if (n === 0) removeFromCart(dish.id);
        else updateQuantity(dish.id, n);
      } else {
        setQuantity(n);
      }
    },
    [inCart, dish.id, updateQuantity, removeFromCart]
  );

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

  const handleManualInput = useCallback(
    (raw: string) => {
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
    },
    [inCart, dish, effectivePrice, addToCart, updateQuantity, removeFromCart]
  );

  const total = displayQty * effectivePrice;
  const isPriceCustom = customPrices[dish.id] !== undefined && customPrices[dish.id] !== dish.price;

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-2xl overflow-hidden border transition-all duration-200 group flex flex-col",
        inCart
          ? "border-[var(--amber)]/40 bg-[var(--surface-2)] shadow-[0_0_0_1px_rgba(232,150,12,0.15),0_4px_20px_rgba(232,150,12,0.06)]"
          : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--surface-3)]"
      )}
    >
      {/* Image */}
      <div className="relative w-full h-32 overflow-hidden bg-[var(--surface-3)] shrink-0">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Price badge — cliquable pour éditer */}
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
                  type="number"
                  min="0"
                  step="0.5"
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
                <PencilSimple size={9} className="opacity-0 group-hover/price:opacity-100 transition-opacity" />
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
        <div>
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
            type="number"
            min="0"
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
            <span className="text-[11px] text-[var(--text-muted)]">
              Saisir une quantité
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default DishCard;
