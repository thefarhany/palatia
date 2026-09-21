import { apiClient } from "@/lib/api-client";
import type { Table } from "@/lib/types";

export const tablesService = {
  list: () =>
    apiClient<{ tables: Table[] }>("/bo/tables").then((r) => r.tables),

  create: (data: { number: number; capacity: number }) =>
    apiClient("/bo/tables", { method: "POST", body: data }),

  update: (id: number, data: Record<string, unknown>) =>
    apiClient(`/bo/tables/${id}`, { method: "PATCH", body: data }),

  rotateQr: (id: number) =>
    apiClient(`/bo/tables/${id}/qr`, { method: "POST" }),
};
