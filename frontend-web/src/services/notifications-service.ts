import { apiClient } from "@/lib/api-client";
import type { Notification } from "@/lib/types";

export const notificationsService = {
  list: () =>
    apiClient<{ notifications: Notification[] }>("/me/notifications").then((r) => r.notifications),
  markAll: () => apiClient("/me/notifications/read-all", { method: "PATCH" }),
  markOne: (id: number) => apiClient(`/me/notifications/${id}/read`, { method: "PATCH" }),
};
