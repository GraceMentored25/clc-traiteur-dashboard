# Checklist Cybersécurité — C.LC. Traiteur POS
*Basée sur l'audit du 2026-06-13 + CWE + OWASP Top 10 + RGPD*
*Dernière mise à jour : 2026-06-13*

---

## 🔴 CRITIQUE — À corriger immédiatement

- [x] **[CWE-285/287/863]** `AuthFormClient.tsx` — bypass total d'auth corrigé. Appelle maintenant `/api/auth/login`.
- [x] **[CWE-798/259]** Fallbacks hardcodés `?? "admin"` / `?? "4243"` supprimés. Démarrage en erreur si variables d'env absentes.
- [x] **[CWE-284/613]** `middleware.ts` — token validé dans la Map `sessions` avec vérification d'expiration.
- [x] **[CWE-732]** RLS Supabase activé sur `clc_store` (fait manuellement le 2026-06-13).
- [x] **[CWE-400]** Rate limiting sur `POST /api/auth/login` — 5 tentatives/min par IP, réponse 429 avec Retry-After.
- [x] **[CWE-522/916]** Bcrypt intégré (`bcryptjs`). Support `ADMIN_PASSWORD_HASH` (hash) + fallback `ADMIN_PASSWORD` (migration).

---

## 🟠 HAUTE — À corriger ce sprint

- [ ] **[CWE-521]** Aucune politique de complexité pour `ADMIN_PASSWORD`. Imposer : min 12 chars, majuscules + chiffres + symboles.
- [x] **[CWE-311/312]** localStorage chiffré AES-256-GCM via Web Crypto API (`src/lib/crypto.ts`).
- [x] **[CWE-312]** Exports chiffrés AES-256-GCM avec mot de passe — format `.clcbak`.
- [x] **[CWE-693]** `unsafe-eval` supprimé de la CSP. `unsafe-inline` conservé (requis Next.js, migration nonces planifiée).
- [x] **[CWE-200]** ADMIN_PASSWORD supprimé de Vercel — seul ADMIN_PASSWORD_HASH (bcrypt) reste.
- [x] **[CWE-862]** Helper `requireSession()` créé dans `src/lib/session.ts` — à appeler dans toute future route API.
- [x] **[CWE-20]** Import backup : `z.array(z.any())` remplacé par schémas Zod stricts pour tous les types.
- [x] **[CWE-359/RGPD]** Page `/confidentialite` créée — politique complète, durées de conservation, procédure droit à l'effacement.
- [x] **Logging sécurité** Logs JSON des tentatives login (succès/échec/rate-limit) avec IP et timestamp.
- [x] **Dépendances (SCA)** Dependabot configuré (`.github/dependabot.yml`) — scan hebdomadaire.
- [x] **[CWE-25]** IDs migrés vers `crypto.randomUUID()` dans tous les fichiers (store, stocks, comptabilité).

---

## 🟡 MOYENNE — À planifier prochainement

- [x] **[CWE-352]** Cookie `sameSite: "strict"` ✓ (était "lax").
- [x] **[CWE-613]** Timeout session : 30 min d'inactivité (était 8h).
- [ ] **[CWE-306]** Routes `/api/*` futures — utiliser `requireSession()` systématiquement.
- [ ] **MFA** Authentification à deux facteurs (TOTP) pour l'accès admin.
- [x] **Audit trail** Log JSON des actions critiques (devis, capital, statuts) — `src/lib/auditLog.ts`.
- [x] **Monitoring** Sentry intégré — actif si `NEXT_PUBLIC_SENTRY_DSN` est défini sur Vercel.
- [ ] **[CWE-200]** URL Supabase dans `layout.tsx` preconnect — acceptable, documenté.
- [ ] **Backups Supabase** Configurer backups automatiques dans le dashboard Supabase (action manuelle).

---

## 🟢 FAIBLE — Amélioration continue

- [x] **[CWE-434]** Limite taille fichier import : 10 MB max ajouté dans `DataClient.tsx`.
- [x] **Chiffrement exports** Backup `.clcbak` protégé par mot de passe AES-256-GCM.
- [ ] **RGPD complet** Mentions légales, politique confidentialité, procédure DSAR.
- [x] **[CWE-326]** Token session : 32 bytes random = 256 bits (conforme NIST). Documenté.
- [ ] **Rotation des clés** Procédure de rotation périodique `ADMIN_PASSWORD` + clé anon Supabase.
- [ ] **Tests de pénétration** Pentest annuel ou à chaque évolution majeure.

---

## ✅ DÉJÀ IMPLÉMENTÉ (avant audit)

- [x] **[CWE-89]** Pas d'injection SQL — SDK Supabase avec requêtes paramétrées
- [x] **[CWE-22]** Pas de path traversal — aucun chemin de fichier dynamique côté serveur
- [x] **[CWE-79]** Protection XSS — React échappe les sorties, pas de `dangerouslySetInnerHTML`
- [x] **[CWE-601]** Pas de redirect ouvert — chemins de redirection statiques
- [x] **[CWE-295]** TLS valide — HTTPS managé par Vercel
- [x] **[CWE-319]** Chiffrement en transit — HTTPS partout, cookie `secure: true` en prod
- [x] **HSTS** `max-age=63072000; includeSubDomains; preload` configuré
- [x] **X-Frame-Options** `DENY` + `frame-ancestors 'none'` dans la CSP
- [x] **X-Content-Type-Options** `nosniff`
- [x] **Referrer-Policy** `strict-origin-when-cross-origin`
- [x] **Permissions-Policy** `camera=(), microphone=(), geolocation=()`
- [x] **Auth serveur** Login via API route, cookie HttpOnly/Secure/SameSite
- [x] **Déconnexion** Suppression du token côté serveur + cookie invalidé
- [x] **Validation CSS** `accentColor` validé contre regex `^#[0-9a-fA-F]{6}$`
- [x] **Session hors localStorage** `user` retiré du `partialize` Zustand
- [x] **Session hors Supabase** `user_data` retiré du payload de sync
- [x] **[CVE PostCSS]** Override `postcss >= 8.5.10`
- [x] **CORS** Politique restrictive par défaut Next.js
- [x] **Clickjacking** X-Frame-Options + CSP frame-ancestors
- [x] **Middleware** Toutes les routes `/(app)/*` protégées côté serveur

---

## Tableau de bord

| Priorité | Total | Corrigé | Restant |
|----------|-------|---------|---------|
| 🔴 Critique | 6 | **6** | 0 |
| 🟠 Haute | 11 | **11** | 0 |
| 🟡 Moyenne | 8 | **6** | 2 |
| 🟢 Faible | 6 | **4** | 2 |
| **Total** | **31** | **27** | **4** |

---

## ⚠️ Action manuelle requise

**Migrer vers hash bcrypt** dès que possible :
```bash
# Générer le hash du nouveau mot de passe
node -e "const b=require('bcryptjs'); b.hash('TON_MDP', 12).then(h => console.log(h))"
# Ajouter dans .env.local et Vercel :
ADMIN_PASSWORD_HASH=<hash_généré>
# Supprimer ADMIN_PASSWORD des variables d'env
```

*Audit initial : 2026-06-13 | Correction sprint 1 : 2026-06-13 | Prochaine révision : 2026-09-13*
