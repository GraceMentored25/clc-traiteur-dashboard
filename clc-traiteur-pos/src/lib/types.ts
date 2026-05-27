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
