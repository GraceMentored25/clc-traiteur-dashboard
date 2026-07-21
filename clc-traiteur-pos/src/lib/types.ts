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
  section?: string; // moment de l'événement (ex: "Vin d'honneur")
}

export interface DevisSection {
  label: string;
  items: DevisItem[];
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

export interface EntreeCapital {
  id: string;
  libelle: string;
  montant: number;
  date: string; // ISO
  source: "vente" | "apport" | "subvention" | "autre";
}

// ── Personnel & Salaires ──────────────────────────────────────────────────

export type PersonnelRole = "associe" | "commis" | "consultant";

export interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
}

export interface Salaire {
  id: string;
  personnelId?: string; // référence au personnel (absent si personne ponctuelle)
  name: string;         // nom figé au moment du versement
  role?: PersonnelRole;
  montant: number;
  date: string;         // ISO
  libelle?: string;     // motif / période (ex: "Salaire juillet")
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
  stockUtilise: number; // quantité prélevée depuis le stock
  pricePerUnit: number;
  total: number; // calculé sur qty - stockUtilise
}

export interface LogistiqueItem {
  name: string;
  qty: number;
  stockUtilise?: number; // quantité prélevée depuis le stock matériel
  unit: string;
  note?: string;
}

export type CoursesStatut = "en_attente" | "confirmé";

export interface DemandeCoursesRepas {
  id: string;
  devisId: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  createdAt: string;
  items: ShoppingItem[];
  totalEstime: number;
  statut?: CoursesStatut;
}

export interface DemandeLogistique {
  id: string;
  devisId: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  createdAt: string;
  items: LogistiqueItem[];
  totalEstime?: number;
  statut?: CoursesStatut;
}
