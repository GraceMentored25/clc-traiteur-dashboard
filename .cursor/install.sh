#!/usr/bin/env bash
# Idempotent Cloud Agent install for the CLC Traiteur POS Next.js app.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/clc-traiteur-pos"

cd "$APP_DIR"

# Development-only fallback environment.
# Written only if no .env.local exists so real values provided via Cursor
# secrets or a manually created .env.local always take precedence.
# The app requires ADMIN_USERNAME + a password, and Supabase client vars must
# be valid URLs; the placeholder Supabase project simply makes cloud sync a
# graceful no-op during local development.
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
# Auto-generated dev defaults for Cloud Agent development.
# Override by editing this file or providing Cursor secrets of the same name.
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
EOF
  echo "[install] Generated dev .env.local with placeholder credentials."
else
  echo "[install] Existing .env.local found — leaving it untouched."
fi

# Deterministic dependency install from the committed lockfile.
npm ci

echo "[install] Done."
