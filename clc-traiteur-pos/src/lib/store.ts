"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Devis, Dish, EntreeCapital, Ingredient, Materiel, DemandeCoursesRepas, DemandeLogistique, User } from "@/lib/types";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
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

  // ── Capital ─────────────────────────────────────────────────
  entreesCapital: EntreeCapital[];
  addEntreeCapital: (e: EntreeCapital) => void;
  removeEntreeCapital: (id: string) => void;

  // ── Stocks ──────────────────────────────────────────────────
  ingredients: Ingredient[];
  setIngredientStock: (id: string, qty: number) => void;
  setIngredientPrice: (id: string, price: number) => void;
  setIngredientUnit: (id: string, unit: string) => void;
  setIngredientName: (id: string, name: string) => void;
  addIngredient: (ing: Ingredient) => void;

  materiel: Materiel[];
  setMaterielStock: (id: string, qty: number) => void;
  setMaterielName: (id: string, name: string) => void;
  setMaterielPrice: (id: string, price: number) => void;
  addMateriel: (mat: Materiel) => void;

  // ── Recettes custom ─────────────────────────────────────────
  customRecipes: import("@/lib/types").Recipe[];
  setRecipeIngredients: (dishId: number, ingredients: import("@/lib/types").RecipeIngredient[]) => void;

  demandesCourses: DemandeCoursesRepas[];
  addDemandeCoursesRepas: (d: DemandeCoursesRepas) => void;
  removeDemandeCoursesRepas: (id: string) => void;
  updateShoppingItem: (demandeId: string, ingredientId: string, qty: number) => void;

  demandesLogistique: DemandeLogistique[];
  addDemandeLogistique: (d: DemandeLogistique) => void;
  removeDemandeLogistique: (id: string) => void;
  updateLogistiqueItem: (demandeId: string, index: number, qty: number) => void;

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

      entreesCapital: [],
      addEntreeCapital: (e) => set((s) => ({ entreesCapital: [e, ...s.entreesCapital] })),
      removeEntreeCapital: (id) => set((s) => ({ entreesCapital: s.entreesCapital.filter((e) => e.id !== id) })),

      ingredients: DEFAULT_INGREDIENTS,
      setIngredientStock: (id, qty) =>
        set((s) => ({ ingredients: s.ingredients.map((i) => i.id === id ? { ...i, stockQty: qty } : i) })),
      setIngredientPrice: (id, price) =>
        set((s) => ({ ingredients: s.ingredients.map((i) => i.id === id ? { ...i, pricePerUnit: price } : i) })),
      setIngredientUnit: (id, unit) =>
        set((s) => ({ ingredients: s.ingredients.map((i) => i.id === id ? { ...i, unit } : i) })),
      setIngredientName: (id, name) =>
        set((s) => ({ ingredients: s.ingredients.map((i) => i.id === id ? { ...i, name } : i) })),
      addIngredient: (ing) =>
        set((s) => ({ ingredients: [...s.ingredients, ing] })),

      materiel: DEFAULT_MATERIEL,
      setMaterielStock: (id, qty) =>
        set((s) => ({ materiel: s.materiel.map((m) => m.id === id ? { ...m, stockQty: qty } : m) })),
      setMaterielName: (id, name) =>
        set((s) => ({ materiel: s.materiel.map((m) => m.id === id ? { ...m, name } : m) })),
      setMaterielPrice: (id, price) =>
        set((s) => ({ materiel: s.materiel.map((m) => m.id === id ? { ...m, pricePerUnit: price } : m) })),
      addMateriel: (mat) =>
        set((s) => ({ materiel: [...s.materiel, mat] })),

      customRecipes: [],
      setRecipeIngredients: (dishId, ingredients) =>
        set((s) => {
          const existing = s.customRecipes.find((r) => r.dishId === dishId);
          if (existing) {
            return { customRecipes: s.customRecipes.map((r) => r.dishId === dishId ? { ...r, ingredients } : r) };
          }
          return { customRecipes: [...s.customRecipes, { dishId, dishName: "", ingredients }] };
        }),

      demandesCourses: [],
      addDemandeCoursesRepas: (d) => set((s) => ({ demandesCourses: [d, ...s.demandesCourses] })),
      removeDemandeCoursesRepas: (id) => set((s) => ({ demandesCourses: s.demandesCourses.filter((d) => d.id !== id) })),
      updateShoppingItem: (demandeId, ingredientId, qty) =>
        set((s) => ({
          demandesCourses: s.demandesCourses.map((d) =>
            d.id !== demandeId ? d : {
              ...d,
              items: d.items.map((i) => i.ingredientId === ingredientId
                ? { ...i, qty, total: Math.round(qty * i.pricePerUnit * 100) / 100 }
                : i),
              totalEstime: d.items.map((i) => i.ingredientId === ingredientId
                ? qty * i.pricePerUnit : i.total).reduce((a, b) => a + b, 0),
            }
          ),
        })),

      demandesLogistique: [],
      addDemandeLogistique: (d) => set((s) => ({ demandesLogistique: [d, ...s.demandesLogistique] })),
      removeDemandeLogistique: (id) => set((s) => ({ demandesLogistique: s.demandesLogistique.filter((d) => d.id !== id) })),
      updateLogistiqueItem: (demandeId, index, qty) =>
        set((s) => ({
          demandesLogistique: s.demandesLogistique.map((d) =>
            d.id !== demandeId ? d : {
              ...d,
              items: d.items.map((item, i) => i === index ? { ...item, qty } : item),
            }
          ),
        })),

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
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<AppState>;
        if (version < 2) {
          return { ...state, devisList: [], theme: "dark", appMode: "pro" };
        }
        if (version < 3) {
          return { ...state, theme: state.theme ?? "dark", appMode: state.appMode ?? "pro" };
        }
        if (version < 4) {
          // Injecter les prix par défaut dans le matériel existant
          const mat = (state.materiel ?? DEFAULT_MATERIEL).map((m) => {
            const def = DEFAULT_MATERIEL.find((d) => d.id === m.id);
            return m.pricePerUnit !== undefined ? m : { ...m, pricePerUnit: def?.pricePerUnit ?? 0 };
          });
          return { ...state, materiel: mat };
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
        entreesCapital: state.entreesCapital,
        ingredients: state.ingredients,
        materiel: state.materiel,
        customRecipes: state.customRecipes,
        demandesCourses: state.demandesCourses,
        demandesLogistique: state.demandesLogistique,
      }),
    }
  )
);
