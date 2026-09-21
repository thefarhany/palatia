import { apiClient } from "@/lib/api-client";
import type { DailyReport, PopularItem } from "@/lib/types";

export const reportsService = {
  daily: (date?: string) =>
    apiClient<{ report: DailyReport }>(
      `/bo/reports/sales/daily${date ? `?date=${date}` : ""}`,
    ).then((r) => r.report),
  popular: (days = 30) =>
    apiClient<{ report: PopularItem[] }>(`/bo/reports/sales/popular?days=${days}`)
      .then((r) => r.report)
      .catch(() => [] as PopularItem[]),
};
