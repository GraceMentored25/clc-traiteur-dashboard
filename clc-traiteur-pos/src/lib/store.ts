"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Devis, Dish, User } from "@/lib/types";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import { generateId } from "@/lib/utils";

interface AppState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;

  appMode: "lab" | "pro";
  setAppMode: (m: "lab" | "pro") => void;

  customPrices: Record<number, number>;
  setCustomPrice: (dishId: number, price: number) => void;

  customDishes: Dish[];
  addCustomDish: (dish: Omit<Dish, "id">) => void;
  removeCustomDish: (id: number) => void;

  customCategories: string[];
  addCustomCategory: (name: string) => void;
  removeCustomCategory: (name: string) => void;

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

      theme: "dark",
      setTheme: (t) => set({ theme: t }),

      customPrices: {},
      setCustomPrice: (dishId, price) =>
        set((s) => ({ customPrices: { ...s.customPrices, [dishId]: price } })),

      customDishes: [],
      addCustomDish: (dish) =>
        set((s) => ({
          customDishes: [...s.customDishes, { ...dish, id: Date.now() }],
        })),
      removeCustomDish: (id) =>
        set((s) => ({ customDishes: s.customDishes.filter((d) => d.id !== id) })),

      customCategories: [],
      addCustomCategory: (name) =>
        set((s) => ({
          customCategories: s.customCategories.includes(name)
            ? s.customCategories
            : [...s.customCategories, name],
        })),
      removeCustomCategory: (name) =>
        set((s) => ({ customCategories: s.customCategories.filter((c) => c !== name) })),

      appMode: "pro",
      setAppMode: (m) => {
        if (m === "pro") {
          set({ appMode: "pro", devisList: [] });
        } else {
          set({ appMode: "lab", devisList: MOCK_DEVIS });
        }
      },

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
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<AppState>;
        if (version < 2) {
          return { ...state, devisList: [], theme: "dark", appMode: "pro" };
        }
        if (version < 3) {
          return { ...state, theme: state.theme ?? "dark", appMode: state.appMode ?? "pro" };
        }
        return state as AppState;
      },
      partialize: (state) => ({
        user: state.user,
        devisList: state.devisList,
        theme: state.theme,
        appMode: state.appMode,
        customPrices: state.customPrices,
        customDishes: state.customDishes,
        customCategories: state.customCategories,
      }),
    }
  )
);
