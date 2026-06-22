"use client";

import { useState, useRef } from "react";
import { Package, Wrench, Plus, Minus, X, Check, DownloadSimple } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";

type Rubrique = "ingredients" | "materiel";

function QtyControl({ qty, onSet }: { qty: number; onSet: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(qty));

  const commit = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n >= 0) onSet(n);
    else setInput(String(qty));
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => { const next = Math.max(0, qty - 1); onSet(next); setInput(String(next)); }}
        className="w-7 h-7 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 flex items-center justify-center transition-all active:scale-95">
        <Minus size={11} weight="bold" />
      </button>
      {editing ? (
        <input autoFocus type="number" min="0" value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setInput(String(qty)); setEditing(false); } }}
          className="w-14 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      ) : (
        <button onClick={() => { setInput(String(qty)); setEditing(true); }}
          className="w-14 h-7 text-center font-mono font-bold text-sm bg-[var(--surface-3)] rounded-lg text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--amber)]/30 transition-all">
          {qty}
        </button>
      )}
      <button onClick={() => { const next = qty + 1; onSet(next); setInput(String(next)); }}
        className="w-7 h-7 rounded-lg bg-[var(--amber)] text-[var(--surface)] hover:bg-[var(--amber-light)] flex items-center justify-center transition-all active:scale-95">
        <Plus size={11} weight="bold" />
      </button>
    </div>
  );
}

function NameEditor({ name, onSave }: { name: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  const commit = () => { if (val.trim()) onSave(val.trim()); setEditing(false); };

  if (editing) return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(name); setEditing(false); } }}
        onBlur={commit}
        className="flex-1 min-w-0 h-7 px-2 text-sm bg-[var(--surface-3)] border border-[var(--amber)]/50 rounded-lg text-[var(--text-primary)] outline-none" />
      <button onMouseDown={(e) => { e.preventDefault(); commit(); }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--amber)] text-white shrink-0"><Check size={10} weight="bold" /></button>
      <button onMouseDown={() => { setVal(name); setEditing(false); }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--surface-3)] text-[var(--text-muted)] shrink-0"><X size={10} /></button>
    </div>
  );

  return (
    <button onClick={() => { setVal(name); setEditing(true); }}
      className="text-sm font-medium text-[var(--text-primary)] truncate text-left flex-1 min-w-0 hover:text-[var(--amber)] transition-colors"
      title="Cliquer pour modifier le nom">
      {name}
    </button>
  );
}

export default function TabStocks() {
  const [rubrique, setRubrique] = useState<Rubrique>("ingredients");
  const { ingredients, setIngredientStock, setIngredientName, addIngredient,
          materiel, setMaterielStock, setMaterielName, addMateriel } = useStore();
  const [search, setSearch] = useState("");

  // Ajout ingrédient
  const [addIngOpen, setAddIngOpen] = useState(false);
  const [newIng, setNewIng] = useState({ name: "", unit: "kg", pricePerUnit: "" });

  const handleAddIng = () => {
    if (!newIng.name.trim()) return;
    const price = parseFloat(newIng.pricePerUnit.replace(",", ".")) || 0;
    addIngredient({ id: `custom-${crypto.randomUUID()}`, name: newIng.name.trim(), unit: newIng.unit, pricePerUnit: price, stockQty: 0 });
    setNewIng({ name: "", unit: "kg", pricePerUnit: "" });
    setAddIngOpen(false);
  };

  // Ajout matériel
  const [addMatOpen, setAddMatOpen] = useState(false);
  const [newMat, setNewMat] = useState({ name: "", unit: "unité" });

  const handleAddMat = () => {
    if (!newMat.name.trim()) return;
    addMateriel({ id: `custom-${crypto.randomUUID()}`, name: newMat.name.trim(), unit: newMat.unit, stockQty: 0 });
    setNewMat({ name: "", unit: "unité" });
    setAddMatOpen(false);
  };

  const filteredIng = ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMat = materiel.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  // Import Excel/CSV
  const importRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState("");

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importRef.current) importRef.current.value = "";
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      let added = 0;
      rows.forEach((row) => {
        const name = String(row["Nom"] ?? row["name"] ?? row["Article"] ?? "").trim();
        if (!name) return;
        const qty = parseFloat(String(row["Stock"] ?? row["Quantité"] ?? row["qty"] ?? "0")) || 0;
        const price = parseFloat(String(row["Prix"] ?? row["price"] ?? row["PrixUnitaire"] ?? "0")) || 0;
        const unit = String(row["Unité"] ?? row["unit"] ?? "unité").trim() || "unité";
        if (rubrique === "ingredients") {
          addIngredient({ id: `csv-${crypto.randomUUID()}`, name, unit, pricePerUnit: price, stockQty: qty });
        } else {
          addMateriel({ id: `csv-${crypto.randomUUID()}`, name, unit, stockQty: qty, pricePerUnit: price });
        }
        added++;
      });
      setImportMsg(`${added} élément${added > 1 ? "s" : ""} importé${added > 1 ? "s" : ""}`);
      setTimeout(() => setImportMsg(""), 4000);
    } catch {
      setImportMsg("Erreur de lecture du fichier.");
      setTimeout(() => setImportMsg(""), 4000);
    }
  };

  return (
    <div>
      {/* Sous-onglets */}
      <div className="flex items-center gap-1 mb-4 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit">
        {([["ingredients", "Ingrédients"], ["materiel", "Matériel"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setRubrique(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              rubrique === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>
            {id === "ingredients" ? <Package size={12} /> : <Wrench size={12} />}{label}
          </button>
        ))}
      </div>

      {/* Barre recherche + bouton ajouter */}
      <div className="flex items-center gap-2 mb-4">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--amber)]/50 transition-all" />
        <button
          onClick={() => rubrique === "ingredients" ? setAddIngOpen(true) : setAddMatOpen(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[var(--amber)] text-xs font-semibold hover:bg-[var(--amber)]/20 transition-all shrink-0">
          <Plus size={13} weight="bold" />Ajouter
        </button>
        <input ref={importRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={handleImportExcel} />
        <button onClick={() => importRef.current?.click()}
          title="Importer depuis Excel / CSV"
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-semibold hover:text-[var(--amber)] hover:border-[var(--amber)]/40 transition-all shrink-0">
          <DownloadSimple size={13} weight="bold" />Excel
        </button>
      </div>
      {importMsg && <p className="text-xs text-[var(--success)] mb-3 font-medium">{importMsg}</p>}

      {/* Formulaire ajout ingrédient */}
      {addIngOpen && (
        <div className="mb-4 p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--amber)]/30 space-y-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nouvel ingrédient</p>
          <input value={newIng.name} onChange={(e) => setNewIng((n) => ({ ...n, name: e.target.value }))}
            placeholder="Nom *" autoFocus
            className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
          <div className="grid grid-cols-2 gap-2">
            <input value={newIng.unit} onChange={(e) => setNewIng((n) => ({ ...n, unit: e.target.value }))}
              placeholder="Unité (kg, L…)"
              className="h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
            <input type="number" min="0" step="0.01" value={newIng.pricePerUnit}
              onChange={(e) => setNewIng((n) => ({ ...n, pricePerUnit: e.target.value }))}
              placeholder="Prix/unité (€)"
              className="h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddIngOpen(false)} className="flex-1 h-9 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)]">Annuler</button>
            <button onClick={handleAddIng} disabled={!newIng.name.trim()} className="flex-1 h-9 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-sm font-semibold disabled:opacity-40 transition-all">Ajouter</button>
          </div>
        </div>
      )}

      {/* Formulaire ajout matériel */}
      {addMatOpen && (
        <div className="mb-4 p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--amber)]/30 space-y-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nouveau matériel</p>
          <input value={newMat.name} onChange={(e) => setNewMat((n) => ({ ...n, name: e.target.value }))}
            placeholder="Nom *" autoFocus
            className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
          <input value={newMat.unit} onChange={(e) => setNewMat((n) => ({ ...n, unit: e.target.value }))}
            placeholder="Unité (unité, set…)"
            className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-all" />
          <div className="flex gap-2">
            <button onClick={() => setAddMatOpen(false)} className="flex-1 h-9 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)]">Annuler</button>
            <button onClick={handleAddMat} disabled={!newMat.name.trim()} className="flex-1 h-9 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-sm font-semibold disabled:opacity-40 transition-all">Ajouter</button>
          </div>
        </div>
      )}

      {/* ── Liste ingrédients ──────────────────────────────────── */}
      {rubrique === "ingredients" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            {["Ingrédient (cliquer pour renommer)", "Unité", "Stock"].map((h) => (
              <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {filteredIng.map((ing) => (
              <div key={ing.id} className="flex md:grid md:grid-cols-[1fr_80px_120px] items-center gap-3 px-4 py-3">
                <NameEditor name={ing.name} onSave={(n) => setIngredientName(ing.id, n)} />
                <p className="text-xs text-[var(--text-muted)] shrink-0 hidden md:block">{ing.unit}</p>
                <QtyControl qty={ing.stockQty} onSet={(n) => setIngredientStock(ing.id, n)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Liste matériel ─────────────────────────────────────── */}
      {rubrique === "materiel" && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-0 px-4 py-3 border-b border-[var(--border)]">
            {["Matériel (cliquer pour renommer)", "Unité", "Stock"].map((h) => (
              <p key={h} className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {filteredMat.map((mat) => (
              <div key={mat.id} className="flex md:grid md:grid-cols-[1fr_80px_120px] items-center gap-3 px-4 py-3">
                <NameEditor name={mat.name} onSave={(n) => setMaterielName(mat.id, n)} />
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
