export interface Dish {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  unit: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface DevisItem {
  dishId: number;
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type DevisStatus = "Brouillon" | "Envoyé" | "Confirmé" | "Annulé";

export interface Devis {
  id: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventType: string;
  guestCount: number;
  createdAt: string;
  status: DevisStatus;
  items: DevisItem[];
  totalHT: number;
  totalTTC: number;
  notes: string;
}

export interface User {
  username: string;
  role: "admin" | "staff";
  displayName: string;
}

// ── Stocks & Gestion ──────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  unit: string;       // kg, L, pièce, etc.
  pricePerUnit: number;
  stockQty: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  qtyPerPerson: number; // quantité par convive
}

export interface Recipe {
  dishId: number;
  dishName: string;
  ingredients: RecipeIngredient[];
}

export interface Materiel {
  id: string;
  name: string;
  unit: string;
  stockQty: number;
  pricePerUnit?: number;
}

export interface ShoppingItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  qty: number;
  pricePerUnit: number;
  total: number;
}

export interface LogistiqueItem {
  name: string;
  qty: number;
  unit: string;
  note?: string;
}

export interface DemandeCoursesRepas {
  id: string;
  devisId: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  createdAt: string;
  items: ShoppingItem[];
  totalEstime: number;
}

export interface DemandeLogistique {
  id: string;
  devisId: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  createdAt: string;
  items: LogistiqueItem[];
}
