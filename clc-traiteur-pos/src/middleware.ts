import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "clc_session";
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

  // Vérifier la présence du cookie — la validité est vérifiée côté serveur dans AppShell
  // Note: Edge Runtime ≠ Node.js runtime, la Map sessions n'est pas partageable
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
