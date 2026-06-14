"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { encryptStore, decryptStore } from "@/lib/crypto";
import { logAudit } from "@/lib/auditLog";
import type { ThemeId } from "@/lib/themes";
import { CartItem, Devis, Dish, EntreeCapital, Ingredient, Materiel, DemandeCoursesRepas, DemandeLogistique, User } from "@/lib/types";
import { MOCK_DEVIS } from "@/lib/data/mock-events";
import { DEFAULT_INGREDIENTS, DEFAULT_MATERIEL } from "@/lib/data/stocks";
import { generateId } from "@/lib/utils";

export interface AppState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  theme: "dark" | "light"; // gardé pour compatibilité Supabase
  setTheme: (t: "dark" | "light") => void;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;

  accentColor: string;
  setAccentColor: (color: string) => void;

  appMode: "lab" | "pro";
  setAppMode: (m: "lab" | "pro") => void;

  customPrices: Record<number, number>;
  setCustomPrice: (dishId: number, price: number) => void;

  customDishes: Dish[];
  addCustomDish: (dish: Omit<Dish, "id">) => void;
  removeCustomDish: (id: number) => void;
  updateCustomDish: (id: number, patch: Partial<Omit<Dish, "id">>) => void;

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
  setCoursesStatut: (id: string, statut: import("@/lib/types").CoursesStatut) => void;
  setShoppingItemStock: (demandeId: string, ingredientId: string, stockUtilise: number) => void;

  demandesLogistique: DemandeLogistique[];
  addDemandeLogistique: (d: DemandeLogistique) => void;
  removeDemandeLogistique: (id: string) => void;
  updateLogistiqueItem: (demandeId: string, index: number, qty: number) => void;
  setLogistiqueItemStock: (demandeId: string, index: number, stockUtilise: number) => void;
  setLogistiqueStatut: (id: string, statut: import("@/lib/types").CoursesStatut) => void;

  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  removeFromCart: (dishId: number) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Deux listes séparées — Pro et Lab ne se mélangent jamais
  devisListPro: Devis[];
  devisListLab: Devis[];
  devisList: Devis[]; // vue calculée selon appMode
  addDevis: (devis: Omit<Devis, "id" | "createdAt">) => void;
  updateDevisStatus: (id: string, status: Devis["status"]) => void;
  updateDevis: (id: string, updates: Partial<Devis>) => void;
  deleteDevis: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      // login() synchronise uniquement l'état UI — la vraie vérification est dans /api/auth/login
      // Ne jamais appeler login() directement sans passer par l'API route
      login: (username, _password) => {
        set({ user: { username, role: "admin", displayName: "Administrateur" } });
        return true;
      },
      logout: () => set({ user: null }),

      theme: "dark",
      setTheme: (t) => set({ theme: t }),

      themeId: "obsidienne" as ThemeId,
      setThemeId: (id) => {
        const { THEMES } = require("@/lib/themes");
        const t = THEMES.find((t: { id: string }) => t.id === id);
        set({ themeId: id, theme: t?.isDark === false ? "light" : "dark" });
      },

      accentColor: "#E8960C",
      setAccentColor: (color) => set({ accentColor: color }),

      appMode: "pro",
      setAppMode: (m) => {
        const s = get();
        if (m === "pro") {
          const proDevisIds = new Set(s.devisListPro.map((d) => d.id));
          set({
            appMode: "pro",
            devisListLab: s.devisList,
            devisList: s.devisListPro,
            // Supprimer les courses/logistique qui ne correspondent à aucun devis pro
            demandesCourses: s.demandesCourses.filter((d) => proDevisIds.has(d.devisId)),
            demandesLogistique: s.demandesLogistique.filter((d) => proDevisIds.has(d.devisId)),
          });
        } else {
          const labDevis = s.devisListLab.length ? s.devisListLab : MOCK_DEVIS;
          const labDevisIds = new Set(labDevis.map((d) => d.id));
          set({
            appMode: "lab",
            devisListPro: s.devisList,
            devisList: labDevis,
            // Supprimer les courses/logistique qui ne correspondent à aucun devis lab
            demandesCourses: s.demandesCourses.filter((d) => labDevisIds.has(d.devisId)),
            demandesLogistique: s.demandesLogistique.filter((d) => labDevisIds.has(d.devisId)),
          });
        }
      },

      customPrices: {},
      setCustomPrice: (dishId, price) =>
        set((s) => ({ customPrices: { ...s.customPrices, [dishId]: price } })),

      customDishes: [],
      addCustomDish: (dish) =>
        set((s) => {
          const id = parseInt(crypto.randomUUID().replace(/-/g, "").slice(0, 12), 16);
          const newDish = { ...dish, id };
          // Crée automatiquement une recette vide pour ce plat
          const newRecipe = { dishId: id, dishName: dish.name, ingredients: [] };
          return {
            customDishes: [...s.customDishes, newDish],
            customRecipes: [...s.customRecipes, newRecipe],
          };
        }),
      removeCustomDish: (id) =>
        set((s) => ({
          customDishes: s.customDishes.filter((d) => d.id !== id),
          customRecipes: s.customRecipes.filter((r) => r.dishId !== id),
        })),
      updateCustomDish: (id, patch) =>
        set((s) => ({ customDishes: s.customDishes.map((d) => d.id === id ? { ...d, ...patch } : d) })),

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
      addEntreeCapital: (e) => { logAudit("CAPITAL_ADDED", { id: e.id, montant: e.montant, source: e.source }); set((s) => ({ entreesCapital: [e, ...s.entreesCapital] })); },
      removeEntreeCapital: (id) => { logAudit("CAPITAL_DELETED", { id }); set((s) => ({ entreesCapital: s.entreesCapital.filter((e) => e.id !== id) })); },

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
      setCoursesStatut: (id, statut) =>
        set((s) => {
          const updated = s.demandesCourses.map((d) => d.id === id ? { ...d, statut } : d);
          // Quand on confirme, déduire le stock utilisé des ingrédients
          if (statut === "confirmé") {
            const demande = s.demandesCourses.find((d) => d.id === id);
            if (demande) {
              const newIngredients = s.ingredients.map((ing) => {
                const item = demande.items.find((i) => i.ingredientId === ing.id);
                if (!item || !item.stockUtilise) return ing;
                return { ...ing, stockQty: Math.max(0, ing.stockQty - item.stockUtilise) };
              });
              return { demandesCourses: updated, ingredients: newIngredients };
            }
          }
          return { demandesCourses: updated };
        }),
      setShoppingItemStock: (demandeId, ingredientId, stockUtilise) =>
        set((s) => ({
          demandesCourses: s.demandesCourses.map((d) => {
            if (d.id !== demandeId) return d;
            const items = d.items.map((i) => {
              if (i.ingredientId !== ingredientId) return i;
              const stock = Math.min(stockUtilise, i.qty); // ne peut pas utiliser plus que la quantité totale
              const qtyAcheter = Math.max(0, i.qty - stock);
              return { ...i, stockUtilise: stock, total: Math.round(qtyAcheter * i.pricePerUnit * 100) / 100 };
            });
            const totalEstime = items.reduce((s, i) => s + i.total, 0);
            return { ...d, items, totalEstime };
          }),
        })),
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
          demandesLogistique: s.demandesLogistique.map((d) => {
            if (d.id !== demandeId) return d;
            const items = d.items.map((item, i) => i === index ? { ...item, qty } : item);
            const mat = (s.materiel ?? []);
            const totalEstime = items.reduce((sum, item) => {
              const m = mat.find((m) => m.name === item.name);
              return sum + (m?.pricePerUnit ?? 0) * item.qty;
            }, 0);
            return { ...d, items, totalEstime };
          }),
        })),
      setLogistiqueItemStock: (demandeId, index, stockUtilise) =>
        set((s) => ({
          demandesLogistique: s.demandesLogistique.map((d) => {
            if (d.id !== demandeId) return d;
            const items = d.items.map((item, i) => {
              if (i !== index) return item;
              const stock = Math.min(stockUtilise, item.qty);
              return { ...item, stockUtilise: stock };
            });
            const mat = s.materiel;
            const totalEstime = items.reduce((sum, item) => {
              const m = mat.find((m) => m.name === item.name);
              const qtyAcheter = Math.max(0, item.qty - (item.stockUtilise ?? 0));
              return sum + (m?.pricePerUnit ?? 0) * qtyAcheter;
            }, 0);
            return { ...d, items, totalEstime };
          }),
        })),
      setLogistiqueStatut: (id, statut) =>
        set((s) => {
          const updated = s.demandesLogistique.map((d) => d.id === id ? { ...d, statut } : d);
          if (statut === "confirmé") {
            const demande = s.demandesLogistique.find((d) => d.id === id);
            if (demande) {
              const newMateriel = s.materiel.map((mat) => {
                const item = demande.items.find((i) => i.name === mat.name);
                if (!item || !item.stockUtilise) return mat;
                return { ...mat, stockQty: Math.max(0, mat.stockQty - item.stockUtilise) };
              });
              return { demandesLogistique: updated, materiel: newMateriel };
            }
          }
          return { demandesLogistique: updated };
        }),

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

      devisListPro: [],
      devisListLab: MOCK_DEVIS,
      devisList: [],
      addDevis: (devisData) => {
        const newDevis: Devis = { ...devisData, id: generateId(), createdAt: new Date().toISOString() };
        logAudit("DEVIS_CREATED", { id: newDevis.id, client: newDevis.clientName, total: newDevis.totalTTC });
        const mode = get().appMode;
        set((s) => ({
          devisList: [newDevis, ...s.devisList],
          ...(mode === "pro" ? { devisListPro: [newDevis, ...s.devisListPro] } : { devisListLab: [newDevis, ...s.devisListLab] }),
        }));
      },
      updateDevisStatus: (id, status) => {
        logAudit("DEVIS_STATUS_CHANGED", { id, status });
        const mode = get().appMode;
        set((s) => ({
          devisList: s.devisList.map((d) => d.id === id ? { ...d, status } : d),
          ...(mode === "pro"
            ? { devisListPro: s.devisListPro.map((d) => d.id === id ? { ...d, status } : d) }
            : { devisListLab: s.devisListLab.map((d) => d.id === id ? { ...d, status } : d) }),
        }));
      },
      updateDevis: (id, updates) => {
        const mode = get().appMode;
        set((s) => ({
          devisList: s.devisList.map((d) => d.id === id ? { ...d, ...updates } : d),
          ...(mode === "pro"
            ? { devisListPro: s.devisListPro.map((d) => d.id === id ? { ...d, ...updates } : d) }
            : { devisListLab: s.devisListLab.map((d) => d.id === id ? { ...d, ...updates } : d) }),
        }));
      },
      deleteDevis: (id) => {
        logAudit("DEVIS_DELETED", { id });
        const mode = get().appMode;
        set((s) => ({
          devisList: s.devisList.filter((d) => d.id !== id),
          ...(mode === "pro"
            ? { devisListPro: s.devisListPro.filter((d) => d.id !== id) }
            : { devisListLab: s.devisListLab.filter((d) => d.id !== id) }),
          // Supprimer aussi les courses et logistique liées à ce devis
          demandesCourses: s.demandesCourses.filter((d) => d.devisId !== id),
          demandesLogistique: s.demandesLogistique.filter((d) => d.devisId !== id),
        }));
      },
    }),
    {
      name: "clc-traiteur-storage",
      version: 5,
      // Chiffrement AES-GCM des données sensibles en localStorage (CWE-311/312)
      storage: createJSONStorage(() => ({
        getItem: async (key: string) => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          return decryptStore(raw);
        },
        setItem: async (key: string, value: string) => {
          const encrypted = await encryptStore(value);
          localStorage.setItem(key, encrypted);
        },
        removeItem: async (key: string) => localStorage.removeItem(key),
      })),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<AppState> & { devisList?: Devis[] };
        if (version < 2) {
          return { ...state, devisListPro: [], devisListLab: MOCK_DEVIS, devisList: [], theme: "dark", appMode: "pro" };
        }
        if (version < 3) {
          return { ...state, theme: state.theme ?? "dark", appMode: state.appMode ?? "pro" };
        }
        if (version < 4) {
          const mat = (state.materiel ?? DEFAULT_MATERIEL).map((m) => {
            const def = DEFAULT_MATERIEL.find((d) => d.id === m.id);
            return m.pricePerUnit !== undefined ? m : { ...m, pricePerUnit: def?.pricePerUnit ?? 0 };
          });
          return { ...state, materiel: mat };
        }
        if (version < 5) {
          // Migrer l'ancienne devisList vers les deux nouvelles listes
          const oldList: Devis[] = state.devisList ?? [];
          const mode = state.appMode ?? "pro";
          const proList = mode === "pro" ? oldList : [];
          const labList = mode === "lab" ? oldList : MOCK_DEVIS;
          return { ...state, devisListPro: proList, devisListLab: labList, devisList: mode === "pro" ? proList : labList };
        }
        return state as AppState;
      },
      partialize: (state) => ({
        // user intentionnellement absent — la session vit dans un cookie HttpOnly serveur
        devisListPro: state.devisListPro,
        devisListLab: state.devisListLab,
        devisList: state.devisList,
        theme: state.theme,
        themeId: state.themeId,
        accentColor: state.accentColor,
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
