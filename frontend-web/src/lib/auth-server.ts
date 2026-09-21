import { cookies } from "next/headers";
import { cache } from "react";
import { type Role, ROLE_HOME } from "@/lib/roles";

export type { Role };

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export const TOKEN_COOKIE = "palatia_token";

export { ROLE_HOME };

export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Server-side fetch to the Express API with an optional JWT. */
export async function apiFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw Object.assign(new Error(err.error ?? `API ${res.status}`), {
      status: res.status,
    });
  }
  if (res.status === 204) return undefined as T; // no-body responses
  return res.json() as Promise<T>;
}

/** Current session for RSC. Cached per request; null = not logged in / token invalid. */
export const getSession = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await apiFetch<{ user: User }>("/me/profile", { token });
    return res.user;
  } catch {
    return null;
  }
});