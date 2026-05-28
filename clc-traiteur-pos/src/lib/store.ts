"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Devis, User } from "@/lib/types";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import { generateId } from "@/lib/utils";

interface AppState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  removeFromCart: (dishId: number) => void;
  clearCart: () => void;
  cartTotal: () => number;

  devisList: Devis[];
  addDevis: (devis: Omit<Devis, "id" | "createdAt">) => void;
  updateDevisStatus: (id: string, status: Devis["status"]) => void;
  updateDevis: (id: string, updates: Partial<Devis>) => void;
  deleteDevis: (id: string) => void;
}

const USERS = [
  { username: "admin", password: "4243", role: "admin" as const, displayName: "Administrateur" },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (username, password) => {
        const found = USERS.find(
          (u) => u.username === username && u.password === password
        );
        if (found) {
          set({ user: { username: found.username, role: found.role, displayName: found.displayName } });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),

      cart: [],
      addToCart: (item) => {
        const current = get().cart;
        const existing = current.find((c) => c.dish.id === item.dish.id);
        if (existing) {
          set({
            cart: current.map((c) =>
              c.dish.id === item.dish.id
                ? { ...c, quantity: c.quantity + item.quantity }
                : c
            ),
          });
        } else {
          set({ cart: [...current, item] });
        }
      },
      updateQuantity: (dishId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(dishId);
          return;
        }
        set({ cart: get().cart.map((c) => c.dish.id === dishId ? { ...c, quantity } : c) });
      },
      removeFromCart: (dishId) => {
        set({ cart: get().cart.filter((c) => c.dish.id !== dishId) });
      },
      clearCart: () => set({ cart: [] }),
      cartTotal: () => get().cart.reduce((sum, c) => sum + c.dish.price * c.quantity, 0),

      devisList: MOCK_DEVIS,
      addDevis: (devisData) => {
        const newDevis: Devis = { ...devisData, id: generateId(), createdAt: new Date().toISOString() };
        set({ devisList: [newDevis, ...get().devisList] });
      },
      updateDevisStatus: (id, status) => {
        set({ devisList: get().devisList.map((d) => d.id === id ? { ...d, status } : d) });
      },
      updateDevis: (id, updates) => {
        set({ devisList: get().devisList.map((d) => d.id === id ? { ...d, ...updates } : d) });
      },
      deleteDevis: (id) => {
        set({ devisList: get().devisList.filter((d) => d.id !== id) });
      },
    }),
    {
      name: "clc-traiteur-storage",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // v2 : reset devisList to updated mock data
        if (version < 2) {
          return { ...(persisted as object), devisList: MOCK_DEVIS };
        }
        return persisted as AppState;
      },
      partialize: (state) => ({ user: state.user, devisList: state.devisList }),
    }
  )
);
