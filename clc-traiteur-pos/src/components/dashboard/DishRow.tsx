"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import { Minus, Plus } from "@phosphor-icons/react";
import { Dish } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";

const DishRow = memo(function DishRow({ dish }: { dish: Dish }) {
  const [quantity, setQuantity] = useState(0);
  const { addToCart, updateQuantity, removeFromCart, cart, customPrices } = useStore();

  const cartItem = cart.find((c) => c.dish.id === dish.id);
  const inCart = !!cartItem;
  const displayQty = inCart ? cartItem!.quantity : quantity;
  const effectivePrice = customPrices[dish.id] ?? dish.price;

  const increment = useCallback(() => {
    if (inCart) updateQuantity(dish.id, cartItem!.quantity + 1);
    else { const next = quantity + 1; setQuantity(next); addToCart({ dish: { ...dish, price: effectivePrice }, quantity: next }); }
  }, [inCart, quantity, dish, cartItem, effectivePrice, addToCart, updateQuantity]);

  const decrement = useCallback(() => {
    if (inCart) {
      if (cartItem!.quantity === 1) removeFromCart(dish.id);
      else updateQuantity(dish.id, cartItem!.quantity - 1);
    } else setQuantity((q) => Math.max(0, q - 1));
  }, [inCart, dish.id, cartItem, removeFromCart, updateQuantity]);

  const handleInput = useCallback((raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 0) return;
    if (n === 0) { if (inCart) removeFromCart(dish.id); setQuantity(0); return; }
    setQuantity(n);
    if (inCart) updateQuantity(dish.id, n);
    else addToCart({ dish: { ...dish, price: effectivePrice }, quantity: n });
  }, [inCart, dish, effectivePrice, addToCart, updateQuantity, removeFromCart]);

  return (
    <div className={cn(
      "px-4 py-2.5 rounded-xl transition-all border",
      inCart ? "bg-[var(--amber)]/5 border-[var(--amber)]/20" : "hover:bg-[var(--surface-2)] border-transparent"
    )}>

      {/* ── Desktop ─────────────────────────────────────────────── */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_120px_140px] gap-4 items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-3)] shrink-0">
            <Image src={dish.image} alt={dish.name} width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{dish.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{dish.description}</p>
          </div>
        </div>
        <p className="text-xs text-[var(--text-secondary)] truncate">{dish.category}</p>
        <div>
          <span className="text-sm font-bold font-mono text-[var(--amber)]">{formatCurrency(effectivePrice)}</span>
          <span className="text-[10px] text-[var(--text-muted)] ml-1">/{dish.unit}</span>
        </div>
        <div className="grid grid-cols-[26px_1fr_26px] items-center gap-1">
          <button onClick={decrement} disabled={displayQty === 0}
            className={cn("w-[26px] h-7 rounded-lg flex items-center justify-center transition-all active:scale-95",
              displayQty > 0 ? "bg-[var(--amber)]/15 text-[var(--amber)]" : "bg-[var(--surface-3)] text-[var(--text-muted)] opacity-40 cursor-not-allowed")}>
            <Minus size={10} weight="bold" />
          </button>
          <input type="number" min="0" value={displayQty === 0 ? "" : displayQty} placeholder="0"
            onChange={(e) => handleInput(e.target.value)} onFocus={(e) => e.target.select()}
            className="w-full h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button onClick={increment}
            className="w-[26px] h-7 rounded-lg bg-[var(--amber)] flex items-center justify-center text-[var(--surface)] transition-all active:scale-95">
            <Plus size={10} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── Mobile ──────────────────────────────────────────────── */}
      <div className="flex md:hidden items-center gap-3">
        {/* Miniature */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-3)] shrink-0">
          <Image src={dish.image} alt={dish.name} width={40} height={40} className="w-full h-full object-cover" />
        </div>

        {/* Nom + prix */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{dish.name}</p>
          <p className="text-xs text-[var(--amber)] font-mono font-bold">
            {formatCurrency(effectivePrice)}<span className="text-[var(--text-muted)] font-normal text-[10px]"> /{dish.unit}</span>
          </p>
        </div>

        {/* Contrôles compacts */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={decrement} disabled={displayQty === 0}
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95",
              displayQty > 0 ? "bg-[var(--amber)]/15 text-[var(--amber)]" : "bg-[var(--surface-3)] text-[var(--text-muted)] opacity-40 cursor-not-allowed")}>
            <Minus size={11} weight="bold" />
          </button>
          <input type="number" min="0" value={displayQty === 0 ? "" : displayQty} placeholder="0"
            onChange={(e) => handleInput(e.target.value)} onFocus={(e) => e.target.select()}
            className="w-12 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button onClick={increment}
            className="w-7 h-7 rounded-lg bg-[var(--amber)] flex items-center justify-center text-[var(--surface)] transition-all active:scale-95">
            <Plus size={11} weight="bold" />
          </button>
        </div>
      </div>

    </div>
  );
});

export default DishRow;
