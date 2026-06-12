"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Plus, Trash, CurrencyEur, PencilSimple, Check, X } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { RECIPES } from "@/lib/data/stocks";
import { RecipeIngredient } from "@/lib/types";
import { Select } from "@/components/ui/Select";

type Rubrique = "recettes" | "prix";
const MULTIPLIERS = [1, 2, 5, 10, 20, 50, 100];
const UNITS_ING = ["g", "kg", "L", "cL", "mL", "pièce", "botte"];

// Composant inline pour éditer une valeur texte/nombre
function InlineEdit({ value, onSave, numeric = false, className = "" }: {
  value: string; onSave: (v: string) => void; numeric?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const commit = () => { if (val.trim()) onSave(val.trim()); setEditing(false); };

  if (editing) return (
    <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus type={numeric ? "number" : "text"} min="0" step="0.001"
        value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        onBlur={commit}
        className="min-w-0 w-24 h-6 px-2 text-xs bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button onMouseDown={(e) => { e.preventDefault(); commit(); }} className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-[var(--amber)] text-white"><Check size={9} weight="bold" /></button>
      <button onMouseDown={() => setEditing(false)} className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-[var(--surface-3)] text-[var(--text-muted)]"><X size={9} /></button>
    </div>
  );

  return (
    <button onClick={() => { setVal(value); setEditing(true); }}
      className={`text-left hover:text-[var(--amber)] hover:underline decoration-dotted underline-offset-2 transition-colors cursor-pointer ${className}`}
      title="Cliquer pour modifier">
      {value}
    </button>
  );
}

export default function TabRecettes() {
  const [rubrique, setRubrique] = useState<Rubrique>("recettes");
  const { ingredients, setIngredientPrice, setIngredientUnit, customRecipes, setRecipeIngredients } = useStore();

  // Multiplicateur global (par convives)
  const [multiplier, setMultiplier] = useState(1);
  const [customMult, setCustomMult] = useState("");
  const [editingCustomMult, setEditingCustomMult] = useState(false);

  // Edition inline dans recette
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const effectiveMult = useMemo(() => {
    const c = parseFloat(customMult);
    return editingCustomMult || isNaN(c) || c <= 0 ? multiplier : c;
  }, [multiplier, customMult, editingCustomMult]);

  // Fusionne recettes de base + customRecipes
  const allRecipes = useMemo(() => RECIPES.map((r) => {
    const custom = customRecipes.find((c) => c.dishId === r.dishId);
    return custom ? { ...r, ingredients: custom.ingredients } : r;
  }), [customRecipes]);

  // Mise à jour quantité d'un ingrédient dans une recette
  const updateQty = (dishId: number, ingredientId: string, rawQty: string) => {
    const qty = parseFloat(rawQty.replace(",", "."));
    if (isNaN(qty) || qty < 0) return;
    const recipe = allRecipes.find((r) => r.dishId === dishId);
    if (!recipe) return;
    const updated = recipe.ingredients.map((ri) =>
      ri.ingredientId === ingredientId ? { ...ri, qtyPerPerson: qty / effectiveMult } : ri
    );
    setRecipeIngredients(dishId, updated);
  };

  // Ajout d'un ingrédient à une recette
  const addIngToRecipe = (dishId: number) => {
    const recipe = allRecipes.find((r) => r.dishId === dishId);
    if (!recipe) return;
    const first = ingredients[0];
    if (!first) return;
    const newIng: RecipeIngredient = { ingredientId: first.id, qtyPerPerson: 0.1 };
    setRecipeIngredients(dishId, [...recipe.ingredients, newIng]);
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

  // Edition prix/unité
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceVal, setPriceVal] = useState("");
  const [unitEditId, setUnitEditId] = useState<string | null>(null);
  const [unitVal, setUnitVal] = useState("");

  const commitPrice = (id: string) => {
    const v = parseFloat(priceVal.replace(",", "."));
    if (!isNaN(v) && v >= 0) setIngredientPrice(id, v);
    setPriceEditId(null);
  };
  const commitUnit = (id: string) => {
    if (unitVal.trim()) setIngredientUnit(id, unitVal.trim());
    setUnitEditId(null);
  };

  return (
    <div>
      {/* Sous-onglets */}
      <div className="flex items-center gap-1 mb-5 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit">
        {([["recettes", "Recettes"], ["prix", "Prix ingrédients"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>{label}</button>
        ))}
      </div>

      {/* ── Recettes ─────────────────────────────────────────── */}
      {rubrique === "recettes" && (
        <>
          {/* Sélecteur multiplicateur */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">Afficher pour</span>
            <div className="flex items-center gap-1 flex-wrap">
              {MULTIPLIERS.map((m) => (
                <button key={m} onClick={() => { setMultiplier(m); setCustomMult(""); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    multiplier === m && !customMult
                      ? "bg-[var(--amber)] text-[var(--surface)]"
                      : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}>{m}</button>
              ))}
              {/* Saisie libre */}
              <input
                type="number" min="1" placeholder="Autre"
                value={customMult}
                onChange={(e) => { setCustomMult(e.target.value); if (e.target.value) setMultiplier(1); }}
                className="w-16 h-7 px-2 rounded-lg text-xs text-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">convive{effectiveMult > 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-4">
            {allRecipes.map((recipe) => (
              <div key={recipe.dishId} className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">{recipe.dishName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">pour {effectiveMult} convive{effectiveMult > 1 ? "s" : ""}</span>
                    <button onClick={() => addIngToRecipe(recipe.dishId)}
                      className="w-6 h-6 rounded-lg bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center transition-all"
                      title="Ajouter un ingrédient">
                      <Plus size={11} weight="bold" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {recipe.ingredients.map((ri) => {
                    const ing = ingredients.find((i) => i.id === ri.ingredientId);
                    const displayQty = (ri.qtyPerPerson * effectiveMult);
                    const qtyStr = displayQty < 1
                      ? `${(displayQty * 1000).toFixed(0)} g`
                      : `${displayQty.toFixed(2)} ${ing?.unit ?? "kg"}`;
                    const editKey = `${recipe.dishId}-${ri.ingredientId}`;

                    return (
                      <div key={ri.ingredientId} className="flex items-center gap-3 px-4 py-2.5">
                        {/* Sélecteur ingrédient */}
                        <Select
                          value={ri.ingredientId}
                          onChange={(newId) => changeIngInRecipe(recipe.dishId, ri.ingredientId, newId)}
                          options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
                          size="sm"
                          className="flex-1 min-w-0"
                        />

                        {/* Quantité éditable */}
                        {editingId === editKey ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              autoFocus type="number" min="0" step="0.001"
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { updateQty(recipe.dishId, ri.ingredientId, editVal); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                              onBlur={() => { updateQty(recipe.dishId, ri.ingredientId, editVal); setEditingId(null); }}
                              className="w-20 h-6 px-2 text-xs text-right bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-[var(--text-muted)] shrink-0">{ing?.unit}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(editKey); setEditVal(displayQty.toFixed(3)); }}
                            className="w-24 text-xs font-mono text-right text-[var(--text-secondary)] hover:text-[var(--amber)] shrink-0 transition-colors cursor-pointer"
                            title="Cliquer pour modifier"
                          >
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
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Prix ingrédients ─────────────────────────────────── */}
      {rubrique === "prix" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_100px_110px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            {["Ingrédient", "Unité", "Prix/unité", ""].map((h, i) => (
              <p key={i} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {ingredients.map((ing) => (
              <div key={ing.id} className="grid grid-cols-[1fr_90px_100px_110px] items-center gap-0 px-4 py-2.5">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate pr-2">{ing.name}</p>

                {/* Unité éditable */}
                {unitEditId === ing.id ? (
                  <div className="flex items-center gap-1">
                    <Select
                      value={unitVal}
                      onChange={(v) => { setUnitVal(v); commitUnit(ing.id); }}
                      options={[...new Set([...UNITS_ING, unitVal])].map((u) => ({ value: u, label: u }))}
                      size="sm"
                      className="w-24"
                    />
                  </div>
                ) : (
                  <button onClick={() => { setUnitEditId(ing.id); setUnitVal(ing.unit); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors text-left">
                    {ing.unit}
                    <PencilSimple size={9} className="inline ml-1 opacity-50" />
                  </button>
                )}

                {/* Prix éditable */}
                {priceEditId === ing.id ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus type="number" min="0" step="0.01" value={priceVal}
                      onChange={(e) => setPriceVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitPrice(ing.id); if (e.key === "Escape") setPriceEditId(null); }}
                      onBlur={() => commitPrice(ing.id)}
                      className="w-20 h-7 px-2 text-xs font-mono text-right bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="text-xs text-[var(--text-muted)]">€</span>
                  </div>
                ) : (
                  <button onClick={() => { setPriceEditId(ing.id); setPriceVal(String(ing.pricePerUnit)); }}
                    className="flex items-center gap-1 text-sm font-mono text-[var(--amber)] hover:bg-[var(--amber)]/10 px-2 py-0.5 rounded-lg transition-all text-left">
                    <CurrencyEur size={11} />{ing.pricePerUnit.toFixed(2)}
                  </button>
                )}

                <p className="text-xs text-[var(--text-muted)] pl-1">€ / {ing.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
