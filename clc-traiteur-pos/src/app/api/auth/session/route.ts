import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessions } from "@/app/api/auth/login/route";

const SESSION_COOKIE = "clc_session";

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) sessions.delete(token);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, username: session.username });
}
