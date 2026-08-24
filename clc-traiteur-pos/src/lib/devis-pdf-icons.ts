/** Icônes culinaires extraites de la page légende du template devis_modele.html */

import type { DevisItem } from "@/lib/types";
import { DISHES } from "@/lib/data/dishes";

const CATEGORY_ICONS: Record<string, string> = {
  "Entrées & légumes frais": '<svg aria-hidden="true" focusable="false" class="lucide lucide-salad" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M7 21h10" /> <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /> <path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1" /> <path d="m13 12 4-4" /> <path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" /> </svg>',
  "Veloutés & potages": '<svg aria-hidden="true" focusable="false" class="lucide lucide-soup" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /> <path d="M7 21h10" /> <path d="M19.5 12 22 6" /> <path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62" /> <path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62" /> <path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62" /> </svg>',
  "Plats cuisinés": '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M3 10v2h2v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h2v-2zm4 2h10v7H7z"/></svg>',
  "Viandes": '<svg aria-hidden="true" focusable="false" class="lucide lucide-beef" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3" /> <path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1-2.29 7.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" /> <circle cx="12.5" cy="8.5" r="2.5" /> </svg>',
  "Poissons": '<svg aria-hidden="true" focusable="false" class="lucide lucide-fish" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" /> <path d="M18 12v.5" /> <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" /> <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" /> <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" /> <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" /> </svg>',
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
  "poulet grillé sauce moutarde": "Viandes",
  "filet de bar sauce beurre blanc": "Poissons",
  "attiéké & poisson braisé": "Poissons",
  "poisson braisé façon du chef": "Poissons",
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
};

const DISH_CATEGORY = new Map(DISHES.map((d) => [d.id, d.category]));
const SERVICE_DISH_IDS = new Set(DISHES.filter((d) => d.category === "Services").map((d) => d.id));

const CATEGORY_TO_LEGEND: Record<string, string> = {
  "Entrées": "Entrées & légumes frais",
  "Apéritif": "Plats cuisinés",
  "Repas": "Plats cuisinés",
  "Grillades": "Viandes",
  "Accompagnements": "Plats cuisinés",
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
  if (/poisson|tilapia|bar|attieke/.test(n)) return "Poissons";
  if (/jus|bissap|cocktail|gingembre/.test(n)) return "Boissons & cocktails";
  if (/gateau|crepe|caramel|dessert|chinchin|patisserie/.test(n)) return "Desserts & pâtisseries";
  if (/braise|grille|porc|boeuf|poulet|viande|ndole|eru|okok|koki|mbongo|sanga/.test(n)) return "Viandes";
  if (/riz|plantain|bobolo|couscous|tapioca|frites/.test(n)) return "Plats cuisinés";
  if (/crudite|plateau|entree|salade|nem|pastel|beignet|brochette/.test(n)) return "Entrées & légumes frais";
  if (/cafe|the|infusion/.test(n)) return "Cafés, thés & infusions";
  if (/fruit/.test(n)) return "Fruits & frais";

  if (dishId) {
    const cat = DISH_CATEGORY.get(dishId);
    if (cat && CATEGORY_TO_LEGEND[cat]) return CATEGORY_TO_LEGEND[cat];
  }

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