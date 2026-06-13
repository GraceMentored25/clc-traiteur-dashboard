import { cookies } from "next/headers";
import { sessions, SESSION_COOKIE } from "@/app/api/auth/login/route";
import { NextResponse } from "next/server";

/**
 * Helper à appeler en premier dans toute route API protégée.
 * Retourne null si la session est valide, ou une Response 401 à renvoyer.
 *
 * Usage :
 *   const guard = await requireSession();
 *   if (guard) return guard;
 */
export async function requireSession(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) sessions.delete(token);
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  return null;
}
