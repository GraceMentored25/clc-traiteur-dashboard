<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Autolearning

### Devis PDF — bandeau image (rayures / trou blanc)
- **Problème** : rayures verticales, liseré blanc, photo absente ou incorrecte.
- **Causes** :
  1. `/sections/*` **bloqué par le middleware** (redirect `/` sans cookie) → `fetch`/`Image` peut échouer ou charger autre chose que le PNG.
  2. jsPDF `addImage` **JPEG** ou PNG palette + superpositions (voile GState) → rendu corrompu dans le navigateur.
- **Fix** :
  - Autoriser `pathname.startsWith("/sections/")` dans `middleware.ts`.
  - Rasteriser tout le bandeau en **une seule image canvas** (cover + voile + liseré + textes) puis un seul `addImage` PNG.
  - Assets `public/sections/*.png` en **RGB** (pas palette pngquant).
- **Vérif** : `node scripts/verify-pdf-band.mjs` (Chromium + analyse pixels PDF).

### Devis PDF — template Ébène & Cuivre
- **Direction** : palette ébène/cacao + cuivre (plus d’ambre), fond ivoire, bandeaux photo full-bleed.
- **Règles contenu** :
  - Sous-onglets (Entrées, Plats…) toujours affichés.
  - Sous-titre **« Plats principaux (accompagnements inclus) »** masqué dans le PDF.
  - Colonne **Qté** toujours centrée (`columnStyles` + `didParseCell`).
