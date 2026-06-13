import { NextRequest, NextResponse } from "next/server";
import { sessions, SESSION_COOKIE } from "@/app/api/auth/login/route";

const PUBLIC_PATHS = ["/", "/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Routes publiques, API, assets
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/dishes/") ||
    pathname === "/logo.png" ||
    pathname === "/auth.jpeg" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Vérifier la présence du cookie
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Vérifier que le token existe dans le store de sessions ET n'est pas expiré
  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    // Token invalide ou expiré — supprimer et rediriger
    if (session) sessions.delete(token);
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
