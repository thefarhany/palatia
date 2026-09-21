import { apiClient } from "@/lib/api-client";
import type { Order, Reservation, User } from "@/lib/types";

/** Data milik user yang sedang login (customer). */
export const meService = {
  profile: () => apiClient<{ user: User }>("/me/profile").then((r) => r.user),
  updateProfile: (name: string) =>
    apiClient<{ user: User }>("/me/profile", { method: "PATCH", body: { name } }).then((r) => r.user),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient<{ url: string }>("/me/uploads/avatar", { method: "POST", body: fd });
  },
  orders: () => apiClient<{ orders: Order[] }>("/me/orders").then((r) => r.orders),
  cancelOrder: (id: number) => apiClient(`/me/orders/${id}/cancel`, { method: "PATCH" }),
  reservations: () =>
    apiClient<{ reservations: Reservation[] }>("/me/reservations").then((r) => r.reservations),
  changeReservationStatus: (id: number, status: string) =>
    apiClient(`/me/reservations/${id}/status`, { method: "PATCH", body: { status } }),
};

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}