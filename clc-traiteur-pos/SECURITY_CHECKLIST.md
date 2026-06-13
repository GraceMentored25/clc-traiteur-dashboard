# Checklist Cybersécurité — C.LC. Traiteur POS
*Basée sur l'audit du 2026-06-13 + CWE + OWASP Top 10 + RGPD*

---

## 🔴 CRITIQUE — À corriger immédiatement

- [ ] **[CWE-285/287/863]** `AuthFormClient.tsx` L36 appelle `login()` du store directement → bypass total d'auth, n'importe quel mot de passe fonctionne. Aligner sur `AuthForm.tsx` pour appeler `/api/auth/login`.
- [ ] **[CWE-798/259]** Supprimer les fallbacks hardcodés `?? "admin"` et `?? "4243"` dans `route.ts`. Faire échouer le démarrage si les variables d'env sont absentes.
- [ ] **[CWE-284/613]** `middleware.ts` vérifie la présence du cookie mais pas sa validité dans la Map `sessions`. Ajouter la vérification d'existence ET d'expiration du token.
- [ ] **[CWE-732]** Confirmer que RLS est activé sur la table `clc_store` dans Supabase avec une politique restrictive.
- [ ] **[CWE-400]** Aucun rate limiting sur `POST /api/auth/login`. Ajouter via Vercel Edge ou `@upstash/ratelimit` (max 5 tentatives/min par IP).
- [ ] **[CWE-522/916]** Le mot de passe est comparé en clair. Migrer vers bcrypt/argon2id : stocker le hash dans `ADMIN_PASSWORD_HASH`, comparer avec `bcrypt.compare()`.

---

## 🟠 HAUTE — À corriger ce sprint

- [ ] **[CWE-521]** Aucune politique de complexité pour `ADMIN_PASSWORD`. Documenter et imposer : min 12 caractères, majuscules + chiffres + symboles.
- [ ] **[CWE-311/312]** Le store Zustand persiste les données personnelles (noms, téléphones clients, montants) en localStorage en clair. Chiffrer via Web Crypto API ou ne pas persister les données sensibles.
- [ ] **[CWE-312]** Les exports JSON backup contiennent des données personnelles en clair. Ajouter un chiffrement AES-256-GCM protégé par mot de passe à l'export.
- [ ] **[CWE-693]** CSP avec `'unsafe-inline'` et `'unsafe-eval'` dans `script-src` → annule toute protection XSS. Migrer vers CSP avec nonces (Next.js 13+ built-in).
- [ ] **[CWE-200]** Fallbacks credentials visibles dans le code source Git. Rotation obligatoire si le repo devient/était public.
- [ ] **[CWE-862]** Toutes les routes `/api/*` sont exclues du middleware. Créer un helper `requireSession()` à appeler dans chaque future route API sensible.
- [ ] **[CWE-20]** Import backup : `z.array(z.any())` pour `ingredients`, `materiel`, `customRecipes`, `demandesCourses`, `demandesLogistique`. Remplacer par des schémas Zod stricts.
- [ ] **[CWE-359/RGPD]** Données personnelles (noms, téléphones) sans : politique de confidentialité, durée de conservation, procédure de suppression (droit à l'effacement). À documenter et implémenter.
- [ ] **Logging sécurité** Aucun log des tentatives de connexion, connexions réussies, mutations sensibles. Ajouter un système de logs d'audit minimal.
- [ ] **Dépendances (SCA)** Configurer Dependabot sur GitHub pour surveillance automatique des CVE.
- [ ] **[CWE-25]** IDs générés avec `Date.now()` (prévisible, collisions possibles). Migrer vers `crypto.randomUUID()` pour tous les IDs d'entités.

---

## 🟡 MOYENNE — À planifier prochainement

- [ ] **[CWE-352]** Cookie `sameSite: "lax"` → passer à `"strict"` pour l'app mono-utilisateur.
- [ ] **[CWE-613]** Pas de timeout d'inactivité (session valide 8h sans interaction). Ajouter un timeout de 30-60 min.
- [ ] **[CWE-306]** Routes `/api/*` futures non protégées par défaut. Documenter cette dette technique, protéger au cas par cas.
- [ ] **MFA** Ajouter une authentification à deux facteurs (TOTP) pour l'accès admin.
- [ ] **Audit trail** Aucune trace des suppressions de devis ou modifications de statuts financiers. Ajouter un log immuable des actions critiques.
- [ ] **Monitoring** Intégrer Sentry ou équivalent pour détecter les erreurs et anomalies en production.
- [ ] **[CWE-200]** URL Supabase exposée dans `<link rel="preconnect">` dans `layout.tsx` et dans la CSP de `next.config.ts`. Acceptable mais à documenter.
- [ ] **Backups Supabase** Configurer des backups automatiques de la base Supabase (Daily backups dans les paramètres projet).

---

## 🟢 FAIBLE — Amélioration continue

- [ ] **Chiffrement exports** Protéger les fichiers de backup par mot de passe (AES-256-GCM via Web Crypto).
- [ ] **[CWE-434]** Limite de taille de fichier sur les imports JSON non définie. Ajouter une vérification `file.size < 10MB`.
- [ ] **RGPD complet** Ajouter mentions légales, politique de confidentialité, procédure DSAR (Data Subject Access Request).
- [ ] **[CWE-326]** Documenter l'algorithme de génération de tokens de session (32 bytes random = 256 bits, conforme NIST).
- [ ] **Rotation des clés** Définir une procédure de rotation périodique pour `ADMIN_PASSWORD` et la clé anon Supabase.
- [ ] **Tests de pénétration** Prévoir un pentest annuel ou à chaque évolution majeure de l'app.

---

## ✅ DÉJÀ IMPLÉMENTÉ

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
- [x] **Validation imports** Schéma Zod sur les fichiers backup (partiel — voir 🟠)
- [x] **Validation CSS** `accentColor` validé contre regex `^#[0-9a-fA-F]{6}$`
- [x] **Session hors localStorage** `user` retiré du `partialize` Zustand
- [x] **Session hors Supabase** `user_data` retiré du payload de sync
- [x] **[CVE PostCSS]** Override `postcss >= 8.5.10` dans `package.json`
- [x] **CORS** Politique restrictive par défaut Next.js
- [x] **Clickjacking** X-Frame-Options + CSP frame-ancestors
- [x] **Middleware** Toutes les routes `/(app)/*` protégées côté serveur

---

## Référence rapide

| Priorité | Nb failles | Action |
|----------|-----------|--------|
| 🔴 Critique | 6 | Cette semaine |
| 🟠 Haute | 11 | Ce sprint |
| 🟡 Moyenne | 8 | Prochain sprint |
| 🟢 Faible | 6 | Backlog |
| ✅ Corrigé | 19 | — |

---

*Audit réalisé le 2026-06-13 | Prochaine révision recommandée : 2026-09-13*
