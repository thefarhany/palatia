import { create } from "zustand";
import { reportsService } from "@/services/reports-service";
import type { DailyReport, PopularItem } from "@/lib/types";

interface ReportsState {
  series: (DailyReport | null)[];
  days: Date[];
  popular: PopularItem[];
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useReportsStore = create<ReportsState>()((set) => ({
  series: [],
  days: [],
  popular: [],
  loaded: false,
  fetch: async () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const [series, popular] = await Promise.all([
      Promise.all(days.map((d) => reportsService.daily(d.toISOString().slice(0, 10)).catch(() => null))),
      reportsService.popular(30),
    ]);
    set({ series, days, popular, loaded: true });
  },
}));
