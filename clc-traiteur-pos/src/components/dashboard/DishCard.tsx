"use client";

import { useState, memo, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingCartSimple } from "@phosphor-icons/react";
import { Dish } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  dish: Dish;
}

const DishCard = memo(function DishCard({ dish }: Props) {
  const [quantity, setQuantity] = useState(0);
  const { addToCart, updateQuantity, removeFromCart, cart } = useStore();

  const cartItem = cart.find((c) => c.dish.id === dish.id);
  const inCart = !!cartItem;
  const displayQty = inCart ? cartItem!.quantity : quantity;

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
      // Auto-add to cart on first increment
      addToCart({ dish, quantity: next });
    }
  }, [inCart, quantity, dish, cartItem, addToCart, updateQuantity]);

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
      else addToCart({ dish, quantity: n });
    },
    [inCart, dish, addToCart, updateQuantity, removeFromCart]
  );

  const total = displayQty * dish.price;

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

        {/* Price badge on image */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
          <span className="text-xs font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg">
            {formatCurrency(dish.price)}
            <span className="text-white/60 font-normal text-[10px]"> / {dish.unit}</span>
          </span>
        </div>

        {/* In-cart dot */}
        {inCart && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--amber)] shadow-[0_0_6px_rgba(232,150,12,0.8)]" />
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        {/* Name + description */}
        <div>
          <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight truncate">
            {dish.name}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
            {dish.description}
          </p>
        </div>

        {/* Quantity controls — always visible */}
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

          {/* Editable quantity input */}
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
                <span>{displayQty} × {formatCurrency(dish.price)}</span>
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
