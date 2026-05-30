"use client";

import { useState } from "react";
import { Package, Wrench, Plus, Minus } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";

type Rubrique = "ingredients" | "materiel";

function QtyControl({ qty, onSet }: { qty: number; onSet: (n: number) => void }) {
  const [input, setInput] = useState(String(qty));
  const [editing, setEditing] = useState(false);

  const commit = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n >= 0) onSet(n);
    else setInput(String(qty));
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => { const next = Math.max(0, qty - 1); onSet(next); setInput(String(next)); }}
        className="w-7 h-7 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 flex items-center justify-center transition-all active:scale-95"
      >
        <Minus size={11} weight="bold" />
      </button>
      {editing ? (
        <input
          autoFocus
          type="number" min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setInput(String(qty)); setEditing(false); } }}
          className="w-14 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={() => { setInput(String(qty)); setEditing(true); }}
          className="w-14 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] rounded-lg text-[var(--text-primary)] hover:border-[var(--amber)]/30 border border-[var(--border)] transition-all"
        >
          {qty}
        </button>
      )}
      <button
        onClick={() => { const next = qty + 1; onSet(next); setInput(String(next)); }}
        className="w-7 h-7 rounded-lg bg-[var(--amber)] text-[var(--surface)] hover:bg-[var(--amber-light)] flex items-center justify-center transition-all active:scale-95"
      >
        <Plus size={11} weight="bold" />
      </button>
    </div>
  );
}

export default function TabStocks() {
  const [rubrique, setRubrique] = useState<Rubrique>("ingredients");
  const { ingredients, setIngredientStock, materiel, setMaterielStock } = useStore();
  const [search, setSearch] = useState("");

  const filteredIng = ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMat = materiel.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Sous-onglets */}
      <div className="flex items-center gap-1 mb-4 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit">
        {([["ingredients", "Ingrédients"], ["materiel", "Matériel"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {id === "ingredients" ? <Package size={12} /> : <Wrench size={12} />}
            {label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher..."
        className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all mb-4"
      />

      {/* ── Ingrédients ──────────────────────────────────────── */}
      {rubrique === "ingredients" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            {["Ingrédient", "Unité", "Stock"].map((h) => (
              <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {filteredIng.map((ing) => (
              <div key={ing.id} className="flex md:grid md:grid-cols-[1fr_80px_120px] items-center gap-3 px-4 py-3">
                <p className="text-sm font-medium text-[var(--text-primary)] flex-1 min-w-0 truncate">{ing.name}</p>
                <p className="text-xs text-[var(--text-muted)] shrink-0 hidden md:block">{ing.unit}</p>
                <QtyControl qty={ing.stockQty} onSet={(n) => setIngredientStock(ing.id, n)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Matériel ─────────────────────────────────────────── */}
      {rubrique === "materiel" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            {["Matériel", "Unité", "Stock"].map((h) => (
              <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {filteredMat.map((mat) => (
              <div key={mat.id} className="flex md:grid md:grid-cols-[1fr_80px_120px] items-center gap-3 px-4 py-3">
                <p className="text-sm font-medium text-[var(--text-primary)] flex-1 min-w-0 truncate">{mat.name}</p>
                <p className="text-xs text-[var(--text-muted)] shrink-0 hidden md:block">{mat.unit}</p>
                <QtyControl qty={mat.stockQty} onSet={(n) => setMaterielStock(mat.id, n)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
