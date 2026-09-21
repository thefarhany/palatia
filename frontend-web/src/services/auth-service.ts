import { apiClient } from "@/lib/api-client";
import type { StaffMember } from "@/lib/types";

/** Auth via BFF route handler (set httpOnly cookie). */
export async function login(email: string, password: string, surface?: "public" | "staff") {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, surface }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Login gagal");
  return body.user as { role: string };
}

/** Register customer via BFF (sekaligus set cookie login). */
export async function register(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Registrasi gagal");
  return body.user as { role: string };
}

// ---- Staff management ----
export const staffService = {
  list: () => apiClient<{ users: StaffMember[] }>("/bo/staff").then((r) => r.users),
  create: (data: { name: string; email: string; password: string; role: StaffMember["role"] }) =>
    apiClient("/bo/staff", { method: "POST", body: data }),
  update: (id: number, data: { name?: string; role?: string; isActive?: boolean }) =>
    apiClient(`/bo/staff/${id}`, { method: "PATCH", body: data }),
};
