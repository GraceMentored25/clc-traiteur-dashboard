"use client";

import { useState, useMemo, memo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass, ShoppingCart, SquaresFour, Rows,
  SortAscending, Plus, X, Camera, Trash, CalendarBlank, GearSix,
} from "@phosphor-icons/react";
import type { RecipeIngredient } from "@/lib/types";
import { CATEGORIES, DISHES } from "@/lib/data/dishes";
import { EVENT_TYPES } from "@/lib/data/event-types";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import DishCard from "./DishCard";
import DishRow from "./DishRow";
import CartPanel from "./CartPanel";
import DevisModal from "./DevisModal";
import { Select } from "@/components/ui/SelectV2";

type ViewMode = "grid" | "list";
type SortMode = "default" | "alpha-asc" | "alpha-desc" | "most-ordered" | "least-ordered";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default",       label: "Sans tri" },
  { value: "alpha-asc",     label: "A → Z" },
  { value: "alpha-desc",    label: "Z → A" },
  { value: "most-ordered",  label: "Plus commandés" },
  { value: "least-ordered", label: "Moins commandés" },
];

export default function DashboardClient() {
  const router = useRouter();
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
  const [newDish, setNewDish] = useState({ name: "", price: "", unit: "portion", description: "", category: "", image: "" });
  const [newDishIngredients, setNewDishIngredients] = useState<RecipeIngredient[]>([]);
  const sortRef = useRef<HTMLDivElement>(null);
  const newDishFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  const cartCount = useStore((s) => s.cart.length);
  const cartTotal = useStore((s) => s.cartTotal);
  const devisList = useStore((s) => s.devisList);
  const customDishes = useStore((s) => s.customDishes);
  const customCategories = useStore((s) => s.customCategories);
  const categoryOrder = useStore((s) => s.categoryOrder);
  const hiddenCategories = useStore((s) => s.hiddenCategories);
  const categoryRenames = useStore((s) => s.categoryRenames);
  const removeCustomCategory = useStore((s) => s.removeCustomCategory);
  const ingredients = useStore((s) => s.ingredients);
  const addCustomDish = useStore((s) => s.addCustomDish);
  const setRecipeIngredients = useStore((s) => s.setRecipeIngredients);
  const addCustomCategory = useStore((s) => s.addCustomCategory);

  // ── Événement / sous-moment ──────────────────────────────────
  const activeEventType = useStore((s) => s.activeEventType);
  const activeSubMoment = useStore((s) => s.activeSubMoment);
  const sectionCarts = useStore((s) => s.sectionCarts);
  const setActiveEventType = useStore((s) => s.setActiveEventType);
  const setActiveSubMoment = useStore((s) => s.setActiveSubMoment);

  const currentEventType = EVENT_TYPES.find((e) => e.id === activeEventType);
  const currentSubMoment = currentEventType?.subMoments.find((s) => s.id === activeSubMoment);

  // Nombre total de sections avec des plats sélectionnés
  const filledSections = useMemo(() =>
    Object.values(sectionCarts).filter((c) => c.length > 0).length,
    [sectionCarts]
  );

  // Total de tous les sous-moments combinés
  const totalAllSections = useMemo(() => {
    return Object.values(sectionCarts).reduce((total, cart) => {
      return total + cart.reduce((s, item) => s + item.dish.price * item.quantity, 0);
    }, 0);
  }, [sectionCarts]);

  // Toutes les catégories (statiques hors "Tous" + custom), triées selon categoryOrder
  const STATIC_CATS = useMemo(() => CATEGORIES.filter((c) => c !== "Tous"), []);
  const allCatKeys = useMemo(() => {
    const all = [...STATIC_CATS, ...customCategories];
    if (categoryOrder.length === 0) return all;
    const inOrder = categoryOrder.filter((c) => all.includes(c));
    const rest = all.filter((c) => !categoryOrder.includes(c));
    return [...inOrder, ...rest];
  }, [STATIC_CATS, customCategories, categoryOrder]);

  // Label affiché (renommage possible)
  const catLabel = useCallback((key: string) => categoryRenames[key] ?? key, [categoryRenames]);

  // Catégories visibles dans la barre (hors masquées) + "Tous" en tête
  const allCategories = useMemo(
    () => ["Tous", ...allCatKeys.filter((c) => !hiddenCategories.includes(c))],
    [allCatKeys, hiddenCategories]
  );
  // Pour les selects d'ajout de plat : toutes les clés (avec label affiché)
  const allCategoriesForSelect = useMemo(
    () => allCatKeys,
    [allCatKeys]
  );
  const allDishes = useMemo(() => [...DISHES, ...customDishes], [customDishes]);

  // Calcul des quantités commandées par plat (depuis tous les devis)
  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devisList.forEach((d) => d.items.forEach((item) => {
      counts[item.dishName] = (counts[item.dishName] ?? 0) + item.quantity;
    }));
    return counts;
  }, [devisList]);

  const filtered = useMemo(() => {
    let list = allDishes.filter((d) => {
      const matchCat = activeCategory === "Tous" || d.category === activeCategory;
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    if (sortMode === "alpha-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (sortMode === "alpha-desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name, "fr"));
    if (sortMode === "most-ordered") list = [...list].sort((a, b) => (orderCounts[b.name] ?? 0) - (orderCounts[a.name] ?? 0));
    if (sortMode === "least-ordered") list = [...list].sort((a, b) => (orderCounts[a.name] ?? 0) - (orderCounts[b.name] ?? 0));
    return list;
  }, [activeCategory, search, sortMode, allDishes, orderCounts]);

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCustomCategory(name);
    setActiveCategory(name);
    setNewCatName("");
    setAddCatOpen(false);
  };

  const handleNewDishPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setNewDish((d) => ({ ...d, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDish = () => {
    const price = parseFloat(newDish.price.replace(",", "."));
    if (!newDish.name.trim() || isNaN(price) || price <= 0 || !newDish.category) return;
    // addCustomDish crée aussi la recette vide dans le store
    addCustomDish({
      name: newDish.name.trim(),
      price,
      unit: newDish.unit || "portion",
      description: newDish.description.trim() || newDish.name.trim(),
      category: newDish.category,
      image: newDish.image || "/dishes/ndole.jpg",
    });
    // Si des ingrédients ont été ajoutés, on les sauvegarde après que le dish ait son id
    if (newDishIngredients.length > 0) {
      // Le nouvel id = Date.now() au moment de addCustomDish, on récupère depuis le store
      setTimeout(() => {
        const state = useStore.getState();
        const created = state.customDishes[state.customDishes.length - 1];
        if (created) setRecipeIngredients(created.id, newDishIngredients);
      }, 0);
    }
    setNewDish({ name: "", price: "", unit: "portion", description: "", category: newDish.category, image: "" });
    setNewDishIngredients([]);
    setAddDishOpen(false);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">

      {/* ── DESKTOP header ─────────────────────────────────────── */}
      <header className="hidden lg:flex sticky top-0 z-30 items-center gap-3 px-8 py-4 bg-[var(--surface-1)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Création de devis</h1>
          {activeSubMoment ? (
            <p className="text-xs text-[var(--amber)] font-medium truncate">
              {currentEventType?.label} — {currentSubMoment?.label}
              {filledSections > 0 && <span className="text-[var(--text-muted)] ml-1.5">· {filledSections} section{filledSections > 1 ? "s" : ""} remplie{filledSections > 1 ? "s" : ""}</span>}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Sélectionnez les plats et définissez les quantités</p>
          )}
        </div>

        {/* Dropdown 1 — Type d'événement */}
        <EventTypeSelector
          activeEventType={activeEventType}
          activeSubMoment={activeSubMoment}
          sectionCarts={sectionCarts}
          onSelectEventType={setActiveEventType}
          onSelectSubMoment={setActiveSubMoment}
        />

        {/* Search */}
        <div className="relative w-56">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-colors border",
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
              <m.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-44 border border-[var(--border)] rounded-xl shadow-xl z-[100] overflow-hidden" style={{ background: "var(--surface-1)" }}
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
              </m.div>
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
                "w-8 h-7 rounded-lg flex items-center justify-center transition-colors",
                viewMode === v ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {v === "grid" ? <SquaresFour size={15} weight={viewMode === "grid" ? "fill" : "regular"} /> : <Rows size={15} weight={viewMode === "list" ? "fill" : "regular"} />}
            </button>
          ))}
        </div>

        {/* Cart */}
        <m.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-[var(--amber)] text-sm font-medium hover:bg-[var(--amber)]/15 transition-colors"
        >
          <ShoppingCart size={17} weight="fill" />
          <span>Panier</span>
          {(filledSections > 0 || cartCount > 0) && (
            <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[var(--amber)] text-[var(--surface)] text-[10px] font-bold flex items-center justify-center">
              {filledSections > 0 ? `${filledSections}` : cartCount}
            </span>
          )}
        </m.button>

        {(cartCount > 0 || filledSections > 0) && (
          <m.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDevisModalOpen(true)}
            className="h-9 px-5 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors whitespace-nowrap"
          >
            {filledSections > 0
              ? `Générer — ${formatCurrency(totalAllSections)}`
              : `Générer — ${formatCurrency(cartTotal())}`
            }
          </m.button>
        )}
      </header>

      {/* ── MOBILE context + event selection + search ──────────── */}
      <div className="lg:hidden px-4 pt-3 pb-2 space-y-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)]">Création de devis</p>
              {activeSubMoment ? (
                <p className="text-xs text-[var(--amber)] font-medium mt-1 break-words">
                  {currentEventType?.label} — {currentSubMoment?.label}
                  {filledSections > 0 && (
                    <span className="text-[var(--text-muted)] ml-1">
                      · {filledSections} section{filledSections > 1 ? "s" : ""} remplie{filledSections > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Sélectionnez un événement puis un moment pour créer un devis par section.
                </p>
              )}
            </div>
            {(cartCount > 0 || filledSections > 0) && (
              <button
                onClick={() => setDevisModalOpen(true)}
                className="shrink-0 h-8 px-3 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-xs font-semibold hover:bg-[var(--amber-light)] transition-colors"
              >
                Générer
              </button>
            )}
          </div>

          <EventTypeSelector
            activeEventType={activeEventType}
            activeSubMoment={activeSubMoment}
            sectionCarts={sectionCarts}
            onSelectEventType={setActiveEventType}
            onSelectSubMoment={setActiveSubMoment}
            mobile
          />
        </div>

        {/* Recherche */}
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un plat..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-colors"
          />
        </div>
        {/* Tri + toggle vue */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown mobile */}
          <div className="relative flex-1" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-colors border",
                sortMode !== "default"
                  ? "bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]"
                  : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]"
              )}
            >
              <SortAscending size={12} />
              <span className="text-xs">{SORT_OPTIONS.find(s => s.value === sortMode)?.label ?? "Tri"}</span>
            </button>
            <AnimatePresence>
              {sortOpen && (
                <m.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-11 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl shadow-xl z-[100] overflow-hidden"
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
                </m.div>
              )}
            </AnimatePresence>
          </div>
          {/* Toggle grille / liste */}
          <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium transition-colors",
                viewMode === "grid" ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-muted)]"
              )}
            >
              <SquaresFour size={14} weight={viewMode === "grid" ? "fill" : "regular"} />
              <span>Grille</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium transition-colors",
                viewMode === "list" ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-muted)]"
              )}
            >
              <Rows size={14} weight={viewMode === "list" ? "fill" : "regular"} />
              <span>Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Category bar ───────────────────────────────────────── */}
      <div className="px-4 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-[var(--amber)] text-[var(--surface)]"
                : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
            )}
          >
            {catLabel(cat)}
          </button>
        ))}

        {/* Bouton + Catégorie */}
        {!addCatOpen ? (
          <button
            onClick={() => setAddCatOpen(true)}
            title="Nouvelle catégorie"
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 transition-colors"
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

        {/* Bouton paramètres catalogue */}
        <button
          onClick={() => router.push("/parametres?tab=catalogue")}
          title="Gérer les catégories"
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 transition-colors"
        >
          <GearSix size={13} weight="bold" />
        </button>
      </div>

      {/* ── Dishes grid ────────────────────────────────────────── */}
      <div className="flex-1 px-3 lg:px-5 py-4 pb-24 lg:pb-5">
        {filtered.length === 0 && !addDishOpen ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <EmptyDishes search={search} />
            {activeCategory !== "Tous" && (
              <button
                onClick={() => { setNewDish(d => ({ ...d, category: activeCategory })); setAddDishOpen(true); }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[var(--amber)] text-sm font-medium hover:bg-[var(--amber)]/20 transition-colors"
              >
                <Plus size={14} weight="bold" /> Ajouter un plat dans « {activeCategory} »
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-muted)]">
                {filtered.length} {activeCategory === "Tous" ? `plat${filtered.length > 1 ? "s" : ""}` : activeCategory.toLowerCase()}
              </p>
              {activeCategory !== "Tous" && (
                <button
                  onClick={() => { setNewDish(d => ({ ...d, category: activeCategory })); setAddDishOpen(true); }}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:border-[var(--amber)]/40 text-xs font-medium transition-colors"
                >
                  <Plus size={11} weight="bold" /> Ajouter un plat
                </button>
              )}
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((dish, i) => (
                    <m.div
                      key={dish.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(i * 0.025, 0.15), duration: 0.18, ease: "easeOut" }}
                    >
                      <DishCard dish={dish} />
                    </m.div>
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
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((dish, i) => (
                    <m.div
                      key={dish.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.1), duration: 0.14, ease: "easeOut" }}
                    >
                      <DishRow dish={dish} />
                    </m.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile FAB cart ────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-5 left-0 right-0 flex justify-center z-30 px-4">
        <m.button
          whileTap={{ scale: 0.97 }}
          onClick={() => (cartCount > 0 || filledSections > 0) ? setCartOpen(true) : null}
          className={cn(
            "flex items-center gap-3 h-14 px-6 rounded-2xl shadow-2xl font-semibold text-sm transition-colors",
            (cartCount > 0 || filledSections > 0)
              ? "bg-[var(--amber)] text-[var(--surface)] cursor-pointer"
              : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] cursor-default"
          )}
        >
          <ShoppingCart size={20} weight="fill" />
          {(cartCount > 0 || filledSections > 0) ? (
            <span>
              {filledSections > 0
                ? `${filledSections} section${filledSections > 1 ? "s" : ""} — ${formatCurrency(totalAllSections)}`
                : `${cartCount} article${cartCount > 1 ? "s" : ""} — ${formatCurrency(cartTotal())}`
              }
            </span>
          ) : (
            <span>Panier vide</span>
          )}
        </m.button>
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
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddDishOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <m.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-sm bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border)] shrink-0">
                  <h3 className="font-bold text-[var(--text-primary)]">Nouveau plat</h3>
                  <button onClick={() => { setAddDishOpen(false); setNewDishIngredients([]); }} className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
                    <X size={15} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {/* Photo */}
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Photo</label>
                    <input ref={newDishFileRef} type="file" accept="image/*" className="hidden" onChange={handleNewDishPhoto} />
                    <button
                      type="button"
                      onClick={() => newDishFileRef.current?.click()}
                      className="w-full h-24 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--amber)]/50 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center gap-2 transition-colors overflow-hidden relative"
                    >
                      {newDish.image ? (
                        <Image src={newDish.image} alt="aperçu" fill className="object-cover rounded-xl" sizes="320px" />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-[var(--text-muted)]">
                          <Camera size={20} />
                          <span className="text-xs">Importer une photo</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Nom du plat *</label>
                    <input autoFocus value={newDish.name} onChange={(e) => setNewDish(d => ({ ...d, name: e.target.value }))}
                      placeholder="Ex: Taro braisé"
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Prix (€) *</label>
                      <input value={newDish.price} onChange={(e) => setNewDish(d => ({ ...d, price: e.target.value }))}
                        type="number" min="0" step="0.5" placeholder="0.00"
                        className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Unité</label>
                      <Select
                        value={newDish.unit}
                        onChange={(v) => setNewDish(d => ({ ...d, unit: v }))}
                        options={["portion", "pièce", "assiette", "verre", "100g", "litre"].map(u => ({ value: u, label: u }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Catégorie *</label>
                    <Select
                      value={newDish.category}
                      onChange={(v) => setNewDish(d => ({ ...d, category: v }))}
                      options={[{ value: "", label: "Choisir…" }, ...allCategoriesForSelect.filter(c => c !== "Tous").map(c => ({ value: c, label: c }))]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Description (optionnel)</label>
                    <input value={newDish.description} onChange={(e) => setNewDish(d => ({ ...d, description: e.target.value }))}
                      placeholder="Brève description…"
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
                  </div>

                  {/* ── Ingrédients de la recette ───────────────────── */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-[var(--text-muted)]">Ingrédients de la recette <span className="opacity-60">(optionnel)</span></label>
                      <button type="button"
                        onClick={() => setNewDishIngredients(prev => [...prev, { ingredientId: ingredients[0]?.id ?? "", qtyPerPerson: 0.1 }])}
                        className="w-6 h-6 rounded-lg bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center transition-colors">
                        <Plus size={11} weight="bold" />
                      </button>
                    </div>
                    {newDishIngredients.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic">Aucun ingrédient — peut être ajouté plus tard dans Stocks → Ressources</p>
                    ) : (
                      <div className="space-y-2">
                        {newDishIngredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Select
                              value={ing.ingredientId}
                              onChange={(v) => setNewDishIngredients(prev => prev.map((x, i) => i === idx ? { ...x, ingredientId: v } : x))}
                              options={ingredients.map(i => ({ value: i.id, label: i.name }))}
                              size="sm"
                              className="flex-1 min-w-0"
                            />
                            <input type="number" min="0" step="0.001" value={ing.qtyPerPerson}
                              onChange={(e) => setNewDishIngredients(prev => prev.map((x, i) => i === idx ? { ...x, qtyPerPerson: parseFloat(e.target.value) || 0 } : x))}
                              className="w-16 h-7 px-2 text-xs text-right bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-6">
                              {ingredients.find(i => i.id === ing.ingredientId)?.unit ?? ""}
                            </span>
                            <button type="button" onClick={() => setNewDishIngredients(prev => prev.filter((_, i) => i !== idx))}
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors shrink-0">
                              <Trash size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)] shrink-0">
                  <button onClick={() => { setAddDishOpen(false); setNewDishIngredients([]); }} className="flex-1 h-10 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Annuler</button>
                  <button onClick={handleAddDish}
                    disabled={!newDish.name.trim() || !newDish.price || !newDish.category}
                    className="flex-1 h-10 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Ajouter
                  </button>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── EventTypeSelector — 2 dropdowns en cascade (portals = hors header backdrop) ──
function EventTypeSelector({
  activeEventType, activeSubMoment, sectionCarts, onSelectEventType, onSelectSubMoment,
  mobile = false,
}: {
  activeEventType: string;
  activeSubMoment: string;
  sectionCarts: Record<string, import("@/lib/types").CartItem[]>;
  onSelectEventType: (id: string) => void;
  onSelectSubMoment: (id: string) => void;
  mobile?: boolean;
}) {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const btn1Ref = useRef<HTMLButtonElement>(null);
  const btn2Ref = useRef<HTMLButtonElement>(null);
  const [rect1, setRect1] = useState<DOMRect | null>(null);
  const [rect2, setRect2] = useState<DOMRect | null>(null);
  const [mounted] = useState(typeof window !== "undefined");
  const [themeColors, setThemeColors] = useState({ bg: "", bgHover: "", bgSelected: "", border: "", text: "", textMuted: "", amber: "", success: "", danger: "" });

  const readTheme = () => {
    const s = getComputedStyle(document.documentElement);
    // Classe "light" ajoutée sur <html> par ThemeApplier quand thème clair
    const isLight = document.documentElement.classList.contains("light");
    setThemeColors({
      bg:        isLight ? "#ffffff" : "#0D1117",
      bgHover:    isLight ? "#f0f2f5" : "#161B22",
      bgSelected: isLight ? "#fff3e0" : "#2a1f08",
      border:    isLight ? "#d0d7de" : "#30363d",
      text:      isLight ? "#111111" : "#F0F6FC",
      textMuted: isLight ? "#57606a" : "#8B949E",
      amber:     s.getPropertyValue("--amber").trim()   || "#E8960C",
      success:   s.getPropertyValue("--success").trim() || "#3FB950",
      danger:    s.getPropertyValue("--danger").trim()  || "#F85149",
    });
  };

  const openDropdown1 = () => {
    readTheme();
    if (btn1Ref.current) setRect1(btn1Ref.current.getBoundingClientRect());
    setOpen1((v) => !v);
    setOpen2(false);
  };
  const openDropdown2 = () => {
    readTheme();
    if (btn2Ref.current) setRect2(btn2Ref.current.getBoundingClientRect());
    setOpen2((v) => !v);
    setOpen1(false);
  };

  useEffect(() => {
    if (!open1 && !open2) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btn1Ref.current?.contains(t) || btn2Ref.current?.contains(t)) return;
      setOpen1(false);
      setOpen2(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open1, open2]);

  const currentEvent = EVENT_TYPES.find((e) => e.id === activeEventType);
  const currentSub = currentEvent?.subMoments.find((s) => s.id === activeSubMoment);
  const filledSections = Object.values(sectionCarts).filter((items) => items.length > 0).length;

  // Style commun pour les panels portals — couleurs lues depuis le thème actif
  const panelStyle = (rect: DOMRect | null): React.CSSProperties => ({
    position: "fixed",
    top: rect ? rect.bottom + 6 : 0,
    left: rect ? rect.left : 0,
    minWidth: 200,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 9999,
    background: themeColors.bg || "var(--surface-2)",
    border: `1px solid ${themeColors.border || "var(--border)"}`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
  });

  return (
    <div className={cn("flex items-center gap-2", mobile && "flex-col items-stretch")}>
      {/* Bouton 1 — Type d'événement */}
      <button
        ref={btn1Ref}
        onClick={openDropdown1}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-colors border whitespace-nowrap",
          mobile && "w-full justify-between",
          activeEventType
            ? "bg-[var(--surface-1)] border-[var(--amber)] text-[var(--amber)] font-semibold"
            : "bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        )}
      >
        <CalendarBlank size={14} />
        <span>{currentEvent?.label ?? "Type d'événement"}</span>
      </button>

      {/* Panel 1 — rendu dans body via portal */}
      {mounted && open1 && rect1 && createPortal(
        <div style={panelStyle(rect1)} onMouseDown={(e) => e.stopPropagation()}>
          {EVENT_TYPES.map((ev) => (
            <button
              key={ev.id}
              onClick={() => { onSelectEventType(ev.id); setOpen1(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 16px",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
                background: activeEventType === ev.id ? themeColors.bgSelected : "transparent",
                color: activeEventType === ev.id ? themeColors.amber : themeColors.textMuted,
                border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (activeEventType !== ev.id) { (e.currentTarget as HTMLButtonElement).style.background = themeColors.bgHover; (e.currentTarget as HTMLButtonElement).style.color = themeColors.text; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = activeEventType === ev.id ? themeColors.bgSelected : "transparent"; (e.currentTarget as HTMLButtonElement).style.color = activeEventType === ev.id ? themeColors.amber : themeColors.textMuted; }}
            >
              <span>{ev.label}</span>
              {activeEventType === ev.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: themeColors.amber }} />}
            </button>
          ))}
          {activeEventType && (
            <button
              onClick={() => {
                if (filledSections > 0) {
                  useStore.getState().clearAllSectionCarts();
                } else {
                  useStore.setState({ activeEventType: "", activeSubMoment: "", cart: [] });
                }
                setOpen1(false);
              }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 16px",
                fontSize: 12, color: themeColors.danger, background: "transparent",
                border: "none", borderTop: `1px solid ${themeColors.border}`, cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = themeColors.bgHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {filledSections > 0 ? "Réinitialiser et vider les sections" : "Réinitialiser"}
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Bouton 2 — Sous-moment */}
      {activeEventType && currentEvent && (
        <button
          ref={btn2Ref}
          onClick={openDropdown2}
          className={cn(
            "flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-colors border whitespace-nowrap",
            mobile && "w-full justify-between",
            activeSubMoment
              ? "bg-[var(--surface-1)] border-[var(--amber)] text-[var(--amber)] font-semibold"
              : "bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <span>{currentSub?.label ?? "Choisir le moment"}</span>
          <div className="flex items-center gap-0.5 ml-1">
            {currentEvent.subMoments.map((sub) => {
              const count = (sectionCarts[sub.id] ?? []).length;
              return (
                <div
                  key={sub.id}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    sub.id === activeSubMoment ? "bg-[var(--amber)]" :
                    count > 0 ? "bg-[var(--success)]" : "bg-[var(--surface-3)]"
                  )}
                  title={`${sub.label} — ${count} plat${count > 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        </button>
      )}

      {/* Panel 2 — rendu dans body via portal */}
      {mounted && open2 && rect2 && currentEvent && createPortal(
        <div style={{ ...panelStyle(rect2), minWidth: 240 }} onMouseDown={(e) => e.stopPropagation()}>
          {currentEvent.subMoments.map((sub) => {
            const count = (sectionCarts[sub.id] ?? []).reduce((n, c) => n + c.quantity, 0);
            return (
              <button
                key={sub.id}
                onClick={() => { onSelectSubMoment(sub.id); setOpen2(false); }}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 16px",
                  fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  background: activeSubMoment === sub.id ? themeColors.bgSelected : "transparent",
                  color: activeSubMoment === sub.id ? themeColors.amber : themeColors.textMuted,
                  border: "none", cursor: "pointer",
                }}
                onMouseEnter={(e) => { if (activeSubMoment !== sub.id) { (e.currentTarget as HTMLButtonElement).style.background = themeColors.bgHover; (e.currentTarget as HTMLButtonElement).style.color = themeColors.text; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = activeSubMoment === sub.id ? themeColors.bgSelected : "transparent"; (e.currentTarget as HTMLButtonElement).style.color = activeSubMoment === sub.id ? themeColors.amber : themeColors.textMuted; }}
              >
                <span>{sub.label}</span>
                {count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: themeColors.bgHover, color: themeColors.success, flexShrink: 0 }}>
                    {count} plat{count > 1 ? "s" : ""}
                  </span>
                )}
                {activeSubMoment === sub.id && count === 0 && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: themeColors.amber, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}

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
