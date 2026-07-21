"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react";
import { DevisStatus } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/utils";

const STATUS_OPTIONS: DevisStatus[] = ["Brouillon", "Envoyé", "Confirmé", "Annulé"];

interface Props {
  value: DevisStatus;
  onChange: (status: DevisStatus) => void;
  size?: "sm" | "md";
}

export default function StatusSelect({ value, onChange, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setRect(r);
    setOpen((v) => !v);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };

    document.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const px = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  const dropdownStyle = rect
    ? {
        position: "fixed" as const,
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 150),
        zIndex: 9999,
      }
    : {};

  return (
    <>
      <div
        ref={triggerRef}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onMouseDown={toggle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(e); }}
        title="Changer le statut"
        className={`inline-flex items-center gap-1 rounded-lg font-semibold cursor-pointer select-none outline-none transition-opacity hover:opacity-80 ${px} ${STATUS_COLORS[value]}`}
      >
        <span>{value}</span>
        <CaretDown size={10} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={dropdownStyle}
          onClick={(e) => e.stopPropagation()}
          className="rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          <ul className="py-1">
            {STATUS_OPTIONS.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(opt); setOpen(false); }}
                className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors ${
                  opt === value ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
                }`}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_COLORS[opt]}`}>{opt}</span>
                {opt === value && <Check size={11} weight="bold" className="shrink-0 text-[var(--amber)]" />}
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}
