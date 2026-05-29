"use client";

import { useState, useMemo, memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass, ShoppingCart, SquaresFour, Rows,
  SortAscending, Plus, X,
} from "@phosphor-icons/react";
import { CATEGORIES, DISHES } from "@/lib/data/dishes";
import { useStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import DishCard from "./DishCard";
import DishRow from "./DishRow";
import CartPanel from "./CartPanel";
import DevisModal from "./DevisModal";

type ViewMode = "grid" | "list";
type SortMode = "default" | "alpha-asc" | "alpha-desc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "Sans tri" },
  { value: "alpha-asc", label: "A → Z" },
  { value: "alpha-desc", label: "Z → A" },
];

export default function DashboardClient() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [devisModalOpen, setDevisModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newDish, setNewDish] = useState({ name: "", price: "", unit: "portion", description: "", category: "" });
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  const { cart, cartTotal, customDishes, customCategories, addCustomDish, addCustomCategory } = useStore();
  const cartCount = cart.length;

  const allCategories = useMemo(() => [...CATEGORIES, ...customCategories], [customCategories]);
  const allDishes = useMemo(() => [...DISHES, ...customDishes], [customDishes]);

  const filtered = useMemo(() => {
    let list = allDishes.filter((d) => {
      const matchCat = activeCategory === "Tous" || d.category === activeCategory;
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    if (sortMode === "alpha-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (sortMode === "alpha-desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name, "fr"));
    return list;
  }, [activeCategory, search, sortMode, allDishes]);

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCustomCategory(name);
    setActiveCategory(name);
    setNewCatName("");
    setAddCatOpen(false);
  };

  const handleAddDish = () => {
    const price = parseFloat(newDish.price.replace(",", "."));
    if (!newDish.name.trim() || isNaN(price) || price <= 0 || !newDish.category) return;
    addCustomDish({
      name: newDish.name.trim(),
      price,
      unit: newDish.unit || "portion",
      description: newDish.description.trim() || newDish.name.trim(),
      category: newDish.category,
      image: "/dishes/ndole.jpg", // image par défaut
    });
    setNewDish({ name: "", price: "", unit: "portion", description: "", category: newDish.category });
    setAddDishOpen(false);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">

      {/* ── DESKTOP header ─────────────────────────────────────── */}
      <header className="hidden lg:flex sticky top-0 z-30 items-center gap-3 px-8 py-4 bg-[var(--surface-1)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Création de devis</h1>
          <p className="text-xs text-[var(--text-muted)]">Sélectionnez les plats et définissez les quantités</p>
        </div>

        {/* Search */}
        <div className="relative w-56">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-all border",
              sortMode !== "default"
                ? "bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]"
                : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <SortAscending size={15} />
            <span>{SORT_OPTIONS.find(s => s.value === sortMode)?.label}</span>
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-44 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl shadow-xl z-[100] overflow-hidden"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortMode(opt.value); setSortOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between",
                      sortMode === opt.value
                        ? "text-[var(--amber)] bg-[var(--amber)]/8"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {opt.label}
                    {sortMode === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-0.5">
          {(["grid", "list"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                "w-8 h-7 rounded-lg flex items-center justify-center transition-all",
                viewMode === v ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {v === "grid" ? <SquaresFour size={15} weight={viewMode === "grid" ? "fill" : "regular"} /> : <Rows size={15} weight={viewMode === "list" ? "fill" : "regular"} />}
            </button>
          ))}
        </div>

        {/* Cart */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-[var(--amber)] text-sm font-medium hover:bg-[var(--amber)]/15 transition-all"
        >
          <ShoppingCart size={17} weight="fill" />
          <span>Panier</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--amber)] text-[var(--surface)] text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </motion.button>

        {cartCount > 0 && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDevisModalOpen(true)}
            className="h-9 px-5 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors whitespace-nowrap"
          >
            Générer — {formatCurrency(cartTotal())}
          </motion.button>
        )}
      </header>

      {/* ── MOBILE search bar ──────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-3 pb-2">
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un plat..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all"
          />
        </div>
      </div>

      {/* ── Category bar ───────────────────────────────────────── */}
      <div className="px-4 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all duration-200",
              activeCategory === cat
                ? "bg-[var(--amber)] text-[var(--surface)]"
                : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
            )}
          >
            {cat}
          </button>
        ))}

        {/* Bouton + Catégorie */}
        {!addCatOpen ? (
          <button
            onClick={() => setAddCatOpen(true)}
            title="Nouvelle catégorie"
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 transition-all"
          >
            <Plus size={13} weight="bold" />
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5">
            <input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setAddCatOpen(false); }}
              placeholder="Nom catégorie…"
              className="h-7 px-2.5 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--amber)]/50 text-[var(--text-primary)] outline-none w-36"
            />
            <button onClick={handleAddCategory} className="h-7 px-2.5 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-xs font-semibold">OK</button>
            <button onClick={() => setAddCatOpen(false)} className="h-7 w-7 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── Dishes grid ────────────────────────────────────────── */}
      <div className="flex-1 px-3 lg:px-5 py-4 pb-24 lg:pb-5">
        {filtered.length === 0 && !addDishOpen ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <EmptyDishes search={search} />
            {activeCategory !== "Tous" && (
              <button
                onClick={() => { setNewDish(d => ({ ...d, category: activeCategory })); setAddDishOpen(true); }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[var(--amber)] text-sm font-medium hover:bg-[var(--amber)]/20 transition-all"
              >
                <Plus size={14} weight="bold" /> Ajouter un plat dans « {activeCategory} »
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-muted)]">
                {filtered.length} plat{filtered.length > 1 ? "s" : ""}
              </p>
              {activeCategory !== "Tous" && (
                <button
                  onClick={() => { setNewDish(d => ({ ...d, category: activeCategory })); setAddDishOpen(true); }}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 text-xs font-medium transition-all"
                >
                  <Plus size={11} weight="bold" /> Ajouter un plat
                </button>
              )}
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((dish, i) => (
                    <motion.div
                      key={dish.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03, type: "spring", stiffness: 220, damping: 26 }}
                    >
                      <DishCard dish={dish} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="hidden lg:grid grid-cols-[2fr_1fr_120px_140px] gap-4 px-4 pb-1 border-b border-[var(--border)]">
                  {["Plat", "Catégorie", "Prix / unité", "Quantité"].map((h) => (
                    <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
                  ))}
                </div>
                <AnimatePresence mode="popLayout">
                  {filtered.map((dish, i) => (
                    <motion.div
                      key={dish.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <DishRow dish={dish} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile FAB cart ────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-5 left-0 right-0 flex justify-center z-30 px-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => cartCount > 0 ? setCartOpen(true) : null}
          className={cn(
            "flex items-center gap-3 h-14 px-6 rounded-2xl shadow-2xl font-semibold text-sm transition-all",
            cartCount > 0
              ? "bg-[var(--amber)] text-[var(--surface)] cursor-pointer"
              : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] cursor-default"
          )}
        >
          <ShoppingCart size={20} weight="fill" />
          {cartCount > 0 ? (
            <span>{cartCount} article{cartCount > 1 ? "s" : ""} — {formatCurrency(cartTotal())}</span>
          ) : (
            <span>Panier vide</span>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {cartOpen && (
          <CartPanel onClose={() => setCartOpen(false)} onGenerateDevis={() => { setCartOpen(false); setDevisModalOpen(true); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {devisModalOpen && <DevisModal onClose={() => setDevisModalOpen(false)} />}
      </AnimatePresence>

      {/* ── Modal ajout plat ───────────────────────────────────── */}
      <AnimatePresence>
        {addDishOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddDishOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-sm bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-[var(--text-primary)]">Nouveau plat</h3>
                  <button onClick={() => setAddDishOpen(false)} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Nom du plat *</label>
                    <input autoFocus value={newDish.name} onChange={(e) => setNewDish(d => ({ ...d, name: e.target.value }))}
                      placeholder="Ex: Taro braisé"
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Prix (€) *</label>
                      <input value={newDish.price} onChange={(e) => setNewDish(d => ({ ...d, price: e.target.value }))}
                        type="number" min="0" step="0.5" placeholder="0.00"
                        className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Unité</label>
                      <select value={newDish.unit} onChange={(e) => setNewDish(d => ({ ...d, unit: e.target.value }))}
                        className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all">
                        {["portion", "pièce", "assiette", "verre", "100g", "litre"].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Catégorie *</label>
                    <select value={newDish.category} onChange={(e) => setNewDish(d => ({ ...d, category: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all">
                      <option value="">Choisir…</option>
                      {allCategories.filter(c => c !== "Tous").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Description (optionnel)</label>
                    <input value={newDish.description} onChange={(e) => setNewDish(d => ({ ...d, description: e.target.value }))}
                      placeholder="Brève description…"
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setAddDishOpen(false)} className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Annuler</button>
                  <button onClick={handleAddDish}
                    disabled={!newDish.name.trim() || !newDish.price || !newDish.category}
                    className="flex-1 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Ajouter
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const EmptyDishes = memo(function EmptyDishes({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-4">
        <MagnifyingGlass size={28} className="text-[var(--text-muted)]" />
      </div>
      <p className="font-semibold text-[var(--text-primary)] mb-1">Aucun plat trouvé</p>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">
        {search ? `Aucun résultat pour "${search}"` : "Cette catégorie ne contient pas encore de plats."}
      </p>
    </div>
  );
});
