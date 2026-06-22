"use client";

import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Plus, Trash, Check, X, CheckSquare, Note, CalendarBlank,
  TextAlignLeft, Table, PencilSimple,
} from "@phosphor-icons/react";

// ── Types ────────────────────────────────────────────────────────────────────
interface ChecklistItem { id: string; text: string; done: boolean; }
interface Checklist { id: string; title: string; items: ChecklistItem[]; createdAt: string; }
interface NoteItem { id: string; title: string; content: string; color: string; createdAt: string; }
interface Rappel { id: string; text: string; date: string; done: boolean; }

// Helper pour formater la date + heure
function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Hook localStorage générique
function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  const set = (v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [state, set];
}

type Tab = "checklists" | "notes" | "rappels" | "tableaux";

const NOTE_COLORS = ["#E8960C", "#3FB950", "#58A6FF", "#A855F7", "#EF4444", "#EC4899"];
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "checklists", label: "Checklists", icon: CheckSquare },
  { id: "notes",      label: "Notes",      icon: Note },
  { id: "rappels",    label: "Rappels",    icon: CalendarBlank },
  { id: "tableaux",   label: "Tableaux",   icon: Table },
];

// ── Checklist Tab ─────────────────────────────────────────────────────────────
function TabChecklists() {
  const [lists, setLists] = useLocalStorage<Checklist[]>("clc-org-checklists", []);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");

  const addList = () => {
    if (!newTitle.trim()) return;
    const list: Checklist = { id: crypto.randomUUID(), title: newTitle.trim(), items: [], createdAt: new Date().toISOString() };
    setLists((l) => [list, ...l]);
    setActiveId(list.id);
    setNewTitle("");
    setCreating(false);
  };

  const addItem = (listId: string) => {
    if (!newItemText.trim()) return;
    setLists((ls) => ls.map((l) => l.id !== listId ? l : {
      ...l, items: [...l.items, { id: crypto.randomUUID(), text: newItemText.trim(), done: false }],
    }));
    setNewItemText("");
  };

  const toggleItem = (listId: string, itemId: string) =>
    setLists((ls) => ls.map((l) => l.id !== listId ? l : {
      ...l, items: l.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i),
    }));

  const deleteItem = (listId: string, itemId: string) =>
    setLists((ls) => ls.map((l) => l.id !== listId ? l : { ...l, items: l.items.filter((i) => i.id !== itemId) }));

  const deleteList = (id: string) => { setLists((ls) => ls.filter((l) => l.id !== id)); if (activeId === id) setActiveId(null); };

  const active = lists.find((l) => l.id === activeId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Colonne gauche — liste des checklists */}
      <div className="space-y-2">
        <button onClick={() => setCreating(true)}
          className="w-full flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-sm font-semibold transition-colors">
          <Plus size={14} weight="bold" /> Nouvelle checklist
        </button>

        <AnimatePresence>
          {creating && (
            <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2 items-center">
              <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addList(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Nom de la checklist…"
                className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--amber)]/50 text-sm text-[var(--text-primary)] outline-none" />
              <button onClick={addList} className="w-9 h-9 rounded-xl bg-[var(--amber)] text-white flex items-center justify-center"><Check size={14} weight="bold" /></button>
              <button onClick={() => setCreating(false)} className="w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center"><X size={14} /></button>
            </m.div>
          )}
        </AnimatePresence>

        {lists.length === 0 && !creating && (
          <p className="text-xs text-[var(--text-muted)] px-3 py-4 text-center">Aucune checklist — créez-en une</p>
        )}

        {lists.map((l) => {
          const done = l.items.filter((i) => i.done).length;
          return (
            <button key={l.id} onClick={() => setActiveId(l.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${activeId === l.id ? "bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-accent)]"}`}>
              <p className="text-sm font-semibold truncate">{l.title}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{done}/{l.items.length} tâches</p>
            </button>
          );
        })}
      </div>

      {/* Colonne droite — détail */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 min-h-[300px]">
        {!active ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <CheckSquare size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">Sélectionnez ou créez une checklist</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">{active.title}</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatCreatedAt(active.createdAt)}</p>
              </div>
              <button onClick={() => deleteList(active.id)} className="w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 flex items-center justify-center transition-colors"><Trash size={13} /></button>
            </div>

            {/* Barre de progression */}
            {active.items.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">{active.items.filter((i) => i.done).length} / {active.items.length} terminées</span>
                  <span className="text-xs font-mono text-[var(--amber)]">{Math.round((active.items.filter((i) => i.done).length / active.items.length) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-3)]">
                  <div className="h-full rounded-full bg-[var(--amber)] transition-all" style={{ width: `${(active.items.filter((i) => i.done).length / active.items.length) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {active.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <button onClick={() => toggleItem(active.id, item.id)}
                    className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${item.done ? "bg-[var(--amber)] border-[var(--amber)]" : "border-[var(--border)] hover:border-[var(--amber)]/50"}`}>
                    {item.done && <Check size={10} weight="bold" className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm transition-colors ${item.done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{item.text}</span>
                  <button onClick={() => deleteItem(active.id, item.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] flex items-center justify-center transition-all"><Trash size={11} /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input value={newItemText} onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addItem(active.id); }}
                placeholder="Ajouter une tâche…"
                className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 transition-colors" />
              <button onClick={() => addItem(active.id)} className="w-9 h-9 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 flex items-center justify-center transition-colors"><Plus size={14} weight="bold" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function TabNotes() {
  const [notes, setNotes] = useLocalStorage<NoteItem[]>("clc-org-notes", []);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", color: NOTE_COLORS[0] });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", color: "" });

  const addNote = () => {
    if (!form.title.trim()) return;
    setNotes((n) => [{ id: crypto.randomUUID(), ...form, createdAt: new Date().toISOString() }, ...n]);
    setForm({ title: "", content: "", color: NOTE_COLORS[0] });
    setCreating(false);
  };

  const saveEdit = (id: string) => {
    setNotes((ns) => ns.map((n) => n.id === id ? { ...n, ...editForm } : n));
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setCreating(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-sm font-semibold transition-colors">
        <Plus size={14} weight="bold" /> Nouvelle note
      </button>

      <AnimatePresence>
        {creating && (
          <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-5 space-y-3">
            <input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Titre de la note…"
              className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50" />
            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Contenu…" rows={4}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50 resize-none" />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{ background: c, outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                    className={`w-5 h-5 rounded-full transition-transform ${form.color === c ? "scale-125" : ""}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="h-8 px-3 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Annuler</button>
                <button onClick={addNote} disabled={!form.title.trim()} className="h-8 px-3 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-xs font-semibold disabled:opacity-40 transition-colors">Créer</button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {notes.length === 0 && !creating && (
        <div className="flex flex-col items-center py-16 text-center">
          <Note size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">Aucune note — créez-en une</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.map((note) => (
          <m.div key={note.id} layout
            className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 flex flex-col gap-2 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: note.color }} />
                {editing === note.id ? (
                  <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="flex-1 h-6 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--amber)]/50 text-sm font-semibold text-[var(--text-primary)] outline-none" />
                ) : (
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{note.title}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {editing === note.id ? (
                  <>
                    <button onClick={() => saveEdit(note.id)} className="w-6 h-6 rounded-lg bg-[var(--amber)] text-white flex items-center justify-center"><Check size={10} weight="bold" /></button>
                    <button onClick={() => setEditing(null)} className="w-6 h-6 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center"><X size={10} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditing(note.id); setEditForm({ title: note.title, content: note.content, color: note.color }); }}
                      className="w-6 h-6 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--amber)] flex items-center justify-center transition-colors">
                      <TextAlignLeft size={10} />
                    </button>
                    <button onClick={() => setNotes((ns) => ns.filter((n) => n.id !== note.id))}
                      className="w-6 h-6 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--danger)] flex items-center justify-center transition-colors">
                      <Trash size={10} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {editing === note.id ? (
              <textarea value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                rows={3} className="w-full px-2 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--amber)]/50 text-xs text-[var(--text-primary)] outline-none resize-none" />
            ) : (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-4 whitespace-pre-wrap">{note.content || <span className="italic opacity-50">Vide</span>}</p>
            )}
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{formatCreatedAt(note.createdAt)}</p>
          </m.div>
        ))}
      </div>
    </div>
  );
}

// ── Rappels Tab ───────────────────────────────────────────────────────────────
function TabRappels() {
  const [rappels, setRappels] = useLocalStorage<Rappel[]>("clc-org-rappels", []);
  const [form, setForm] = useState({ text: "", date: "" });
  const [creating, setCreating] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const add = () => {
    if (!form.text.trim() || !form.date) return;
    setRappels((r) => [...r, { id: crypto.randomUUID(), ...form, done: false }].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ text: "", date: "" });
    setCreating(false);
  };

  const toggle = (id: string) => setRappels((rs) => rs.map((r) => r.id === id ? { ...r, done: !r.done } : r));
  const del = (id: string) => setRappels((rs) => rs.filter((r) => r.id !== id));

  const upcoming = rappels.filter((r) => !r.done && r.date >= today);
  const past = rappels.filter((r) => r.done || r.date < today);

  return (
    <div className="space-y-4">
      <button onClick={() => setCreating(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-sm font-semibold transition-colors">
        <Plus size={14} weight="bold" /> Nouveau rappel
      </button>

      <AnimatePresence>
        {creating && (
          <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 flex flex-col gap-3">
            <input autoFocus value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setCreating(false); }}
              placeholder="Rappel…"
              className="w-full h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50" />
            <div className="flex gap-2">
              <input type="date" value={form.date} min={today} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--amber)]/50" />
              <button onClick={() => setCreating(false)} className="h-9 px-3 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Annuler</button>
              <button onClick={add} disabled={!form.text.trim() || !form.date} className="h-9 px-4 rounded-xl bg-[var(--amber)] text-[var(--surface)] text-sm font-semibold disabled:opacity-40 transition-colors">Créer</button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {rappels.length === 0 && !creating && (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarBlank size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">Aucun rappel — créez-en un</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-1">À venir</p>
          {upcoming.map((r) => {
            const isToday = r.date === today;
            const isPast = r.date < today;
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] group">
                <button onClick={() => toggle(r.id)} className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${r.done ? "bg-[var(--success)] border-[var(--success)]" : "border-[var(--border)] hover:border-[var(--amber)]/50"}`}>
                  {r.done && <Check size={10} weight="bold" className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{r.text}</p>
                  <p className={`text-[11px] mt-0.5 font-mono ${isToday ? "text-[var(--amber)]" : isPast ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}>
                    {isToday ? "Aujourd'hui" : new Date(r.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => del(r.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] flex items-center justify-center transition-all"><Trash size={13} /></button>
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-1">Passés / Faits</p>
          {past.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] opacity-60 group">
              <button onClick={() => toggle(r.id)} className="shrink-0 w-5 h-5 rounded-md border-2 bg-[var(--success)] border-[var(--success)] flex items-center justify-center">
                <Check size={10} weight="bold" className="text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-secondary)] line-through truncate">{r.text}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">{new Date(r.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
              </div>
              <button onClick={() => del(r.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] flex items-center justify-center transition-all"><Trash size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tableaux Tab ─────────────────────────────────────────────────────────────
interface CustomTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
}

function TabTableaux() {
  const [tables, setTables] = useLocalStorage<CustomTable[]>("clc-org-tableaux", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const active = tables.find((t) => t.id === activeId);

  const createTable = () => {
    if (!newTitle.trim()) return;
    const t: CustomTable = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      columns: ["Colonne 1", "Colonne 2"],
      rows: [["", ""]],
    };
    setTables((ts) => [...ts, t]);
    setActiveId(t.id);
    setNewTitle("");
    setCreating(false);
  };

  const update = (patch: Partial<CustomTable>) =>
    setTables((ts) => ts.map((t) => t.id === activeId ? { ...t, ...patch } : t));

  const addColumn = () => {
    if (!active) return;
    update({
      columns: [...active.columns, `Colonne ${active.columns.length + 1}`],
      rows: active.rows.map((r) => [...r, ""]),
    });
  };

  const addRow = () => {
    if (!active) return;
    update({ rows: [...active.rows, active.columns.map(() => "")] });
  };

  const deleteRow = (ri: number) => {
    if (!active) return;
    update({ rows: active.rows.filter((_, i) => i !== ri) });
  };

  const deleteCol = (ci: number) => {
    if (!active) return;
    update({
      columns: active.columns.filter((_, i) => i !== ci),
      rows: active.rows.map((r) => r.filter((_, i) => i !== ci)),
    });
  };

  const setCell = (ri: number, ci: number, val: string) => {
    if (!active) return;
    const rows = active.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r);
    update({ rows });
  };

  const setHeader = (ci: number, val: string) => {
    if (!active) return;
    update({ columns: active.columns.map((c, i) => i === ci ? val : c) });
  };

  const commitCell = () => {
    if (editingCell) { setCell(editingCell.row, editingCell.col, editVal); setEditingCell(null); }
    if (editingHeader !== null) { setHeader(editingHeader, editVal); setEditingHeader(null); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
      {/* Liste des tableaux */}
      <div className="space-y-2">
        <button onClick={() => setCreating(true)}
          className="w-full flex items-center gap-2 h-9 px-3 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] text-[var(--surface)] text-sm font-semibold transition-colors">
          <Plus size={14} weight="bold" /> Nouveau tableau
        </button>
        <AnimatePresence>
          {creating && (
            <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2">
              <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createTable(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Nom du tableau…"
                className="flex-1 h-9 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--amber)]/50 text-sm text-[var(--text-primary)] outline-none" />
              <button onClick={createTable} className="w-9 h-9 rounded-xl bg-[var(--amber)] text-white flex items-center justify-center"><Check size={13} weight="bold" /></button>
              <button onClick={() => setCreating(false)} className="w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center"><X size={13} /></button>
            </m.div>
          )}
        </AnimatePresence>
        {tables.length === 0 && !creating && (
          <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Aucun tableau — créez-en un</p>
        )}
        {tables.map((t) => (
          <div key={t.id} className="flex items-center gap-1 group">
            <button onClick={() => setActiveId(t.id)}
              className={`flex-1 text-left px-3 py-2 rounded-xl text-sm transition-colors ${activeId === t.id ? "bg-[var(--amber)]/10 text-[var(--amber)] font-semibold" : "bg-[var(--surface-2)] text-[var(--text-primary)] hover:border-[var(--border-accent)]"}`}>
              {t.title}
            </button>
            <button onClick={() => { setTables((ts) => ts.filter((x) => x.id !== t.id)); if (activeId === t.id) setActiveId(null); }}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-500/10 flex items-center justify-center transition-all shrink-0">
              <Trash size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Éditeur de tableau */}
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden min-h-[300px]">
        {!active ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <Table size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">Sélectionnez ou créez un tableau</p>
          </div>
        ) : (
          <>
            {/* Header du tableau */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">{active.title}</h3>
              <div className="flex gap-2">
                <button onClick={addColumn}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-colors">
                  <Plus size={10} weight="bold" /> Colonne
                </button>
                <button onClick={addRow}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-colors">
                  <Plus size={10} weight="bold" /> Ligne
                </button>
              </div>
            </div>

            {/* Tableau scrollable */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {active.columns.map((col, ci) => (
                      <th key={ci} className="border-b border-r border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-left font-semibold text-[var(--text-muted)] text-[11px] uppercase tracking-wide min-w-[120px] group relative">
                        {editingHeader === ci ? (
                          <input autoFocus value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitCell}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commitCell(); }}
                            className="w-full bg-transparent outline-none text-[var(--text-primary)] text-xs font-bold" />
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{col}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                              <button onClick={() => { setEditingHeader(ci); setEditingCell(null); setEditVal(col); }}
                                className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--amber)]">
                                <PencilSimple size={9} />
                              </button>
                              {active.columns.length > 1 && (
                                <button onClick={() => deleteCol(ci)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)]">
                                  <X size={9} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="border-b border-[var(--border)] bg-[var(--surface-2)] w-8" />
                  </tr>
                </thead>
                <tbody>
                  {active.rows.map((row, ri) => (
                    <tr key={ri} className="group hover:bg-[var(--surface-2)]/50 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-b border-r border-[var(--border)] px-2 py-1.5 text-[var(--text-primary)] min-w-[120px]"
                          onClick={() => { setEditingCell({ row: ri, col: ci }); setEditingHeader(null); setEditVal(cell); }}>
                          {editingCell?.row === ri && editingCell?.col === ci ? (
                            <input autoFocus value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              onBlur={commitCell}
                              onKeyDown={(e) => { if (e.key === "Enter") commitCell(); if (e.key === "Tab") { commitCell(); } }}
                              className="w-full bg-transparent outline-none text-[var(--text-primary)] text-sm" />
                          ) : (
                            <span className="block truncate min-h-[1.25rem]">{cell || <span className="text-[var(--text-muted)] opacity-40">—</span>}</span>
                          )}
                        </td>
                      ))}
                      <td className="border-b border-[var(--border)] px-1">
                        <button onClick={() => deleteRow(ri)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] transition-all">
                          <Trash size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrganisationClient() {
  const [tab, setTab] = useState<Tab>("checklists");

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Organisation</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Checklists, notes et rappels pour organiser votre activité</p>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)] w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === id ? "bg-[var(--amber)] text-[var(--surface)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
            <Icon size={13} weight={tab === id ? "fill" : "regular"} />
            {label}
          </button>
        ))}
      </div>

      {/* Tous les onglets restent montés — seule la visibilité change (pas de perte de state) */}
      <div style={{ display: tab === "checklists" ? "block" : "none" }}><TabChecklists /></div>
      <div style={{ display: tab === "notes" ? "block" : "none" }}><TabNotes /></div>
      <div style={{ display: tab === "rappels" ? "block" : "none" }}><TabRappels /></div>
      <div style={{ display: tab === "tableaux" ? "block" : "none" }}><TabTableaux /></div>
    </div>
  );
}
