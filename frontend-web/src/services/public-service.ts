import { apiClient } from "@/lib/api-client";

export interface ResolvedTable {
  tableId: number;
  number: number;
  capacity: number;
  status: string;
}

/** Public endpoint — tanpa auth. Token dari QR di meja. */
export const publicService = {
  tableByToken: (token: string) =>
    apiClient<{ table: ResolvedTable }>(`/public/table/${token}`)
      .then((r) => r.table)
      .catch(() => null),
};
