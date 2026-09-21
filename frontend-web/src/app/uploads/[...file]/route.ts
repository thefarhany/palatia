import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
  <rect width="400" height="300" fill="#f7ece4"/>
  <g opacity="0.6">
    <path d="M200 110C160 110 125 135 110 170H290C275 135 240 110 200 110Z" fill="#b8521f"/>
    <path d="M192 90C192 85.5817 195.582 82 200 82C204.418 82 208 85.5817 208 90V110H192V90Z" fill="#b8521f"/>
    <rect x="95" y="174" width="210" height="10" rx="5" fill="#8c390e"/>
  </g>
  <text x="200" y="215" text-anchor="middle" fill="#5c5147" font-family="sans-serif" font-size="13" font-weight="500">Palatia</text>
</svg>`;

function fallbackResponse() {
  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60",
    },
  });
}

/** Proxy file uploads (foto menu dsb.) dari Express — biar next/image pakai path relatif. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string[] }> }) {
  const { file } = await ctx.params;
  const filePath = file.join("/");

  try {
    const res = await fetch(`${API_URL}/uploads/${filePath}`, { cache: "no-store" });
    if (!res.ok) {
      return fallbackResponse();
    }
    const contentType = res.headers.get("Content-Type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return fallbackResponse();
  }
}

