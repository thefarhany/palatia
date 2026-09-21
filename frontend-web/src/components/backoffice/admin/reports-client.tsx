"use client";

import { useEffect } from "react";
import { useReportsStore } from "@/store/reports-store";
import { rp } from "@/lib/format";

export function ReportsClient() {
  const series = useReportsStore((st) => st.series);
  const days = useReportsStore((st) => st.days);
  const popular = useReportsStore((st) => st.popular);
  const loaded = useReportsStore((st) => st.loaded);
  const fetchReports = useReportsStore((st) => st.fetch);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const today = series[6];
  const maxRevenue = Math.max(1, ...series.map((s) => s?.revenue ?? 0));
  const maxQty = Math.max(1, ...popular.map((p) => p.totalQty));

  const statCards = [
    { label: "PENDAPATAN HARI INI", value: rp.format(today?.revenue ?? 0) },
    { label: "ORDER SELESAI", value: String(today?.orderCount ?? 0) },
    { label: "TOTAL DISKON", value: rp.format(today?.discounts ?? 0) },
    { label: "TOTAL PPN", value: rp.format(today?.tax ?? 0) },
  ];

  return (
    <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
      {/* Stat cards */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="flex-1 rounded-xl border border-[#e4e7ec] bg-white px-5 py-[18px] dark:border-border dark:bg-card"
          >
            <p className="text-[11px] font-medium tracking-[1px] text-[#667085] dark:text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-1.5 text-[26px] font-semibold text-[#17181c] dark:text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Daily sales */}
      <section className="rounded-xl border border-[#e4e7ec] bg-white p-5 dark:border-border dark:bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#17181c] dark:text-foreground">Penjualan Harian</h2>
          <p className="text-xs text-[#667085] dark:text-muted-foreground">7 hari terakhir</p>
        </div>
        <div className="mt-6 flex h-48 items-end justify-between gap-3">
          {series.map((day, i) => {
            const height = ((day?.revenue ?? 0) / maxRevenue) * 100;
            return (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <p className="text-[10px] text-[#667085] dark:text-muted-foreground" suppressHydrationWarning>
                  {day && day.revenue > 0 ? rp.format(day.revenue) : ""}
                </p>
                <div
                  title={`${day ? day.revenue.toLocaleString("id-ID") : 0}`}
                  className={`w-full max-w-10 rounded-t-md ${
                    i === 6 ? "bg-[#4f46e5]" : "bg-[#c7d2fe]"
                  } dark:bg-primary/90`}
                  style={{ height: `${Math.max(day && day.revenue > 0 ? 4 : 1, height)}%` }}
                />
                <p className="text-xs text-[#667085] dark:text-muted-foreground">
                  {days[i]?.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular dishes */}
      <section className="rounded-xl border border-[#e4e7ec] bg-white p-5 dark:border-border dark:bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#17181c] dark:text-foreground">Menu Terpopuler</h2>
          <p className="text-xs text-[#667085] dark:text-muted-foreground">30 hari terakhir</p>
        </div>
        <div className="mt-4 grid gap-4">
          {popular.length === 0 && (
            <p className="text-sm text-[#667085] dark:text-muted-foreground">Belum ada data penjualan.</p>
          )}
          {popular.map((dish) => (
            <div key={dish.menuItemId} className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#17181c] dark:text-foreground">{dish.name}</p>
                <p className="text-xs text-[#667085] dark:text-muted-foreground">{dish.totalQty} porsi</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#f1f2f4] dark:bg-muted">
                <div
                  className="h-full rounded-full bg-[#4f46e5] dark:bg-primary"
                  style={{ width: `${(dish.totalQty / maxQty) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      {!loaded && <p className="text-xs text-[#667085]">Memuat…</p>}
    </main>
  );
}
