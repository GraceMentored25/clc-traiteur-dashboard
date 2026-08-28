import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/app/api/auth/login/route";
import { verifySessionToken } from "@/lib/session-token";

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false, reason: "expired" }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, username: session.username });
}
