import { NextRequest, NextResponse } from "next/server";

const rawApiUrl = process.env.API_URL ?? "http://localhost:4000";
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl;

// Register customer + langsung login (set httpOnly cookie, sama kyk login).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json(
      { success: false, message: "Name, email, and password are required", error: "name, email, and password required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error("[Register Proxy Fetch Error]", err);
    return null;
  });

  if (!res) {
    return NextResponse.json(
      { success: false, message: "Gagal terhubung ke server backend API", error: "Backend server unreachable" },
      { status: 503 }
    );
  }

  const rawJson = await res.json().catch(() => ({}));

  const responseData = rawJson?.data ?? rawJson;
  const token = responseData?.token;
  const user = responseData?.user;

  if (!res.ok || !token) {
    const errorMessage = rawJson?.message || rawJson?.error || "Registrasi gagal";
    return NextResponse.json(
      { success: false, message: errorMessage, error: errorMessage, errorCode: rawJson?.errorCode },
      { status: res.status >= 400 ? res.status : 400 },
    );
  }

  const out = NextResponse.json({ success: true, user, token }, { status: 201 });
  out.cookies.set("palatia_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return out;
}