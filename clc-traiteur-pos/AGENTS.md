<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Autolearning

### Devis PDF — liseré blanc sur bandeau image
- **Problème** : petit espace blanc en haut du bandeau section (image + liseré orange).
- **Cause** : JPEG *progressive* mal rendu par jsPDF `addImage` (trou / décalage en haut de la bande).
- **Fix** : images `public/sections/*.jpg` en JPEG *baseline* + fond sombre sous l’image avant `addImage`.
- **Règle** : pour toute image embarquée dans un PDF jsPDF, préférer JPEG baseline (pas progressive) et peindre un fond sous l’image.
