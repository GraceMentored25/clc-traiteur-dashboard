export interface EventSubMoment {
  id: string;
  label: string;
}

export interface EventType {
  id: string;
  label: string;
  subMoments: EventSubMoment[];
}

export const EVENT_TYPES: EventType[] = [
  {
    id: "mariage",
    label: "Mariage",
    subMoments: [
      { id: "rencontre-familles", label: "Rencontre des familles" },
      { id: "vin-honneur",        label: "Vin d'honneur" },
      { id: "soiree",             label: "Soirée" },
      { id: "brunch",             label: "Brunch" },
      { id: "autre-moment",       label: "Autres moments de restauration" },
    ],
  },
  {
    id: "anniversaire",
    label: "Anniversaire",
    subMoments: [
      { id: "apero",        label: "Apéritif" },
      { id: "buffet",       label: "Buffet" },
      { id: "dessert",      label: "Dessert & gâteau" },
      { id: "after",        label: "After-party" },
    ],
  },
  {
    id: "bapteme",
    label: "Baptême / Baby shower",
    subMoments: [
      { id: "vin-honneur",  label: "Vin d'honneur" },
      { id: "dejeuner",     label: "Déjeuner" },
      { id: "gouter",       label: "Goûter" },
      { id: "buffet",       label: "Buffet froid" },
    ],
  },
  {
    id: "seminaire",
    label: "Séminaire / Entreprise",
    subMoments: [
      { id: "pause-cafe",   label: "Pause café & viennoiseries" },
      { id: "dejeuner",     label: "Déjeuner d'affaires" },
      { id: "cocktail",     label: "Cocktail dinatoire" },
      { id: "gala",         label: "Dîner de gala" },
    ],
  },
  {
    id: "reception",
    label: "Réception privée",
    subMoments: [
      { id: "apero",        label: "Apéritif" },
      { id: "diner",        label: "Dîner" },
      { id: "dessert",      label: "Dessert" },
      { id: "after",        label: "After" },
    ],
  },
  {
    id: "autre",
    label: "Autre événement",
    subMoments: [
      { id: "moment-1",     label: "Moment 1" },
      { id: "moment-2",     label: "Moment 2" },
      { id: "moment-3",     label: "Moment 3" },
      { id: "moment-autre", label: "Autre moment" },
    ],
  },
];
