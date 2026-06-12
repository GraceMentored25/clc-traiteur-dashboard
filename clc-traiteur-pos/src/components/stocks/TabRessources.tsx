"use client";
// force-recompile
import { useState, useMemo } from "react";
import { Plus, Trash, CurrencyEur, Check, X, CaretDown, CaretUp } from "@phosphor-icons/react";
import { m, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { RECIPES } from "@/lib/data/stocks";
import { RecipeIngredient } from "@/lib/types";
import { Select } from "@/components/ui/SelectV2";

type Rubrique = "recettes" | "prix-ing" | "prix-mat";
const MULTIPLIERS = [1, 2, 5, 10, 20, 50, 100];

function PriceEditor({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const commit = () => {
    const n = parseFloat(val.replace(",", "."));
    if (!isNaN(n) && n >= 0) onSave(n);
    setEditing(false);
  };
  if (editing) return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input autoFocus type="number" min="0" step="0.01" value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        onBlur={commit}
        className="w-20 h-7 px-2 text-sm font-mono text-right bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <span className="text-xs text-[var(--text-muted)]">€</span>
      <button onMouseDown={(e) => { e.preventDefault(); commit(); }} className="w-5 h-5 rounded flex items-center justify-center bg-[var(--amber)] text-white"><Check size={9} weight="bold" /></button>
    </div>
  );
  return (
    <button onClick={() => { setVal(String(value)); setEditing(true); }}
      className="flex items-center gap-1 text-sm font-mono text-[var(--amber)] hover:bg-[var(--amber)]/10 px-2 py-0.5 rounded-lg transition-all">
      <CurrencyEur size={11} />{value.toFixed(2)}
    </button>
  );
}

export default function TabRessources() {
  const [rubrique, setRubrique] = useState<Rubrique>("recettes");
  const { ingredients, setIngredientPrice, setIngredientUnit, materiel, setMaterielPrice, customRecipes, setRecipeIngredients } = useStore();

  const [multiplier, setMultiplier] = useState(1);
  const [customMult, setCustomMult] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [unitEditId, setUnitEditId] = useState<string | null>(null);
  const [unitVal, setUnitVal] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  const effectiveMult = useMemo(() => {
    const c = parseFloat(customMult);
    return !isNaN(c) && c > 0 ? c : multiplier;
  }, [multiplier, customMult]);

  const allRecipes = useMemo(() => RECIPES.map((r) => {
    const custom = customRecipes.find((c) => c.dishId === r.dishId);
    return custom ? { ...r, ingredients: custom.ingredients } : r;
  }), [customRecipes]);

  const updateQty = (dishId: number, ingredientId: string, rawQty: string) => {
    const qty = parseFloat(rawQty.replace(",", "."));
    if (isNaN(qty) || qty < 0) return;
    const recipe = allRecipes.find((r) => r.dishId === dishId);
    if (!recipe) return;
    setRecipeIngredients(dishId, recipe.ingredients.map((ri) =>
      ri.ingredientId === ingredientId ? { ...ri, qtyPerPerson: qty / effectiveMult } : ri
    ));
  };

  const addIngToRecipe = (dishId: number) => {
    const recipe = allRecipes.find((r) => r.dishId === dishId);
    if (!recipe || !ingredients[0]) return;
    setRecipeIngredients(dishId, [...recipe.ingredients, { ingredientId: ingredients[0].id, qtyPerPerson: 0.1 } as RecipeIngredient]);
  };

  const removeIngFromRecipe = (dishId: number, ingredientId: string) => {
    const recipe = allRecipes.find((r) => r.dishId === dishId);
    if (!recipe) return;
    setRecipeIngredients(dishId, recipe.ingredients.filter((ri) => ri.ingredientId !== ingredientId));
  };

  const changeIngInRecipe = (dishId: number, oldId: string, newId: string) => {
    const recipe = allRecipes.find((r) => r.dishId === dishId);
    if (!recipe) return;
    setRecipeIngredients(dishId, recipe.ingredients.map((ri) =>
      ri.ingredientId === oldId ? { ...ri, ingredientId: newId } : ri
    ));
  };

  const commitUnit = (id: string) => {
    if (unitVal.trim()) setIngredientUnit(id, unitVal.trim());
    setUnitEditId(null);
  };

  return (
    <div>
      {/* Sous-onglets */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto scrollbar-hide bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)]">
        {([
          ["recettes", "Recettes"],
          ["prix-ing", "Prix ingrédients"],
          ["prix-mat", "Prix matériel"],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>{label}</button>
        ))}
      </div>

      {/* ── Recettes ─────────────────────────────────────────── */}
      {rubrique === "recettes" && (
        <>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">Pour</span>
            {MULTIPLIERS.map((m) => (
              <button key={m} onClick={() => { setMultiplier(m); setCustomMult(""); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  multiplier === m && !customMult
                    ? "bg-[var(--amber)] text-[var(--surface)]"
                    : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)]"
                }`}>{m}</button>
            ))}
            <input type="number" min="1" placeholder="N" value={customMult}
              onChange={(e) => { setCustomMult(e.target.value); if (e.target.value) setMultiplier(1); }}
              className="w-16 h-7 px-2 rounded-lg text-xs text-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span className="text-xs text-[var(--text-muted)]">convive{effectiveMult > 1 ? "s" : ""}</span>
          </div>

          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
            {allRecipes.map((recipe, idx) => {
              const isExpanded = expandedRecipe === recipe.dishId;
              return (
                <div key={recipe.dishId} className={idx > 0 ? "border-t border-[var(--border)]" : ""}>
                  {/* Bandeau cliquable */}
                  <button
                    onClick={() => setExpandedRecipe(isExpanded ? null : recipe.dishId)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{recipe.dishName}</p>
                      <span className="text-xs text-[var(--text-muted)] shrink-0">{recipe.ingredients.length} ingrédient{recipe.ingredients.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); addIngToRecipe(recipe.dishId); setExpandedRecipe(recipe.dishId); }}
                        className="w-6 h-6 rounded-lg bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center transition-all"
                        title="Ajouter un ingrédient">
                        <Plus size={11} weight="bold" />
                      </button>
                      {isExpanded ? <CaretUp size={14} className="text-[var(--text-muted)]" /> : <CaretDown size={14} className="text-[var(--text-muted)]" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-[var(--border)]"
                      >
                        <div className="divide-y divide-[var(--border)]">
                          {recipe.ingredients.map((ri) => {
                            const ing = ingredients.find((i) => i.id === ri.ingredientId);
                            const displayQty = ri.qtyPerPerson * effectiveMult;
                            const qtyStr = displayQty < 1
                              ? `${(displayQty * 1000).toFixed(0)} g`
                              : `${displayQty.toFixed(2)} ${ing?.unit ?? "kg"}`;
                            const editKey = `${recipe.dishId}-${ri.ingredientId}`;
                            return (
                              <div key={ri.ingredientId} className="flex items-center gap-3 px-4 py-2.5 bg-[var(--surface-2)]">
                                <Select
                                  value={ri.ingredientId}
                                  onChange={(newId) => changeIngInRecipe(recipe.dishId, ri.ingredientId, newId)}
                                  options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
                                  size="sm"
                                  className="flex-1 min-w-0"
                                />
                                {editingId === editKey ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <input autoFocus type="number" min="0" step="0.001" value={editVal}
                                      onChange={(e) => setEditVal(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === "Enter") { updateQty(recipe.dishId, ri.ingredientId, editVal); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                                      onBlur={() => { updateQty(recipe.dishId, ri.ingredientId, editVal); setEditingId(null); }}
                                      className="w-20 h-6 px-2 text-xs text-right bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <span className="text-xs text-[var(--text-muted)] shrink-0">{ing?.unit}</span>
                                  </div>
                                ) : (
                                  <button onClick={() => { setEditingId(editKey); setEditVal(displayQty.toFixed(3)); }}
                                    className="w-24 text-xs font-mono text-right text-[var(--text-secondary)] hover:text-[var(--amber)] shrink-0 transition-colors">
                                    {qtyStr}
                                  </button>
                                )}
                                <button onClick={() => removeIngFromRecipe(recipe.dishId, ri.ingredientId)}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-all shrink-0">
                                  <Trash size={11} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Prix ingrédients ─────────────────────────────────── */}
      {rubrique === "prix-ing" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_110px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ingrédient</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Unité</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Prix / unité</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {ingredients.map((ing) => (
              <div key={ing.id} className="grid grid-cols-[1fr_70px_110px] items-center gap-0 px-4 py-2.5">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate pr-2">{ing.name}</p>
                {unitEditId === ing.id ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus value={unitVal} onChange={(e) => setUnitVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitUnit(ing.id); if (e.key === "Escape") setUnitEditId(null); }}
                      onBlur={() => commitUnit(ing.id)}
                      className="w-16 h-6 px-1 text-xs bg-[var(--surface-2)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none" />
                    <button onMouseDown={(e) => { e.preventDefault(); commitUnit(ing.id); }}
                      className="w-5 h-5 rounded flex items-center justify-center bg-[var(--amber)] text-white shrink-0"><Check size={9} weight="bold" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setUnitEditId(ing.id); setUnitVal(ing.unit); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors text-left">
                    {ing.unit}
                  </button>
                )}
                <PriceEditor value={ing.pricePerUnit} onSave={(v) => setIngredientPrice(ing.id, v)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prix matériel ─────────────────────────────────────── */}
      {rubrique === "prix-mat" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_110px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Matériel</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Unité</p>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Prix / unité</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {materiel.map((mat) => (
              <div key={mat.id} className="grid grid-cols-[1fr_70px_110px] items-center gap-0 px-4 py-2.5">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate pr-2">{mat.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{mat.unit}</p>
                <PriceEditor value={mat.pricePerUnit ?? 0} onSave={(v) => setMaterielPrice(mat.id, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

