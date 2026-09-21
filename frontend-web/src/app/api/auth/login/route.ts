import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "email and password required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password, surface: body.surface }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    return NextResponse.json(
      { error: data.error ?? "Login gagal" },
      { status: res.status },
    );
  }

  const out = NextResponse.json({ user: data.user });
  out.cookies.set("palatia_token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return out;
}
