import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Register customer + langsung login (set httpOnly cookie, sama kyk login).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json(
      { error: "name, email, and password required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    return NextResponse.json(
      { error: data.error ?? "Registrasi gagal" },
      { status: res.status },
    );
  }

  const out = NextResponse.json({ user: data.user }, { status: 201 });
  out.cookies.set("palatia_token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return out;
}