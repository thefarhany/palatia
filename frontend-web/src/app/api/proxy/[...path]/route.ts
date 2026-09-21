import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const TOKEN_COOKIE = "palatia_token";

/**
 * BFF proxy: browser calls /api/proxy/<express-path>, we forward with the
 * httpOnly JWT attached. Same-origin → no CORS, token never readable by JS.
 * JSON bodies are buffered; anything else (multipart upload) streams through.
 */
async function forward(req: NextRequest, path: string) {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const reqContentType = req.headers.get("content-type") ?? "";
  const isJson = reqContentType.includes("application/json");
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : isJson
        ? await req.text()
        : req.body;
  const res = await fetch(`${API_URL}/api${path}`, {
    method: req.method,
    headers: {
      ...(reqContentType ? { "Content-Type": reqContentType } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // @ts-expect-error duplex is required for streaming request bodies
    duplex: "half",
    body,
  });
  const contentType = res.headers.get("Content-Type") ?? "application/json";
  // 204/304 must carry no body — a "" body makes NextResponse throw (500).
  if (res.status === 204 || res.status === 304) {
    return new NextResponse(null, { status: res.status });
  }
  // Binary (QR PNG, images) must pass through as bytes — res.text() would corrupt them.
  const data =
    contentType.startsWith("image/") || contentType === "application/pdf"
      ? await res.arrayBuffer()
      : await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

const handler = async (req: NextRequest, ctx: Ctx) =>
  forward(req, "/" + (await ctx.params).path.join("/") + req.nextUrl.search);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
