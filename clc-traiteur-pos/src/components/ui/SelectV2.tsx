"use client";
// v2 — portal + div trigger
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react";

export interface SelectOption {
  value: string;
  label: string;
  labelClassName?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  size = "md",
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const h = size === "sm" ? "h-7 px-2 text-xs rounded-lg" : "h-10 px-3 text-sm rounded-xl";

  const openDropdown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setRect(r);
    setOpen((v) => !v);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;

    // Ferme si clic en dehors du trigger ET du dropdown
    const onPointer = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };

    // Ferme seulement si le scroll se passe en dehors du dropdown (page qui scrolle)
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };

    // Ferme sur Escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dropdownStyle = rect
    ? {
        position: "fixed" as const,
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 160),
        zIndex: 9999,
      }
    : {};

  return (
    <div className={`relative ${className}`}>
      {/* div au lieu de button — évite le bug button>button quand le parent est déjà un <button> */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onMouseDown={openDropdown}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDropdown(e as never); }}
        className={`w-full flex items-center justify-between gap-2 ${h} bg-[var(--surface-2)] border transition-colors outline-none select-none
          ${open ? "border-[var(--amber)]/50" : "border-[var(--border)] hover:border-[var(--border-accent)]"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`truncate ${selected?.labelClassName ?? (selected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}`}>
          {selected?.label ?? placeholder ?? "Sélectionner…"}
        </span>
        <CaretDown
          size={size === "sm" ? 10 : 12}
          className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={{ ...dropdownStyle, background: "#0D1117" }}
          className="rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          <ul className="py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                style={opt.value === value
                  ? { background: "rgba(232,150,12,0.08)", color: "#E8960C" }
                  : { color: "#F0F6FC" }
                }
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer transition-colors hover:!text-[#E8960C]"
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={11} weight="bold" style={{ color: "#E8960C" }} className="shrink-0" />}
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}

