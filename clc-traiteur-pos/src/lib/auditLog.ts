"use client";

export type AuditAction =
  | "DEVIS_CREATED" | "DEVIS_DELETED" | "DEVIS_STATUS_CHANGED"
  | "CAPITAL_ADDED" | "CAPITAL_DELETED" | "CAPITAL_EDITED"
  | "SALAIRE_ADDED" | "SALAIRE_DELETED"
  | "CUSTOM_DISH_CREATED" | "CUSTOM_DISH_DELETED"
  | "DATA_EXPORTED" | "DATA_IMPORTED" | "DATA_RESET";

export interface AuditEntry {
  id: string;
  ts: string;
  action: AuditAction;
  details?: Record<string, unknown>;
}

const AUDIT_KEY = "clc-audit-log";
const MAX_ENTRIES = 500;

export function logAudit(action: AuditAction, details?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const entries: AuditEntry[] = raw ? JSON.parse(raw) : [];
    entries.unshift({
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      action,
      details,
    });
    // Limiter à MAX_ENTRIES pour éviter de remplir le localStorage
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Ne jamais bloquer l'app pour un log raté
  }
}

export function getAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearAuditLog() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUDIT_KEY);
}
