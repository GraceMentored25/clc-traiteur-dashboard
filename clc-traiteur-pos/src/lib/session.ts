import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/app/api/auth/login/route";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session-token";

/**
 * Helper à appeler en premier dans toute route API protégée.
 * Retourne null si la session est valide, ou une Response 401 à renvoyer.
 */
export async function requireSession(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  return null;
}

/** Lit la session courante sans renvoyer de réponse HTTP. */
export function readSessionFromToken(token: string | undefined) {
  if (!token) return null;
  return verifySessionToken(token);
}
