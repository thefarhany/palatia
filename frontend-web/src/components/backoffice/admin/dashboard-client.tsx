"use client";

import { useEffect } from "react";
import { useOrdersStore } from "@/store/orders-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useReservationsStore } from "@/store/reservations-store";
import { useReportsStore } from "@/store/reports-store";
import { rp, STATUS_BADGE } from "@/lib/format";

function StatCard({
  label,
  value,
  sub,
  subCls,
}: {
  label: string;
  value: string;
  sub?: string;
  subCls?: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-[#e4e7ec] bg-white px-5 py-[18px] dark:border-border dark:bg-card">
      <p className="text-[11px] font-medium tracking-[1px] text-[#667085] dark:text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[26px] font-semibold text-[#17181c] dark:text-foreground">{value}</p>
      {sub && <p className={`mt-1 text-xs font-medium ${subCls}`}>{sub}</p>}
    </div>
  );
}

export function DashboardClient() {
  const orders = useOrdersStore((st) => st.orders);
  const fetchOrders = useOrdersStore((st) => st.fetch);
  const ingredients = useInventoryStore((st) => st.ingredients);
  const fetchInventory = useInventoryStore((st) => st.fetch);
  const reservations = useReservationsStore((st) => st.reservations);
  const fetchReservations = useReservationsStore((st) => st.fetch);
  const series = useReportsStore((st) => st.series);
  const popular = useReportsStore((st) => st.popular);
  const fetchReports = useReportsStore((st) => st.fetch);

  useEffect(() => {
    void fetchOrders();
    void fetchInventory();
    void fetchReservations();
    void fetchReports();
  }, [fetchOrders, fetchInventory, fetchReservations, fetchReports]);

  const today = series[6];
  const activeOrders = orders.filter((o) => ["PENDING", "PREPARING", "READY"].includes(o.status));
  const lowStock = ingredients.filter((i) => Number(i.stock) < Number(i.reorderLevel));
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayReservations = reservations.filter(
    (r) => r.date.slice(0, 10) === todayKey && ["PENDING", "CONFIRMED", "SEATED"].includes(r.status),
  );
  const tablesLeft = Math.max(0, 10 - todayReservations.length); // ponytail: total meja di-hardcode, ambil dari /bo/tables kalau perlu presisi

  const popularTop = popular.slice(0, 5);
  const maxQty = Math.max(1, ...popularTop.map((p) => p.totalQty));
  const recentOrders = orders.slice(0, 5);

  const revenueToday = today?.revenue ?? 0;
  const revenueYesterday = series[5]?.revenue ?? 0;
  const delta =
    revenueYesterday > 0 ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100) : null;

  return (
    <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
      {/* Stats */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <StatCard
          label="TODAY'S SALES"
          value={rp.format(revenueToday)}
          sub={delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}% vs kemarin`}
          subCls={delta !== null && delta < 0 ? "text-[#d92d20]" : "text-[#067647]"}
        />
        <StatCard
          label="ORDERS"
          value={String(today?.orderCount ?? 0)}
          sub={`${activeOrders.length} sedang berjalan`}
          subCls="text-[#2563eb]"
        />
        <StatCard
          label="RESERVATIONS"
          value={String(todayReservations.length)}
          sub={`${tablesLeft} meja tersisa`}
          subCls="text-[#4f46e5]"
        />
        <StatCard
          label="LOW STOCK"
          value={`${lowStock.length} items`}
          sub={lowStock.length ? "perlu reorder" : "aman"}
          subCls={lowStock.length ? "text-[#d92d20]" : "text-[#067647]"}
        />
      </div>

      {/* Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Dishes */}
        <section className="rounded-xl border border-[#e4e7ec] bg-white p-5 dark:border-border dark:bg-card">
          <h2 className="text-base font-semibold text-[#17181c] dark:text-foreground">Popular Dishes</h2>
          <div className="mt-4 grid gap-4">
            {popularTop.length === 0 && (
              <p className="text-sm text-[#667085] dark:text-muted-foreground">Belum ada data penjualan.</p>
            )}
            {popularTop.map((dish) => (
              <div key={dish.menuItemId} className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#17181c] dark:text-foreground">{dish.name}</p>
                  <p className="text-xs text-[#667085] dark:text-muted-foreground">{dish.totalQty} terjual</p>
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

        {/* Recent Orders */}
        <section className="rounded-xl border border-[#e4e7ec] bg-white p-5 dark:border-border dark:bg-card">
          <h2 className="text-base font-semibold text-[#17181c] dark:text-foreground">Recent Orders</h2>
          <div className="mt-3 grid">
            {recentOrders.length === 0 && (
              <p className="py-4 text-sm text-[#667085] dark:text-muted-foreground">Belum ada order.</p>
            )}
            {recentOrders.map((o) => {
              const badge = STATUS_BADGE[o.status];
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-3 border-b border-[#e4e7ec] py-2.5 last:border-0 dark:border-border"
                >
                  <p className="text-[13px] font-semibold text-[#4f46e5] dark:text-primary">{o.code}</p>
                  <p className="text-[13px] text-[#667085] dark:text-muted-foreground">
                    {o.table ? `Table ${o.table.number}` : o.type === "TAKEAWAY" ? "Takeaway" : "Pickup"}
                  </p>
                  <div className="flex-1" />
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <p className="text-[13px] font-semibold text-[#17181c] dark:text-foreground">{rp.format(o.total)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
