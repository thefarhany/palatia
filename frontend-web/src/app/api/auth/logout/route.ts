import { NextResponse } from "next/server";

export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set("palatia_token", "", { path: "/", maxAge: 0 });
  return out;
}