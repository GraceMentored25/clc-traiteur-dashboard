"use client";

import { useState, memo, useCallback, useRef } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCartSimple, Check, X, Trash, PencilSimple, Camera } from "@phosphor-icons/react";
import { Dish } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";

interface Props {
  dish: Dish;
}

const UNITS = ["portion", "pièce", "assiette", "verre", "100g", "litre", "demi-poulet"];

const DishCard = memo(function DishCard({ dish }: Props) {
  const [quantity, setQuantity] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ price: "", unit: dish.unit, name: dish.name, image: dish.image });
  const [editingName, setEditingName] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sélecteurs granulaires — chaque carte ne re-rende que si SES données changent
  const cartItem = useStore(useCallback((s) => s.cart.find((c) => c.dish.id === dish.id), [dish.id]));
  const effectivePrice = useStore(useCallback((s) => s.customPrices[dish.id] ?? dish.price, [dish.id, dish.price]));
  const isCustomDish = useStore(useCallback((s) => s.customDishes.some((d) => d.id === dish.id), [dish.id]));
  const addToCart = useStore((s) => s.addToCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const setCustomPrice = useStore((s) => s.setCustomPrice);
  const removeCustomDish = useStore((s) => s.removeCustomDish);
  const updateCustomDish = useStore((s) => s.updateCustomDish);

  const inCart = !!cartItem;
  const displayQty = inCart ? cartItem!.quantity : quantity;
  const isPriceCustom = useStore(useCallback((s) => {
    const cp = s.customPrices[dish.id];
    return cp !== undefined && cp !== dish.price;
  }, [dish.id, dish.price]));

  const openEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditForm({ price: String(effectivePrice), unit: dish.unit, name: dish.name, image: dish.image });
    setEditingName(false);
    setEditOpen(true);
  }, [effectivePrice, dish.unit, dish.name, dish.image]);

  const confirmEdit = useCallback(() => {
    const val = parseFloat(editForm.price.replace(",", "."));
    if (!isNaN(val) && val > 0) setCustomPrice(dish.id, val);
    if (isCustomDish) {
      const patch: Partial<Omit<Dish, "id">> = { unit: editForm.unit };
      if (editForm.name.trim()) patch.name = editForm.name.trim();
      if (editForm.image) patch.image = editForm.image;
      updateCustomDish(dish.id, patch);
    }
    setEditOpen(false);
  }, [editForm, dish.id, setCustomPrice, isCustomDish, updateCustomDish]);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setEditForm((f) => ({ ...f, image: result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDelete = useCallback(() => {
    if (inCart) removeFromCart(dish.id);
    removeCustomDish(dish.id);
    setEditOpen(false);
  }, [dish.id, inCart, removeFromCart, removeCustomDish]);

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

  return (
    <>
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden border transition-colors duration-150 group flex flex-col",
          inCart
            ? "border-[var(--amber)]/40 bg-[var(--surface-2)] shadow-[0_0_0_1px_rgba(232,150,12,0.15),0_4px_20px_rgba(232,150,12,0.06)]"
            : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--surface-3)]"
        )}
      >
        {/* Image */}
        <div
          className="relative w-full h-32 overflow-hidden bg-[var(--surface-3)] shrink-0 cursor-pointer"
          onClick={openEdit}
        >
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Price badge */}
          <div className="absolute bottom-2 left-2.5">
            <AnimatePresence mode="wait">
              {editingPrice ? (
                <m.div
                  key="editing"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.1 }}
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
                </m.div>
              ) : (
                <m.button
                  key="display"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  onClick={handlePriceBadgeClick}
                  title="Cliquer pour modifier le prix"
                  className={cn(
                    "flex items-center gap-1 text-xs font-bold text-white px-2 py-0.5 rounded-lg transition-colors",
                    isPriceCustom
                      ? "bg-[var(--amber)]/80 hover:bg-[var(--amber)]"
                      : "bg-black/50 hover:bg-black/70"
                  )}
                >
                  {formatCurrency(effectivePrice)}
                  <span className="text-white/60 font-normal text-[10px]"> / {dish.unit}</span>
                </m.button>
              )}
            </AnimatePresence>
          </div>

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
                "w-7 h-7 rounded-lg flex items-center justify-center transition-colors active:scale-95",
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
              className="w-full h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 focus:ring-1 focus:ring-[var(--amber)]/15 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={increment}
              className="w-7 h-7 rounded-lg bg-[var(--amber)] hover:bg-[var(--amber-light)] flex items-center justify-center text-[var(--surface)] transition-colors active:scale-95"
            >
              <Plus size={11} weight="bold" />
            </button>
          </div>

          {/* Total line */}
          <div className="flex items-center justify-between gap-1 min-w-0">
            {displayQty > 0 ? (
              <>
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] min-w-0 truncate">
                  <ShoppingCartSimple size={11} className="text-[var(--amber)] shrink-0" />
                  <span className="truncate">{displayQty} × {formatCurrency(effectivePrice)}</span>
                </div>
                <span className="text-sm font-bold font-mono text-[var(--amber)] shrink-0">
                  {formatCurrency(total)}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-[var(--text-muted)]">Saisir une quantité</span>
            )}
          </div>
        </div>
      </div>

      {/* Modale édition */}
      <AnimatePresence>
        {editOpen && (
          <>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setEditOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <m.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-xs bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-5 shadow-2xl">
                {/* Header : nom + bouton photo + fermer */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {editingName ? (
                      <input
                        ref={nameRef}
                        autoFocus
                        value={editForm.name}
                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                        onBlur={() => setEditingName(false)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
                        className="flex-1 min-w-0 h-7 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--amber)]/50 text-sm font-bold text-[var(--text-primary)] outline-none"
                      />
                    ) : (
                      <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">{editForm.name}</h3>
                    )}
                    {isCustomDish && (
                      <button
                        onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 10); }}
                        className="shrink-0 w-6 h-6 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] transition-colors"
                        title="Modifier le nom"
                      >
                        <PencilSimple size={11} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCustomDish && (
                      <>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-7 h-7 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)] transition-colors"
                          title="Changer la photo"
                        >
                          <Camera size={13} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setEditOpen(false)} className="w-7 h-7 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Aperçu photo si modifiée */}
                {isCustomDish && editForm.image !== dish.image && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden mb-3">
                    <Image src={editForm.image} alt="aperçu" fill className="object-cover" sizes="280px" />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Prix (€)</label>
                    <input type="number" min="0" step="0.5"
                      value={editForm.price}
                      onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Unité</label>
                    <Select
                      value={editForm.unit}
                      onChange={(v) => setEditForm(f => ({ ...f, unit: v }))}
                      options={UNITS.map(u => ({ value: u, label: u }))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  {isCustomDish && (
                    <button onClick={handleDelete}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-[var(--danger)] hover:bg-red-500/20 transition-colors shrink-0"
                      title="Supprimer ce plat"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                  <button onClick={() => setEditOpen(false)} className="flex-1 h-9 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                    Annuler
                  </button>
                  <button onClick={confirmEdit}
                    className="flex-1 h-9 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default DishCard;
