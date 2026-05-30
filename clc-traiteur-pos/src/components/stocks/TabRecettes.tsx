"use client";

import { useState } from "react";
import { BookOpen, CurrencyEur } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { RECIPES } from "@/lib/data/stocks";
import { formatCurrency } from "@/lib/utils";

type Rubrique = "recettes" | "prix";

export default function TabRecettes() {
  const [rubrique, setRubrique] = useState<Rubrique>("recettes");
  const { ingredients, setIngredientPrice } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const confirmEdit = (id: string) => {
    const val = parseFloat(editVal.replace(",", "."));
    if (!isNaN(val) && val >= 0) setIngredientPrice(id, val);
    setEditingId(null);
  };

  return (
    <div>
      {/* Sous-onglets */}
      <div className="flex items-center gap-1 mb-5 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit">
        {([["recettes", "Recettes"], ["prix", "Prix ingrédients"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Recettes ─────────────────────────────────────────── */}
      {rubrique === "recettes" && (
        <div className="space-y-4">
          {RECIPES.map((recipe) => (
            <div key={recipe.dishId} className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                <BookOpen size={14} className="text-[var(--amber)]" />
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">{recipe.dishName}</h3>
                <span className="text-xs text-[var(--text-muted)] ml-auto">par convive</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {recipe.ingredients.map((ri) => {
                  const ing = ingredients.find((i) => i.id === ri.ingredientId);
                  return (
                    <div key={ri.ingredientId} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-[var(--text-primary)]">{ing?.name ?? ri.ingredientId}</span>
                      <span className="text-sm font-mono text-[var(--text-secondary)]">
                        {ri.qtyPerPerson < 1
                          ? `${(ri.qtyPerPerson * 1000).toFixed(0)}g`
                          : `${ri.qtyPerPerson} ${ing?.unit ?? "kg"}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Prix ingrédients ─────────────────────────────────── */}
      {rubrique === "prix" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            {["Ingrédient", "Unité", "Prix / unité"].map((h) => (
              <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex md:grid md:grid-cols-[1fr_80px_120px] items-center gap-3 px-4 py-3">
                <p className="text-sm font-medium text-[var(--text-primary)] flex-1 min-w-0 truncate">{ing.name}</p>
                <p className="text-xs text-[var(--text-muted)] shrink-0">{ing.unit}</p>
                <div className="shrink-0 flex items-center gap-2">
                  {editingId === ing.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="number" min="0" step="0.1"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(ing.id); if (e.key === "Escape") setEditingId(null); }}
                        onBlur={() => confirmEdit(ing.id)}
                        className="w-20 h-7 px-2 text-sm font-mono text-right bg-[var(--surface-2)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-[var(--text-muted)]">€</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(ing.id); setEditVal(String(ing.pricePerUnit)); }}
                      className="flex items-center gap-1 text-sm font-mono text-[var(--amber)] hover:bg-[var(--amber)]/10 px-2 py-0.5 rounded-lg transition-all"
                    >
                      <CurrencyEur size={12} />
                      {ing.pricePerUnit.toFixed(2)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
