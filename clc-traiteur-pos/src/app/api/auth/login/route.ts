import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "clc_session";
const MAX_AGE = 60 * 30; // 30 min d'inactivité (était 8h)
const INACTIVITY_RESET = true; // renouvelle le cookie à chaque requête authentifiée

// ── Validation au démarrage ────────────────────────────────────────────────
const VALID_USERNAME = process.env.ADMIN_USERNAME;
// Le hash bcrypt est stocké en base64 pour éviter l'interprétation des $ par dotenv
const ADMIN_PASSWORD_HASH_B64 = process.env.ADMIN_PASSWORD_HASH_B64;
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH_B64
  ? Buffer.from(ADMIN_PASSWORD_HASH_B64, "base64").toString("utf-8")
  : process.env.ADMIN_PASSWORD_HASH; // fallback pour Vercel (valeur directe)
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD;

if (!VALID_USERNAME) {
  throw new Error("[SECURITY] ADMIN_USERNAME est requis");
}
if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_PLAIN) {
  throw new Error("[SECURITY] ADMIN_PASSWORD_HASH_B64 ou ADMIN_PASSWORD est requis");
}

// ── Rate limiting en mémoire (par IP) ─────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// ── Session store en mémoire ───────────────────────────────────────────────
export const sessions = new Map<string, { username: string; expiresAt: number }>();

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Logging sécurité ───────────────────────────────────────────────────────
function securityLog(event: string, ip: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, event, ip, ...details }));
}

// ── POST /api/auth/login ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limiting
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    securityLog("LOGIN_RATE_LIMITED", ip);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Vérification username
  const usernameMatch = body.username === VALID_USERNAME;

  // Vérification mot de passe — priorité au hash bcrypt, fallback temporaire sur clair
  let passwordMatch = false;
  if (ADMIN_PASSWORD_HASH) {
    passwordMatch = await bcrypt.compare(body.password, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    // Migration : si seul le mot de passe en clair est défini, comparer directement
    // (à migrer vers ADMIN_PASSWORD_HASH dès que possible)
    passwordMatch = body.password === ADMIN_PASSWORD_PLAIN;
  }

  if (!usernameMatch || !passwordMatch) {
    securityLog("LOGIN_FAILED", ip, { username: body.username });
    // Délai constant pour éviter timing attacks
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  }

  // Succès
  resetRateLimit(ip);
  securityLog("LOGIN_SUCCESS", ip, { username: body.username });

  const token = generateSessionToken();
  const expiresAt = Date.now() + MAX_AGE * 1000;
  sessions.set(token, { username: VALID_USERNAME!, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true, displayName: "Administrateur", role: "admin" });
}

// ── DELETE /api/auth/login (logout) ───────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    sessions.delete(token);
    securityLog("LOGOUT", ip);
  }
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

export { SESSION_COOKIE, MAX_AGE };
