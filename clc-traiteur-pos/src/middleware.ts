import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "clc_session";
const PUBLIC_PATHS = ["/", "/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisser passer les routes publiques, API, assets
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

  // Vérifier la présence du cookie de session
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
