<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Autolearning

### Devis PDF — liseré blanc / rayures sur bandeau image
- **Problème** : espace blanc / écart avec le bord ; image en rayures verticales.
- **Cause** : (1) bandeau dessiné avec marge `L=14` → écart blanc ; (2) jsPDF `addImage` **JPEG** corrompt souvent le rendu (rayures).
- **Fix** : bandeau **full-bleed** (`x=0`, `width=pageWidth`) ; images en **PNG** (`public/sections/*.png`) + chargement canvas→PNG.
- **Règle** : pour les fonds photo dans jsPDF, utiliser PNG (pas JPEG) et coller le bandeau au bord de page si l’UI le demande.
