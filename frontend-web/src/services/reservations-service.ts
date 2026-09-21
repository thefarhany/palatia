import { apiClient } from "@/lib/api-client";
import type { Reservation } from "@/lib/types";

export interface TableAvailability {
  id: number;
  number: number;
  capacity: number;
  status: string;
  reserved: boolean;
}

export const reservationsService = {
  /** Public: meja + status reserved utk tanggal & slot (UC-07). */
  availability: (date: string, slot: string) =>
    apiClient<{ tables: TableAvailability[] } | TableAvailability[]>(
      `/public/reservations/availability?date=${date}&slot=${encodeURIComponent(slot)}`,
    ).then((r) => (Array.isArray(r) ? r : r.tables)),
  createGuest: (data: {
    tableId: number;
    date: string;
    slot: string;
    guests: number;
    name: string;
    phone: string;
  }) => apiClient("/public/reservations", { method: "POST", body: data }),
  list: () => apiClient<{ reservations: Reservation[] }>("/bo/reservations").then((r) => r.reservations),
  changeStatus: (id: number, status: string) =>
    apiClient(`/bo/reservations/${id}/status`, { method: "PATCH", body: { status } }),
};
