import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function generateId(): string {
  // UUID court pour les IDs de devis — 8 chars hex aléatoires
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `DV-${hex}`;
}

export const STATUS_COLORS: Record<string, string> = {
  Brouillon: "text-[var(--text-secondary)] bg-[var(--surface-3)]",
  Envoyé: "text-[var(--info)] bg-blue-500/10",
  Confirmé: "text-[var(--success)] bg-green-500/10",
  Annulé: "text-[var(--danger)] bg-red-500/10",
};
