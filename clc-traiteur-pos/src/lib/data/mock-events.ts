import { Devis } from "@/lib/types";

// Dates dynamiques pour que les KPIs soient toujours à jour
function d(monthOffset: number, day = 10): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 10, 0, 0).toISOString();
}

export const MOCK_DEVIS: Devis[] = [
  {
    id: "DV-047",
    clientName: "Rosalie Ekindi",
    clientPhone: "+33 6 43 71 28 94",
    eventDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString().split("T")[0],
    eventType: "Mariage",
    guestCount: 120,
    createdAt: d(0, 5),   // ce mois — semaine 1
    status: "Confirmé",
    items: [
      { dishId: 1,  dishName: "Ndolé",                  quantity: 120, unitPrice: 15, subtotal: 1800 },
      { dishId: 6,  dishName: "Porc Braisé",             quantity: 80,  unitPrice: 18, subtotal: 1440 },
      { dishId: 9,  dishName: "Poisson Braisé",          quantity: 60,  unitPrice: 17, subtotal: 1020 },
      { dishId: 15, dishName: "Plantain Frit",           quantity: 120, unitPrice: 7,  subtotal: 840  },
      { dishId: 18, dishName: "Jus Gingembre-Citron",    quantity: 120, unitPrice: 5,  subtotal: 600  },
    ],
    totalHT: 5700,
    totalTTC: 6840,
    notes: "Livraison le matin à 10h. Salle des fêtes de Montreuil.",
  },
  {
    id: "DV-051",
    clientName: "Aristide Biyong",
    clientPhone: "+33 7 82 35 64 17",
    eventDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split("T")[0],
    eventType: "Anniversaire",
    guestCount: 45,
    createdAt: d(0, 15),  // ce mois — semaine 2
    status: "Envoyé",
    items: [
      { dishId: 4,  dishName: "Poulet DG",  quantity: 45, unitPrice: 16, subtotal: 720 },
      { dishId: 2,  dishName: "Eru",        quantity: 45, unitPrice: 14, subtotal: 630 },
      { dishId: 14, dishName: "Riz Sauté",  quantity: 45, unitPrice: 10, subtotal: 450 },
      { dishId: 17, dishName: "Chin Chin",  quantity: 20, unitPrice: 5,  subtotal: 100 },
    ],
    totalHT: 1900,
    totalTTC: 2280,
    notes: "Menu surprise — ne pas divulguer au client.",
  },
  {
    id: "DV-055",
    clientName: "Chimène Fouda",
    clientPhone: "+33 6 12 88 43 76",
    eventDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split("T")[0],
    eventType: "Baptême",
    guestCount: 70,
    createdAt: d(-1, 8),  // mois précédent — semaine 1
    status: "Confirmé",
    items: [
      { dishId: 3,  dishName: "Mbongo Tchobi", quantity: 70, unitPrice: 16, subtotal: 1120 },
      { dishId: 7,  dishName: "Poulet Braisé", quantity: 35, unitPrice: 17, subtotal: 595  },
      { dishId: 11, dishName: "Koki",          quantity: 70, unitPrice: 8,  subtotal: 560  },
    ],
    totalHT: 2275,
    totalTTC: 2730,
    notes: "",
  },
  {
    id: "DV-039",
    clientName: "Théodore Mbarga",
    clientPhone: "+33 6 54 27 91 03",
    eventDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 20).toISOString().split("T")[0],
    eventType: "Séminaire",
    guestCount: 30,
    createdAt: d(-1, 20), // mois précédent — semaine 3
    status: "Confirmé",
    items: [
      { dishId: 1,  dishName: "Ndolé",       quantity: 30, unitPrice: 15, subtotal: 450 },
      { dishId: 13, dishName: "Sanga",        quantity: 30, unitPrice: 9,  subtotal: 270 },
      { dishId: 19, dishName: "Jus Bissap",   quantity: 30, unitPrice: 5,  subtotal: 150 },
    ],
    totalHT: 870,
    totalTTC: 1044,
    notes: "Plateau repas individuel. Livraison à 12h30 précises.",
  },
  {
    id: "DV-061",
    clientName: "Odette Nkolo",
    clientPhone: "+33 7 64 31 55 82",
    eventDate: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 5).toISOString().split("T")[0],
    eventType: "Réception",
    guestCount: 90,
    createdAt: d(-2, 15), // il y a 2 mois
    status: "Annulé",
    items: [
      { dishId: 8,  dishName: "Boeuf Braisé",  quantity: 90, unitPrice: 19, subtotal: 1710 },
      { dishId: 10, dishName: "Poisson Fumé",   quantity: 45, unitPrice: 14, subtotal: 630  },
    ],
    totalHT: 2340,
    totalTTC: 2808,
    notes: "Annulé — report à date inconnue.",
  },
];
