import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SEC = 60 * 60 * 8; // 8 h — cookie renouvelé à chaque requête authentifiée

export interface SessionPayload {
  username: string;
  exp: number;
}

function getSecret(): string {
  const secret =
    process.env.SESSION_SECRET ??
    process.env.ADMIN_PASSWORD_HASH_B64 ??
    process.env.ADMIN_PASSWORD_HASH;
  if (!secret) {
    throw new Error("[SECURITY] SESSION_SECRET ou ADMIN_PASSWORD_HASH_B64 requis");
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Crée un jeton de session signé (compatible serverless — pas de Map en mémoire). */
export function createSessionToken(username: string, maxAgeSec = MAX_AGE_SEC): string {
  const payload: SessionPayload = {
    username,
    exp: Date.now() + maxAgeSec * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Vérifie et décode un jeton de session. Retourne null si invalide ou expiré. */
export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sign(data), sig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload.username || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export { MAX_AGE_SEC };
