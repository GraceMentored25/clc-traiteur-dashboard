# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout
- `clc-traiteur-pos/` — the only real application: a **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4** catering POS. All setup/lint/test/build/run commands live here.
- `telegram-bot/` — empty placeholder (planned, not implemented). Nothing to run.
- `ROADMAP.md` and the root `*.png/.webp` files are design/planning docs only.

### Services & commands (run from `clc-traiteur-pos/`)
- Dev server: `npm run dev` (Next.js + Turbopack, serves http://localhost:3000).
- Lint: `npm run lint` (ESLint flat config). Note: the current codebase has pre-existing lint errors/warnings; a non-zero lint exit is expected and not caused by env setup.
- Build: `npm run build`; production start: `npm start`.
- There is no automated test suite in this repo.

### Required environment (non-obvious — the app crashes without it)
The app needs `clc-traiteur-pos/.env.local`, which is **gitignored** (`.env*`), so it is never committed and will not survive a fresh clone. The update script recreates it idempotently if missing. It must contain:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=4243
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
```
Why each is required:
- `ADMIN_USERNAME` + (`ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH_B64`/`ADMIN_PASSWORD_HASH`): `src/app/api/auth/login/route.ts` throws at module load if these are absent, which breaks the login/session API routes.
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `src/lib/supabase.ts` calls `createClient()` at module load (imported by `AppShell`), which throws with empty values. Placeholder values are fine locally — Supabase cloud sync gracefully no-ops on network errors, and all app data persists in encrypted `localStorage`.

### App usage notes
- Login credentials for local dev: `admin` / `4243` (documented in `ROADMAP.md`).
- Core flow (hello world): log in → dashboard POS → add a dish to cart → "Générer" → fill the devis (quote) form (client name, date, guests, event type) → "Créer le devis". New quotes appear on the `/devis` page.
- State is client-side (Zustand + encrypted localStorage). Supabase is optional cloud persistence; it is not needed to run or test locally.
