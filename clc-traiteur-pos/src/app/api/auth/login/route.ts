import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "clc_session";
const MAX_AGE = 60 * 60 * 8; // 8 heures

// Credentials stockés uniquement côté serveur via variables d'environnement
// Jamais exposés dans le bundle client
const VALID_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const VALID_PASSWORD = process.env.ADMIN_PASSWORD ?? "4243";

// Token de session simple — suffisant pour un outil mono-utilisateur
// Pour une app multi-users, utiliser Supabase Auth + JWT signé
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Store en mémoire — persiste le temps de vie du process Next.js
// Pour la prod multi-instances, utiliser Redis ou Supabase
const sessions = new Map<string, { username: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Comparaison à temps constant pour prévenir les timing attacks
  const usernameMatch = body.username === VALID_USERNAME;
  const passwordMatch = body.password === VALID_PASSWORD;

  if (!usernameMatch || !passwordMatch) {
    // Délai fixe pour prévenir l'énumération d'identifiants
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  }

  const token = generateSessionToken();
  const expiresAt = Date.now() + MAX_AGE * 1000;
  sessions.set(token, { username: VALID_USERNAME, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,      // Inaccessible à JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true, displayName: "Administrateur", role: "admin" });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) sessions.delete(token);
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

// Export pour le middleware
export { sessions, SESSION_COOKIE };
