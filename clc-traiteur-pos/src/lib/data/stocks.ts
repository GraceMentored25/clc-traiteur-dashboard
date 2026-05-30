import { Ingredient, Materiel, Recipe } from "@/lib/types";

// ── Ingrédients de base ───────────────────────────────────────────────────
export const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: "poulet", name: "Poulet entier", unit: "kg", pricePerUnit: 6.5, stockQty: 0 },
  { id: "boeuf", name: "Boeuf (côtes)", unit: "kg", pricePerUnit: 14, stockQty: 0 },
  { id: "porc", name: "Porc (échine)", unit: "kg", pricePerUnit: 9, stockQty: 0 },
  { id: "tilapia", name: "Tilapia frais", unit: "kg", pricePerUnit: 8, stockQty: 0 },
  { id: "poisson-fume", name: "Poisson fumé", unit: "kg", pricePerUnit: 12, stockQty: 0 },
  { id: "ndole-feuilles", name: "Feuilles de ndolé", unit: "kg", pricePerUnit: 7, stockQty: 0 },
  { id: "eru-feuilles", name: "Feuilles d'eru", unit: "kg", pricePerUnit: 8, stockQty: 0 },
  { id: "okok-feuilles", name: "Feuilles d'okok", unit: "kg", pricePerUnit: 6, stockQty: 0 },
  { id: "arachides", name: "Pâte d'arachides", unit: "kg", pricePerUnit: 5, stockQty: 0 },
  { id: "huile-palme", name: "Huile de palme", unit: "L", pricePerUnit: 4, stockQty: 0 },
  { id: "huile-tournesol", name: "Huile de tournesol", unit: "L", pricePerUnit: 3, stockQty: 0 },
  { id: "riz", name: "Riz blanc", unit: "kg", pricePerUnit: 2, stockQty: 0 },
  { id: "manioc", name: "Manioc", unit: "kg", pricePerUnit: 2.5, stockQty: 0 },
  { id: "plantain", name: "Plantain mûr", unit: "kg", pricePerUnit: 2, stockQty: 0 },
  { id: "haricots", name: "Haricots blancs", unit: "kg", pricePerUnit: 3, stockQty: 0 },
  { id: "mais", name: "Maïs", unit: "kg", pricePerUnit: 2, stockQty: 0 },
  { id: "tomates", name: "Tomates fraîches", unit: "kg", pricePerUnit: 2.5, stockQty: 0 },
  { id: "oignons", name: "Oignons", unit: "kg", pricePerUnit: 2, stockQty: 0 },
  { id: "ail", name: "Ail", unit: "kg", pricePerUnit: 8, stockQty: 0 },
  { id: "gingembre", name: "Gingembre frais", unit: "kg", pricePerUnit: 6, stockQty: 0 },
  { id: "citron", name: "Citron", unit: "pièce", pricePerUnit: 0.3, stockQty: 0 },
  { id: "bissap", name: "Fleurs de bissap", unit: "kg", pricePerUnit: 15, stockQty: 0 },
  { id: "epices-melange", name: "Épices mélange camerounais", unit: "kg", pricePerUnit: 20, stockQty: 0 },
  { id: "sel", name: "Sel", unit: "kg", pricePerUnit: 1, stockQty: 0 },
  { id: "poivre", name: "Poivre noir", unit: "kg", pricePerUnit: 18, stockQty: 0 },
  { id: "miel", name: "Miel", unit: "kg", pricePerUnit: 12, stockQty: 0 },
  { id: "farine", name: "Farine de blé", unit: "kg", pricePerUnit: 1.5, stockQty: 0 },
  { id: "sucre", name: "Sucre", unit: "kg", pricePerUnit: 1.5, stockQty: 0 },
  { id: "muscade", name: "Noix de muscade", unit: "kg", pricePerUnit: 30, stockQty: 0 },
  { id: "graines-melon", name: "Graines de melon (egusi)", unit: "kg", pricePerUnit: 10, stockQty: 0 },
  { id: "crevettes", name: "Crevettes fumées", unit: "kg", pricePerUnit: 25, stockQty: 0 },
];

// ── Recettes par plat ─────────────────────────────────────────────────────
// qtyPerPerson = quantité de l'ingrédient par convive
export const RECIPES: Recipe[] = [
  {
    dishId: 1, dishName: "Ndolé",
    ingredients: [
      { ingredientId: "ndole-feuilles", qtyPerPerson: 0.08 },
      { ingredientId: "arachides", qtyPerPerson: 0.05 },
      { ingredientId: "crevettes", qtyPerPerson: 0.03 },
      { ingredientId: "huile-palme", qtyPerPerson: 0.02 },
      { ingredientId: "oignons", qtyPerPerson: 0.02 },
      { ingredientId: "ail", qtyPerPerson: 0.005 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 2, dishName: "Eru",
    ingredients: [
      { ingredientId: "eru-feuilles", qtyPerPerson: 0.08 },
      { ingredientId: "poisson-fume", qtyPerPerson: 0.04 },
      { ingredientId: "huile-palme", qtyPerPerson: 0.03 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 3, dishName: "Mbongo Tchobi",
    ingredients: [
      { ingredientId: "tilapia", qtyPerPerson: 0.2 },
      { ingredientId: "tomates", qtyPerPerson: 0.05 },
      { ingredientId: "oignons", qtyPerPerson: 0.02 },
      { ingredientId: "epices-melange", qtyPerPerson: 0.01 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 4, dishName: "Poulet DG",
    ingredients: [
      { ingredientId: "poulet", qtyPerPerson: 0.25 },
      { ingredientId: "plantain", qtyPerPerson: 0.15 },
      { ingredientId: "tomates", qtyPerPerson: 0.05 },
      { ingredientId: "oignons", qtyPerPerson: 0.02 },
      { ingredientId: "ail", qtyPerPerson: 0.005 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 5, dishName: "Okok",
    ingredients: [
      { ingredientId: "okok-feuilles", qtyPerPerson: 0.08 },
      { ingredientId: "graines-melon", qtyPerPerson: 0.04 },
      { ingredientId: "huile-palme", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 6, dishName: "Porc Braisé",
    ingredients: [
      { ingredientId: "porc", qtyPerPerson: 0.3 },
      { ingredientId: "epices-melange", qtyPerPerson: 0.01 },
      { ingredientId: "ail", qtyPerPerson: 0.005 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.01 },
    ],
  },
  {
    dishId: 7, dishName: "Poulet Braisé",
    ingredients: [
      { ingredientId: "poulet", qtyPerPerson: 0.3 },
      { ingredientId: "epices-melange", qtyPerPerson: 0.01 },
      { ingredientId: "ail", qtyPerPerson: 0.005 },
      { ingredientId: "gingembre", qtyPerPerson: 0.005 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 8, dishName: "Boeuf Braisé",
    ingredients: [
      { ingredientId: "boeuf", qtyPerPerson: 0.3 },
      { ingredientId: "epices-melange", qtyPerPerson: 0.01 },
      { ingredientId: "oignons", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 9, dishName: "Poisson Braisé",
    ingredients: [
      { ingredientId: "tilapia", qtyPerPerson: 0.25 },
      { ingredientId: "tomates", qtyPerPerson: 0.04 },
      { ingredientId: "epices-melange", qtyPerPerson: 0.01 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 10, dishName: "Poisson Fumé",
    ingredients: [
      { ingredientId: "poisson-fume", qtyPerPerson: 0.15 },
      { ingredientId: "tomates", qtyPerPerson: 0.04 },
      { ingredientId: "oignons", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 11, dishName: "Koki",
    ingredients: [
      { ingredientId: "haricots", qtyPerPerson: 0.1 },
      { ingredientId: "huile-palme", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 12, dishName: "Beignets Haricots",
    ingredients: [
      { ingredientId: "haricots", qtyPerPerson: 0.08 },
      { ingredientId: "oignons", qtyPerPerson: 0.01 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.03 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 13, dishName: "Sanga",
    ingredients: [
      { ingredientId: "mais", qtyPerPerson: 0.08 },
      { ingredientId: "haricots", qtyPerPerson: 0.05 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
      { ingredientId: "poivre", qtyPerPerson: 0.002 },
    ],
  },
  {
    dishId: 14, dishName: "Riz Sauté",
    ingredients: [
      { ingredientId: "riz", qtyPerPerson: 0.1 },
      { ingredientId: "poulet", qtyPerPerson: 0.05 },
      { ingredientId: "tomates", qtyPerPerson: 0.03 },
      { ingredientId: "oignons", qtyPerPerson: 0.02 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.02 },
      { ingredientId: "sel", qtyPerPerson: 0.005 },
    ],
  },
  {
    dishId: 15, dishName: "Plantain Frit",
    ingredients: [
      { ingredientId: "plantain", qtyPerPerson: 0.2 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.03 },
      { ingredientId: "sel", qtyPerPerson: 0.003 },
    ],
  },
  {
    dishId: 16, dishName: "Couscous de Manioc",
    ingredients: [
      { ingredientId: "manioc", qtyPerPerson: 0.15 },
      { ingredientId: "sel", qtyPerPerson: 0.003 },
    ],
  },
  {
    dishId: 17, dishName: "Chin Chin",
    ingredients: [
      { ingredientId: "farine", qtyPerPerson: 0.06 },
      { ingredientId: "sucre", qtyPerPerson: 0.02 },
      { ingredientId: "muscade", qtyPerPerson: 0.002 },
      { ingredientId: "huile-tournesol", qtyPerPerson: 0.03 },
    ],
  },
  {
    dishId: 18, dishName: "Jus Gingembre-Citron",
    ingredients: [
      { ingredientId: "gingembre", qtyPerPerson: 0.03 },
      { ingredientId: "citron", qtyPerPerson: 0.5 },
      { ingredientId: "miel", qtyPerPerson: 0.02 },
      { ingredientId: "sucre", qtyPerPerson: 0.02 },
    ],
  },
  {
    dishId: 19, dishName: "Jus Bissap",
    ingredients: [
      { ingredientId: "bissap", qtyPerPerson: 0.015 },
      { ingredientId: "gingembre", qtyPerPerson: 0.01 },
      { ingredientId: "sucre", qtyPerPerson: 0.03 },
    ],
  },
];

// ── Matériel de base ──────────────────────────────────────────────────────
export const DEFAULT_MATERIEL: Materiel[] = [
  { id: "marmite-chauffe", name: "Marmite chauffante", unit: "unité", stockQty: 0, pricePerUnit: 45 },
  { id: "bain-marie", name: "Bain-marie électrique", unit: "unité", stockQty: 0, pricePerUnit: 60 },
  { id: "plaque-chauff", name: "Plaque chauffante", unit: "unité", stockQty: 0, pricePerUnit: 35 },
  { id: "gaziniere", name: "Gazinière portable", unit: "unité", stockQty: 0, pricePerUnit: 50 },
  { id: "bouteille-gaz", name: "Bouteille de gaz", unit: "unité", stockQty: 0, pricePerUnit: 25 },
  { id: "grande-marmite", name: "Grande marmite 40L", unit: "unité", stockQty: 0, pricePerUnit: 40 },
  { id: "bassine", name: "Bassine inox", unit: "unité", stockQty: 0, pricePerUnit: 12 },
  { id: "louche", name: "Louche de service", unit: "unité", stockQty: 0, pricePerUnit: 5 },
  { id: "assiette-service", name: "Assiette de service", unit: "unité", stockQty: 0, pricePerUnit: 1.5 },
  { id: "couvert-service", name: "Couverts de service", unit: "set", stockQty: 0, pricePerUnit: 3 },
  { id: "nappe", name: "Nappe de table", unit: "unité", stockQty: 0, pricePerUnit: 8 },
  { id: "tente-reception", name: "Tente de réception", unit: "unité", stockQty: 0, pricePerUnit: 150 },
  { id: "table-pliante", name: "Table pliante", unit: "unité", stockQty: 0, pricePerUnit: 15 },
  { id: "chaise-pliante", name: "Chaise pliante", unit: "unité", stockQty: 0, pricePerUnit: 4 },
  { id: "panneau-deco", name: "Panneau de décoration", unit: "unité", stockQty: 0, pricePerUnit: 30 },
  { id: "centrepiece", name: "Centrepiece floral", unit: "unité", stockQty: 0, pricePerUnit: 20 },
  { id: "lumiere-deco", name: "Éclairage décoratif", unit: "set", stockQty: 0, pricePerUnit: 50 },
  { id: "sono", name: "Système sonore", unit: "unité", stockQty: 0, pricePerUnit: 120 },
  { id: "sac-poubelle", name: "Sac poubelle 100L", unit: "rouleau", stockQty: 0, pricePerUnit: 6 },
  { id: "gants-cuisine", name: "Gants de cuisine", unit: "paire", stockQty: 0, pricePerUnit: 2 },
];

// ── Logistique par type d'événement ──────────────────────────────────────
export const LOGISTIQUE_PAR_EVENEMENT: Record<string, Array<{ name: string; qtyBase: number; unit: string; note?: string }>> = {
  default: [
    { name: "Grande marmite 40L", qtyBase: 1, unit: "unité" },
    { name: "Plaque chauffante", qtyBase: 1, unit: "unité" },
    { name: "Bouteille de gaz", qtyBase: 2, unit: "unité" },
    { name: "Louche de service", qtyBase: 4, unit: "unité" },
    { name: "Gants de cuisine", qtyBase: 6, unit: "paire" },
    { name: "Sac poubelle 100L", qtyBase: 1, unit: "rouleau" },
  ],
  Mariage: [
    { name: "Tente de réception", qtyBase: 1, unit: "unité", note: "À réserver" },
    { name: "Table pliante", qtyBase: 10, unit: "unité", note: "Selon nombre de convives" },
    { name: "Chaise pliante", qtyBase: 1, unit: "par convive" },
    { name: "Nappe de table", qtyBase: 10, unit: "unité" },
    { name: "Centrepiece floral", qtyBase: 10, unit: "unité" },
    { name: "Panneau de décoration", qtyBase: 3, unit: "unité" },
    { name: "Éclairage décoratif", qtyBase: 2, unit: "set" },
    { name: "Système sonore", qtyBase: 1, unit: "unité", note: "À louer" },
    { name: "Marmite chauffante", qtyBase: 4, unit: "unité" },
    { name: "Bain-marie électrique", qtyBase: 2, unit: "unité" },
    { name: "Assiette de service", qtyBase: 1, unit: "par convive" },
    { name: "Couverts de service", qtyBase: 1, unit: "set" },
  ],
  Anniversaire: [
    { name: "Table pliante", qtyBase: 5, unit: "unité" },
    { name: "Chaise pliante", qtyBase: 1, unit: "par convive" },
    { name: "Nappe de table", qtyBase: 5, unit: "unité" },
    { name: "Panneau de décoration", qtyBase: 2, unit: "unité" },
    { name: "Éclairage décoratif", qtyBase: 1, unit: "set" },
    { name: "Marmite chauffante", qtyBase: 2, unit: "unité" },
    { name: "Assiette de service", qtyBase: 1, unit: "par convive" },
  ],
  Baptême: [
    { name: "Table pliante", qtyBase: 4, unit: "unité" },
    { name: "Chaise pliante", qtyBase: 1, unit: "par convive" },
    { name: "Nappe de table", qtyBase: 4, unit: "unité" },
    { name: "Centrepiece floral", qtyBase: 4, unit: "unité" },
    { name: "Marmite chauffante", qtyBase: 2, unit: "unité" },
  ],
  Séminaire: [
    { name: "Table pliante", qtyBase: 6, unit: "unité" },
    { name: "Chaise pliante", qtyBase: 1, unit: "par convive" },
    { name: "Nappe de table", qtyBase: 6, unit: "unité" },
    { name: "Marmite chauffante", qtyBase: 2, unit: "unité" },
    { name: "Système sonore", qtyBase: 1, unit: "unité", note: "Micro + enceinte" },
  ],
  Réception: [
    { name: "Tente de réception", qtyBase: 1, unit: "unité", note: "À réserver" },
    { name: "Table pliante", qtyBase: 8, unit: "unité" },
    { name: "Chaise pliante", qtyBase: 1, unit: "par convive" },
    { name: "Nappe de table", qtyBase: 8, unit: "unité" },
    { name: "Centrepiece floral", qtyBase: 8, unit: "unité" },
    { name: "Panneau de décoration", qtyBase: 4, unit: "unité" },
    { name: "Éclairage décoratif", qtyBase: 2, unit: "set" },
    { name: "Marmite chauffante", qtyBase: 3, unit: "unité" },
    { name: "Bain-marie électrique", qtyBase: 2, unit: "unité" },
    { name: "Assiette de service", qtyBase: 1, unit: "par convive" },
  ],
};
