/** Hiérarchie sous-onglets / sous-titres — partagée UI devis + PDF */

export type SubGroup = {
  label: string;
  categories: readonly string[];
};

export type SubSection = {
  label: string;
  categories: readonly string[];
  subGroups?: readonly SubGroup[];
};

export const SUBSECTION_MAP: readonly SubSection[] = [
  { label: "Entrées", categories: ["Entrées"] },
  {
    label: "Repas",
    categories: ["Repas", "Grillades", "Accompagnements"],
    subGroups: [
      { label: "Repas (accompagnements inclus)", categories: ["Repas"] },
      { label: "Grillades", categories: ["Grillades"] },
      { label: "Accompagnements", categories: ["Accompagnements"] },
    ],
  },
  { label: "Desserts", categories: ["Desserts"] },
  { label: "Boissons", categories: ["Cocktails & Boissons"] },
  { label: "Services", categories: ["Services"] },
];

export const ALL_KNOWN_CATEGORIES = SUBSECTION_MAP.flatMap((s) => s.categories);
