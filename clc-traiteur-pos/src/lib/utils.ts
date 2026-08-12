import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const hasCents = amount % 1 !== 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export const STATUS_COLORS: Record<string, string> = {
  Brouillon: "text-[var(--text-secondary)] bg-[var(--surface-3)]",
  Envoyé: "text-[var(--info)] bg-blue-500/10",
  Confirmé: "text-[var(--success)] bg-green-500/10",
  Annulé: "text-[var(--danger)] bg-red-500/10",
};
