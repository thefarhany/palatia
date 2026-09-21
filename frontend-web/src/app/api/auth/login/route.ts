import { NextRequest, NextResponse } from "next/server";

const rawApiUrl = process.env.API_URL ?? "http://localhost:4000";
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required", error: "email and password required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password, surface: body.surface }),
  }).catch((err) => {
    console.error("[Login Proxy Fetch Error]", err);
    return null;
  });

  if (!res) {
    return NextResponse.json(
      { success: false, message: "Gagal terhubung ke server backend API", error: "Backend server unreachable" },
      { status: 503 }
    );
  }

  const rawJson = await res.json().catch(() => ({}));

  // Handle both BaseResponse format ({ success: true, data: { token, user } }) and legacy format ({ token, user })
  const responseData = rawJson?.data ?? rawJson;
  const token = responseData?.token;
  const user = responseData?.user;

  if (!res.ok || !token) {
    const errorMessage = rawJson?.message || rawJson?.error || "Login gagal";
    return NextResponse.json(
      { success: false, message: errorMessage, error: errorMessage, errorCode: rawJson?.errorCode },
      { status: res.status >= 400 ? res.status : 401 },
    );
  }

  const out = NextResponse.json({ success: true, user, token });
  out.cookies.set("palatia_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return out;
}
