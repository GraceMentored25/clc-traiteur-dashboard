/** Icônes culinaires — SVG filled (lisibles à 21px, contrairement aux Lucide stroke). */

import type { DevisItem } from "@/lib/types";
import { DISHES } from "@/lib/data/dishes";

function icon(path: string): string {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="${path}"/></svg>`;
}

/** Verre cocktail (apéritif / vin d'honneur) — forme pleine, pas de flûtes croisées. */
export const APERITIF_ICON = icon(
  "M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z"
);

/** Barbecue / grillades (viandes et poissons grillés). */
export const GRILL_ICON = icon(
  "M17 5c0-1.1-.9-2-2-2H9C7.9 3 7 3.9 7 5v1H4v2h1v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8h1V6h-3V5zm-8 0h6v1H9V5zm9 13H6V8h12v10zM8 10h2v6H8v-6zm3 0h2v6h-2v-6zm3 0h2v6h-2v-6z"
);

/** Marmite (plats cuisinés / repas). */
export const PLAT_CUISINES_ICON = icon(
  "M3 10v2h2v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h2v-2H3zm4 2h10v7H7v-7zM8 6V4h2V2h4v2h2v2H8z"
);

/** Assiette (accompagnements). */
export const ACCOMPAGNEMENTS_ICON = icon(
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-3c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z"
);

const CATEGORY_ICONS: Record<string, string> = {
  "Apéritifs": APERITIF_ICON,
  "Grillades": GRILL_ICON,
  "Accompagnements": ACCOMPAGNEMENTS_ICON,
  "Entrées & légumes frais": icon("M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"),
  "Veloutés & potages": icon("M2 12h20c0 5.52-4.48 10-10 10S2 17.52 2 12zm2.05-1C4.56 6.91 8.03 4 12 4s7.44 2.91 7.95 7H4.05z"),
  "Plats cuisinés": PLAT_CUISINES_ICON,
  "Viandes": GRILL_ICON,
  "Poissons": icon("M19.5 12c.9-2.6-.2-5.4-2.5-6.9C14.7 3.6 11 3.2 8 4.5 5.8 5.5 4.1 7.4 3 9.7c1.3.4 2.4 1.5 2.8 2.9-.4 1.4-1.5 2.5-2.8 2.9 1.1 2.3 2.8 4.2 5 5.2 3 1.3 6.7.9 9-1.6 2.3-1.5 3.4-4.3 2.5-6.9zM16 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"),
  "Desserts & pâtisseries": icon("M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm6 3h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9c0-1.66-1.34-3-3-3z"),
  "Boissons & cocktails": icon("M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z"),
  "Eaux & boissons fraîches": icon("M18 2H6l1.5 16.5A2.5 2.5 0 0 0 10 21h4a2.5 2.5 0 0 0 2.5-2.5L18 2zm-2.15 8H8.15L7.7 6h8.6l-.45 4z"),
  "Cafés, thés & infusions": icon("M2 21h18v-2H2v2zM20 8h-2V5H4v8c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1h2c1.11 0 2-.89 2-2V10c0-1.11-.89-2-2-2zm0 3h-2v-1h2v1z"),
  "Boulangerie & brunch": icon("M5 9.2C5 6.9 8.1 5 12 5s7 1.9 7 4.2V16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V9.2zM7 9h10c0-.8-2.1-2-5-2S7 8.2 7 9z"),
  "Fruits & frais": icon("M17.2 8.02c-.7-.7-1.6-1.1-2.5-1.2.3-1.2 0-2.5-.8-3.5L12.5 2c-.2 1.5-1 2.8-2.2 3.6C8.7 6.5 7 8.2 7 10.5c0 3.3 2.2 7.5 5 7.5s5-4.2 5-7.5c0-.9-.3-1.7-.8-2.48zM12 20c-1.1 0-2.2-.3-3.2-.8.6 1.7 2.2 2.8 4 2.8h.2c.1-.7.2-1.3.2-2 0 0-.7 0-1.2 0z"),
};

const DISH_LEGEND_MAP: Record<string, string> = {
  "légumes glacés de saison": "Entrées & légumes frais",
  "verrines avocat-crevettes": "Entrées & légumes frais",
  "salade fraîcheur": "Entrées & légumes frais",
  "riz pilaf aux légumes": "Entrées & légumes frais",
  "salade verte & crudités": "Entrées & légumes frais",
  "verrines gourmandes": "Entrées & légumes frais",
  "légumes sautés": "Entrées & légumes frais",
  "velouté de légumes de saison": "Veloutés & potages",
  "brochettes de crevettes marinées": "Plats cuisinés",
  "accras de morue & sauce aïoli": "Plats cuisinés",
  "riz parfumé aux épices": "Plats cuisinés",
  "mini quiches assorties": "Plats cuisinés",
  "œufs brouillés aux herbes": "Plats cuisinés",
  "canapés variés": "Plats cuisinés",
  "brochettes mixtes": "Plats cuisinés",
  "riz aux herbes": "Plats cuisinés",
  "sauces maison": "Plats cuisinés",
  "mini samoussas au bœuf": "Viandes",
  "brochettes de poulet yakitori": "Viandes",
  "jollof rice au poulet": "Viandes",
  "mafé de bœuf": "Viandes",
  "mini wraps au poulet": "Viandes",
  "poulet grillé sauce moutarde": "Grillades",
  "porc braisé": "Grillades",
  "poulet braisé": "Grillades",
  "boeuf braisé": "Grillades",
  "poisson braisé": "Grillades",
  "filet de bar sauce beurre blanc": "Poissons",
  "attiéké & poisson braisé": "Grillades",
  "poisson braisé façon du chef": "Grillades",
  "pièce montée vanille & fruits rouges": "Desserts & pâtisseries",
  "mignardises assorties": "Desserts & pâtisseries",
  "gâteau d’anniversaire personnalisé": "Desserts & pâtisseries",
  "mini pâtisseries assorties": "Desserts & pâtisseries",
  "cupcakes décorés": "Desserts & pâtisseries",
  "macarons variés": "Desserts & pâtisseries",
  "sucettes chocolatées": "Desserts & pâtisseries",
  "tartelette aux fruits": "Desserts & pâtisseries",
  "pâtisseries miniatures": "Desserts & pâtisseries",
  "assiette de desserts": "Desserts & pâtisseries",
  "jus de bissap & gingembre": "Boissons & cocktails",
  "cocktails sans alcool": "Boissons & cocktails",
  "jus naturels": "Boissons & cocktails",
  "vins & cocktails maison": "Boissons & cocktails",
  "digestifs": "Boissons & cocktails",
  "jus naturels & eaux": "Eaux & boissons fraîches",
  "eau aromatisée": "Eaux & boissons fraîches",
  "café & infusions": "Cafés, thés & infusions",
  "jus naturels & infusions": "Cafés, thés & infusions",
  "café, thé & eau": "Cafés, thés & infusions",
  "mini viennoiseries": "Boulangerie & brunch",
  "pancakes & sirop d’érable": "Boulangerie & brunch",
  "pain & condiments": "Boulangerie & brunch",
  "brochettes de fruits": "Fruits & frais",
  "yaourts & granola": "Fruits & frais",
  "salade de fruits exotiques": "Fruits & frais",
  "fruits de saison": "Fruits & frais",
  "fruits secs": "Fruits & frais",
  "fruits frais": "Fruits & frais",
  "nems": "Apéritifs",
  "pastel": "Apéritifs",
  "beignets de maïs": "Apéritifs",
  "beignets de mais": "Apéritifs",
  "crêpes sucrées": "Apéritifs",
  "crepes sucrees": "Apéritifs",
  "crêpes salées": "Apéritifs",
  "crepes salees": "Apéritifs",
  "brochettes plantain boulettes": "Apéritifs",
  "croquettes": "Apéritifs",
  "riz sauté": "Accompagnements",
  "riz saute": "Accompagnements",
  "plantain frit": "Accompagnements",
  "couscous de manioc": "Accompagnements",
  "bobolo": "Accompagnements",
  "riz cantonais": "Accompagnements",
  "frites de pommes": "Accompagnements",
  "couscous tapioca": "Accompagnements",
};

const DISH_CATEGORY = new Map(DISHES.map((d) => [d.id, d.category]));
const SERVICE_DISH_IDS = new Set(DISHES.filter((d) => d.category === "Services").map((d) => d.id));

const CATEGORY_TO_LEGEND: Record<string, string> = {
  "Entrées": "Entrées & légumes frais",
  "Apéritif": "Apéritifs",
  "Repas": "Plats cuisinés",
  "Grillades": "Grillades",
  "Accompagnements": "Accompagnements",
  "Desserts": "Desserts & pâtisseries",
  "Cocktails & Boissons": "Boissons & cocktails",
};


const SERVICE_NAME_RE =
  /serveur|marmite|service de table|tente|chapiteau|chaise|déco|décoration|transport|livraison|sono|animation|photographe/i;
const SERVICE_SECTION_RE = /^services?$/i;

function normalizeKey(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Prestation additionnelle : catégorie Services ou section « Service(s) » de l'application. */
export function isServiceItem(item: DevisItem): boolean {
  if (item.section && (SERVICE_SECTION_RE.test(item.section) || item.section === "__services__")) {
    return true;
  }
  if (SERVICE_DISH_IDS.has(item.dishId)) return true;
  return SERVICE_NAME_RE.test(item.dishName);
}

function inferLegendCategory(dishName: string, dishId?: number): string {
  const normalized = normalizeKey(dishName);

  if (DISH_LEGEND_MAP[normalized]) return DISH_LEGEND_MAP[normalized];

  for (const [key, cat] of Object.entries(DISH_LEGEND_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return cat;
  }

  const n = normalized;
  // Grillades (viandes & poissons au barbecue) avant les catégories génériques
  if (/brais[eé]|grill[eé]|grille|yakitori|brochette/.test(n)) return "Grillades";
  if (/poisson|tilapia|bar|attieke|thon/.test(n)) return "Poissons";
  if (/jus|bissap|cocktail|gingembre/.test(n)) return "Boissons & cocktails";
  if (/gateau|crepe|caramel|dessert|chinchin|patisserie/.test(n)) return "Desserts & pâtisseries";
  if (/cafe|the|infusion/.test(n)) return "Cafés, thés & infusions";
  if (/fruit/.test(n)) return "Fruits & frais";
  if (/nem|pastel|beignet|crepe|croquette|chinchin|bouchée|bouchee|canapé|canape/.test(n)) return "Apéritifs";
  if (/bobolo|plantain frit|riz cantonais|riz sauté|riz saute|couscous|frites de pomme|frites/.test(n)) return "Accompagnements";

  // Catalogue applicatif
  if (dishId) {
    const cat = DISH_CATEGORY.get(dishId);
    if (cat && CATEGORY_TO_LEGEND[cat]) return CATEGORY_TO_LEGEND[cat];
  }

  if (/ndole|eru|okok|koki|mbongo|sanga|mafé|jollof/.test(n)) return "Plats cuisinés";
  if (/riz|plantain|tapioca/.test(n)) return "Accompagnements";
  if (/porc|boeuf|poulet|viande|samoussa|yakitori/.test(n)) return "Viandes";
  if (/crudite|plateau|entree|salade|nem|pastel|beignet|brochette/.test(n)) return "Entrées & légumes frais";

  return "Plats cuisinés";
}

/** Retourne le SVG d'icône menu du template pour un plat donné. */
export function getDishIcon(dishName: string, dishId?: number): string {
  const cat = inferLegendCategory(dishName, dishId);
  return CATEGORY_ICONS[cat] ?? CATEGORY_ICONS["Plats cuisinés"];
}

export function getDishUnit(dishId: number): string {
  return DISHES.find((d) => d.id === dishId)?.unit ?? "unité";
}