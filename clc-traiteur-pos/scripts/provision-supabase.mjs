#!/usr/bin/env node
/**
 * Provisionne Supabase pour CLC Traiteur via Vercel Marketplace.
 *
 * Prérequis :
 * 1. Accepter les conditions : https://vercel.com/ricardondjoumessis-projects/~/integrations/accept-terms/supabase
 * 2. VERCEL_TOKEN ou `vercel login`
 *
 * Usage :
 *   node scripts/provision-supabase.mjs
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/provision-supabase.mjs --migrate-only
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MIGRATION_SQL = readFileSync(
  resolve(ROOT, "supabase/migrations/20260828120000_clc_store_full_schema.sql"),
  "utf-8"
);

const args = new Set(process.argv.slice(2));
const migrateOnly = args.has("--migrate-only");
const region = process.env.SUPABASE_REGION ?? "cdg1";

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts });
}

function runJson(cmd) {
  const out = execSync(cmd, { cwd: ROOT, encoding: "utf-8" });
  return JSON.parse(out);
}

async function runSql(projectRef, accessToken, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `SQL failed HTTP ${res.status}`);
  }
  return data;
}

function extractProjectRef(url) {
  const m = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? null;
}

async function migrateDatabase(projectRef, accessToken) {
  console.log(`\n📦 Migration SQL sur ${projectRef}…`);
  const statements = MIGRATION_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    await runSql(projectRef, accessToken, stmt);
  }
  console.log("✅ Table clc_store + politiques RLS créées");
}

async function main() {
  const vercelToken = process.env.VERCEL_TOKEN ?? process.env.vercel_token;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!migrateOnly) {
    console.log("🚀 Installation Supabase via Vercel Marketplace…\n");
    const tokenFlag = vercelToken ? `VERCEL_TOKEN="${vercelToken}" ` : "";
    try {
      run(
        `${tokenFlag}npx vercel integration add supabase --name clc-traiteur-db --plan free -m region=${region} -e production -e preview -e development --json`,
        { stdio: "pipe" }
      );
    } catch (e) {
      const msg = String(e.stdout ?? e.message ?? e);
      if (msg.includes("integration_terms_acceptance_required")) {
        console.error("\n❌ Acceptez d'abord les conditions Supabase :");
        console.error(
          "   https://vercel.com/ricardondjoumessis-projects/~/integrations/accept-terms/supabase?source=cli\n"
        );
        process.exit(1);
      }
      throw e;
    }

    run(`${tokenFlag}npx vercel env pull .env.local --yes`);
  }

  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ .env.local introuvable — lancez `vercel env pull`");
    process.exit(1);
  }

  const envText = readFileSync(envPath, "utf-8");
  const url = envText.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)?.[1];
  const projectRef = extractProjectRef(url);

  if (!projectRef) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL absent — l'intégration Supabase n'est pas terminée");
    process.exit(1);
  }

  console.log(`\n✅ Projet Supabase détecté : ${projectRef}`);
  console.log(`   URL : ${url}`);

  if (accessToken) {
    await migrateDatabase(projectRef, accessToken);
  } else {
    console.log("\n⚠️  SUPABASE_ACCESS_TOKEN absent — migration SQL manuelle requise :");
    console.log("   Supabase Dashboard → SQL Editor → exécuter :");
    console.log(`   supabase/migrations/20260828120000_clc_store_full_schema.sql`);
    console.log("\n   Token : https://supabase.com/dashboard/account/tokens");
  }

  console.log("\n✅ Terminé. Redéployez Vercel puis synchronisez les devis.");
}

main().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});
