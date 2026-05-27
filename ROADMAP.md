# C.LC. Traiteur — POS Web Application
## Roadmap Complète & Architecture Technique

> **Date de démarrage :** 2026-05-26  
> **Statut :** Phase 0 — Initialisation

---

## Stack Technologique Recommandée

### Frontend
| Outil | Rôle | Pourquoi |
|-------|------|----------|
| **Next.js 14 (App Router)** | Framework React SSR/SSG | Routing, performance, déploiement Vercel natif |
| **TypeScript** | Typage statique | Robustesse, autocomplétion, moins de bugs |
| **Tailwind CSS** | Styling utilitaire | Rapidité, cohérence, dark mode natif |
| **shadcn/ui** | Composants UI | Accessibilité, personnalisation totale, pas de dépendance externe |
| **Framer Motion** | Animations | Transitions fluides entre pages/états |
| **Recharts** | Graphiques KPI | Léger, React-natif, SVG, responsive |

### State Management & Données
| Outil | Rôle | Pourquoi |
|-------|------|----------|
| **Zustand** | State global | Simple, léger, parfait pour POS (panier, session) |
| **localStorage / sessionStorage** | Persistance locale | MVP sans backend — données persistées côté client |
| **React Hook Form + Zod** | Formulaires & validation | Login, création de devis |

### Déploiement & CI/CD
| Outil | Rôle |
|-------|------|
| **GitHub** | Versioning, repository source |
| **Vercel** | Déploiement automatique, CDN, HTTPS gratuit |
| **GitHub Actions** (optionnel v2) | CI/CD pipeline |

### Skills Claude activés pour ce projet
- `ui-ux-pro-max` — design system, palettes, composants premium
- `ux-design:refactoring-ui` — hiérarchie visuelle, typographie
- `ux-design:top-design` — expérience premium Awwwards-level
- `frontend-design:frontend-design` — implémentation HTML/CSS/React
- `land-and-deploy` — déploiement Vercel + GitHub automatisé

---

## Architecture des Pages

```
/                    → Redirect vers /auth
/auth                → Page d'authentification (auth.png)
/dashboard           → Landing POS — sélection plats + composition devis (landing.webp)
/devis               → Bilan événements — liste des devis générés (bilan-evenement.png)
/kpi                 → KPIs & métriques — graphiques & chiffres clés (kpi.png + suivi.png)
```

---

## Phase 0 — Setup Projet (Jour 1 matin)

### 0.1 Initialisation Next.js
```bash
npx create-next-app@latest clc-traiteur-pos \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 0.2 Installation dépendances
```bash
npm install zustand framer-motion recharts
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
npx shadcn@latest add button card input badge dialog sheet tabs
```

### 0.3 Structure de fichiers
```
src/
├── app/
│   ├── auth/page.tsx          → Page login
│   ├── dashboard/page.tsx     → POS principal
│   ├── devis/page.tsx         → Bilan événements
│   ├── kpi/page.tsx           → Métriques
│   ├── layout.tsx             → Layout racine
│   └── globals.css            → Tokens CSS Tailwind
├── components/
│   ├── auth/LoginForm.tsx
│   ├── dashboard/
│   │   ├── CategoryBar.tsx    → Barre catégories
│   │   ├── DishCard.tsx       → Carte plat + sélecteur quantité
│   │   ├── CartSidebar.tsx    → Récap sélection droite
│   │   └── DevisModal.tsx     → Modal génération devis
│   ├── devis/
│   │   ├── EventTable.tsx     → Tableau des événements
│   │   └── DevisDetail.tsx    → Modal détail devis
│   ├── kpi/
│   │   ├── KpiCard.tsx        → Carte métrique
│   │   ├── RevenueChart.tsx   → Graphique revenus
│   │   └── OrdersChart.tsx    → Évolution commandes
│   └── layout/
│       ├── Sidebar.tsx        → Navigation principale
│       └── TopBar.tsx         → En-tête avec profil
├── lib/
│   ├── store.ts               → Zustand — state global
│   ├── auth.ts                → Logique authentification
│   ├── data/
│   │   ├── dishes.ts          → Catalogue plats africains
│   │   └── mock-events.ts     → Données fictives événements
│   └── types.ts               → Types TypeScript
└── public/
    ├── auth.png               → Image login (copie depuis dashboard/)
    ├── dishes/                → Photos plats africains
    └── logo.svg               → Logo C.LC. Traiteur
```

### 0.4 Configuration GitHub + Vercel
```bash
git init && git add . && git commit -m "init: C.LC. Traiteur POS"
gh repo create clc-traiteur-pos --public --push
# Puis connecter vercel.com/new → import depuis GitHub
```

---

## Phase 1 — Authentification (Jour 1 après-midi)

### Spec fonctionnelle
- Page `/auth` avec layout split : gauche image `auth.png`, droite formulaire
- Champs : Identifiant (admin) + Mot de passe (4243)
- Validation Zod : champs requis
- On success → redirect `/dashboard`
- State session persisté dans `sessionStorage`
- Protection des routes (middleware Next.js)

### Détails design (inspiré auth.png)
- Fond orange/warm (#F59E0B ou similaire)
- Formulaire fond blanc, coins arrondis xl
- Logo C.LC. Traiteur en haut
- Animation entrée Framer Motion (fade + slide up)
- Bouton Login vert (#22C55E) avec hover state

### Profils
```typescript
const USERS = [
  { username: "admin", password: "4243", role: "admin" }
]
```

---

## Phase 2 — Dashboard POS (Jour 2)

### Spec fonctionnelle
- Sidebar navigation (Auth > Dashboard > Devis > KPI)
- Barre de catégories horizontale scrollable
- Grille de plats (3-4 colonnes)
- Click sur plat → ouvre sélecteur de quantité (+ / -)
- Cart sidebar droite : liste des plats sélectionnés, total
- Bouton "Générer un devis" → modal avec nom client, date événement → crée le devis

### Catalogue plats africains (Camerounais)
```typescript
const CATEGORIES = ["Entrées", "Plats principaux", "Grillades", "Poissons", "Accompagnements", "Desserts"]

const DISHES = [
  // Plats principaux
  { id: 1, name: "Ndolé", category: "Plats principaux", price: 15, image: "/dishes/ndole.jpg" },
  { id: 2, name: "Eru", category: "Plats principaux", price: 14, image: "/dishes/eru.jpg" },
  { id: 3, name: "Koki", category: "Entrées", price: 8, image: "/dishes/koki.jpg" },
  { id: 4, name: "Mbongo Tchobi", category: "Plats principaux", price: 16, image: "/dishes/mbongo.jpg" },
  { id: 5, name: "Porc Braisé", category: "Grillades", price: 18, image: "/dishes/porc-braise.jpg" },
  { id: 6, name: "Poulet DG", category: "Plats principaux", price: 16, image: "/dishes/poulet-dg.jpg" },
  { id: 7, name: "Poisson Braisé", category: "Poissons", price: 17, image: "/dishes/poisson-braise.jpg" },
  { id: 8, name: "Okok (Melon)", category: "Plats principaux", price: 14, image: "/dishes/okok.jpg" },
  { id: 9, name: "Beignets Haricots", category: "Entrées", price: 6, image: "/dishes/beignets.jpg" },
  { id: 10, name: "Riz Sauté DG", category: "Accompagnements", price: 10, image: "/dishes/riz-dg.jpg" },
  { id: 11, name: "Plantain Braisé", category: "Accompagnements", price: 7, image: "/dishes/plantain.jpg" },
  { id: 12, name: "Chin Chin", category: "Desserts", price: 5, image: "/dishes/chinchin.jpg" },
]
```

### Génération devis
```typescript
interface Devis {
  id: string           // UUID
  clientName: string
  eventDate: string
  createdAt: string
  status: "Brouillon" | "Envoyé" | "Confirmé" | "Annulé"
  items: { dish: Dish; quantity: number }[]
  totalHT: number
  totalTTC: number     // TVA 20%
}
```

### Détails design (inspiré landing.webp GoMeal)
- Sidebar gauche : navigation + profil admin
- Header : recherche, notifications, avatar
- Catégories : row de chips/pills scrollable
- Cards plats : image ronde/carrée, nom, prix, badge rating
- Couleur principale : orange #F59E0B (ton C.LC.)
- Cart sidebar droite coulissante (Sheet component)

---

## Phase 3 — Bilan Événements (Jour 3 matin)

### Spec fonctionnelle
- Tableau des devis avec colonnes : ID, Client, Date, Statut, Montant TTC, Actions
- Filtres : par statut, par date
- Click sur ligne → ouvre modal de détail avec liste des plats
- Badges colorés par statut (vert/Confirmé, orange/Envoyé, gris/Brouillon, rouge/Annulé)
- Bouton "Nouveau Devis" (redirect vers Dashboard avec mode devis actif)

### Données mock événements (pré-rempli)
```typescript
const MOCK_EVENTS = [
  { id: "DV-001", clientName: "Marie Ngono", eventDate: "2026-06-15", status: "Confirmé", totalTTC: 450 },
  { id: "DV-002", clientName: "Jean Mbarga", eventDate: "2026-06-22", status: "Envoyé", totalTTC: 720 },
  { id: "DV-003", clientName: "Pauline Ateba", eventDate: "2026-07-01", status: "Brouillon", totalTTC: 280 },
]
```

---

## Phase 4 — KPIs & Métriques (Jour 3 après-midi)

### Spec fonctionnelle
- 4 cartes KPI en haut : CA Total, Devis générés, Taux de conversion, Valeur moy. devis
- Graphique en barres : évolution des commandes sur 6 mois
- Graphique en courbe : CA mensuel
- Graphique donut : répartition par catégorie de plats
- Top 5 plats commandés (tableau)
- Toggle Dark/Light mode

### KPIs calculés dynamiquement depuis le store Zustand
```typescript
const kpis = {
  totalCA: devis.filter(d => d.status === "Confirmé").reduce(...),
  totalDevis: devis.length,
  conversionRate: (confirmed / total) * 100,
  averageDevis: totalCA / confirmed
}
```

### Design (inspiré kpi.png + suivi.png)
- Dark mode par défaut (#0F172A background)
- Cartes avec gradient et icônes colorées
- Graphiques Recharts avec couleurs de la charte (orange, vert, bleu)
- Grid responsive 2-3 colonnes

---

## Phase 5 — Déploiement (Jour 4)

### 5.1 GitHub
```bash
git add .
git commit -m "feat: complete C.LC. Traiteur POS v1.0"
git push origin main
```

### 5.2 Vercel
1. Aller sur vercel.com → New Project
2. Import depuis GitHub : `clc-traiteur-pos`
3. Framework : Next.js (auto-détecté)
4. Build Command : `npm run build`
5. Output Directory : `.next`
6. Deploy → URL auto-générée (ex: `clc-traiteur-pos.vercel.app`)

### 5.3 Variables d'environnement Vercel
```env
NEXT_PUBLIC_APP_NAME=C.LC. Traiteur POS
NEXT_PUBLIC_VERSION=1.0.0
```

---

## Charte Graphique C.LC. Traiteur

```css
/* Couleurs principales */
--color-primary: #F59E0B;      /* Orange chaud — identité traiteur */
--color-primary-dark: #D97706;
--color-success: #22C55E;      /* Vert — confirmé, validé */
--color-danger: #EF4444;       /* Rouge — annulé, erreur */
--color-warning: #F97316;      /* Orange foncé — en attente */
--color-bg-dark: #0F172A;      /* Fond dark mode */
--color-bg-card: #1E293B;      /* Cartes dark */
--color-text-primary: #F8FAFC; /* Texte sur dark */

/* Typographie */
--font-heading: 'Plus Jakarta Sans' (bold, expressive)
--font-body: 'Inter' (clean, lisible)

/* Bordures & ombres */
--radius: 12px (cards), 8px (inputs), 24px (boutons CTA)
--shadow: 0 4px 24px rgba(245, 158, 11, 0.15) (glow orange)
```

---

## Métriques de Succès

| KPI | Cible |
|-----|-------|
| Temps de chargement initial | < 2s |
| Score Lighthouse Performance | > 90 |
| Score Lighthouse Accessibility | > 95 |
| Couverture mobile (responsive) | 100% |
| Génération d'un devis complet | < 3 clics |

---

## Roadmap V2 (Post-MVP)

- [ ] Backend Supabase (auth réelle, base de données)
- [ ] Génération PDF du devis (react-pdf)
- [ ] Envoi email du devis (Resend API)
- [ ] Gestion des stocks
- [ ] Multi-utilisateurs avec rôles (serveur, caissier, admin)
- [ ] Notifications push événements
- [ ] Mode hors-ligne (PWA)

---

*Roadmap générée le 2026-05-26 — C.LC. Traiteur POS v1.0*
