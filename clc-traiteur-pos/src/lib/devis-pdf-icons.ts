/** Icônes culinaires extraites de la page légende du template devis_modele.html */

import type { DevisItem } from "@/lib/types";
import { DISHES } from "@/lib/data/dishes";

/** Deux flûtes à champagne croisées (apéritif / vin d'honneur). */
export const APERITIF_ICON =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">' +
  '<path d="M6 2h2.2l-1.3 8.2-.1 1.1 9.4 8.1c.35.3.25.85-.2 1.05l-.75.35c-.5.22-1.08-.05-1.28-.58L5.6 11.1 6 2z"/>' +
  '<path d="M15.8 2h2.2l1.3 8.2.1 1.1-9.4 8.1c-.35.3-.25.85.2 1.05l.75.35c.5.22 1.08-.05 1.28-.58L18.4 11.1 17.8 2z"/>' +
  "</svg>";

/** Barbecue / grillades (viandes et poissons grillés). */
export const GRILL_ICON =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">' +
  '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
  '<path d="M5.8 9.2 18.2 18.8M4.2 12.4 19.8 16.6" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".55"/>' +
  '<path d="M8.6 8.4h1.7v8.4H8.6zm2.2-.7h1.7v9.1h-1.7zm2.2.3h1.7v8.4h-1.7z"/>' +
  '<path d="M9.1 10.2h.9M9.1 12h.9M9.1 13.8h.9M11.3 9.8h.9M11.3 11.6h.9M11.3 13.4h.9M13.5 10.4h.9M13.5 12.2h.9M13.5 14h.9" opacity=".45"/>' +
  "</svg>";

const CATEGORY_ICONS: Record<string, string> = {
  "Apéritifs": APERITIF_ICON,
  "Grillades": GRILL_ICON,
  "Accompagnements": '<svg aria-hidden="true" focusable="false" class="lucide lucide-wheat" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M15.47 8.53 17 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L17 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M19.47 12.53 21 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L21 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/></svg>',
  "Entrées & légumes frais": '<svg aria-hidden="true" focusable="false" class="lucide lucide-salad" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M7 21h10" /> <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /> <path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1" /> <path d="m13 12 4-4" /> <path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" /> </svg>',
  "Veloutés & potages": '<svg aria-hidden="true" focusable="false" class="lucide lucide-soup" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /> <path d="M7 21h10" /> <path d="M19.5 12 22 6" /> <path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62" /> <path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62" /> <path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62" /> </svg>',
  "Plats cuisinés": '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M3 10v2h2v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h2v-2zm4 2h10v7H7z"/></svg>',
  "Viandes": GRILL_ICON,
  "Poissons": GRILL_ICON,
  "Desserts & pâtisseries": '<svg aria-hidden="true" focusable="false" class="lucide lucide-cake-slice" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M16 13H3" /> <path d="M16 17H3" /> <path d="m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6" /> <circle cx="9" cy="7" r="2" /> </svg>',
  "Boissons & cocktails": '<svg aria-hidden="true" focusable="false" class="lucide lucide-martini" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z" /> <path d="M12 12v10" /> <path d="M7 22h10" /> </svg>',
  "Eaux & boissons fraîches": '<svg aria-hidden="true" focusable="false" class="lucide lucide-glass-water" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" /> <path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" /> </svg>',
  "Cafés, thés & infusions": '<svg aria-hidden="true" focusable="false" class="lucide lucide-coffee" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 2v2" /> <path d="M14 2v2" /> <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" /> <path d="M6 2v2" /> </svg>',
  "Boulangerie & brunch": '<svg aria-hidden="true" focusable="false" class="lucide lucide-croissant" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487" /> <path d="M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132" /> <path d="M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42" /> <path d="M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14" /> <path d="M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676" /> </svg>',
  "Fruits & frais": '<svg aria-hidden="true" focusable="false" class="lucide lucide-apple" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 6.528V3a1 1 0 0 1 1-1h0" /> <path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" /> </svg>',
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

/** Icône assiette du template (légende « Plats cuisinés »). */
export const PLAT_CUISINES_ICON = CATEGORY_ICONS["Plats cuisinés"];

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