import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createSessionToken, MAX_AGE_SEC } from "@/lib/session-token";

const SESSION_COOKIE = "clc_session";

// ── Validation au démarrage ────────────────────────────────────────────────
const VALID_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH_B64 = process.env.ADMIN_PASSWORD_HASH_B64;
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH_B64
  ? Buffer.from(ADMIN_PASSWORD_HASH_B64, "base64").toString("utf-8")
  : process.env.ADMIN_PASSWORD_HASH;
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
const WINDOW_MS = 60 * 1000;

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

function securityLog(event: string, ip: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, event, ip, ...details }));
}

// ── POST /api/auth/login ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

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

  const usernameMatch = body.username === VALID_USERNAME;

  let passwordMatch = false;
  if (ADMIN_PASSWORD_HASH) {
    passwordMatch = await bcrypt.compare(body.password, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    passwordMatch = body.password === ADMIN_PASSWORD_PLAIN;
  }

  if (!usernameMatch || !passwordMatch) {
    securityLog("LOGIN_FAILED", ip, { username: body.username });
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  }

  resetRateLimit(ip);
  securityLog("LOGIN_SUCCESS", ip, { username: body.username });

  const token = createSessionToken(VALID_USERNAME!, MAX_AGE_SEC);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });

  return NextResponse.json({ ok: true, displayName: "Administrateur", role: "admin" });
}

// ── DELETE /api/auth/login (logout) ───────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  securityLog("LOGOUT", ip);
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

export { SESSION_COOKIE, MAX_AGE_SEC as MAX_AGE };
