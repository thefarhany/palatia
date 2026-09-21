"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useOrdersStore } from "@/store/orders-store";
import type { Order } from "@/lib/types";
import { PAID_BADGE } from "@/lib/format";
import { useSocketEvent } from "@/components/providers/socket-provider";
import { ChefHeader } from "@/components/backoffice/kitchen/chef-header";

// ---- Types (mirror of orderService.orderView) ----

const BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-[#b54708]" },
  PREPARING: { label: "Preparing", cls: "bg-[#2563eb]" },
  READY: { label: "Ready", cls: "bg-[#067647]" },
};
function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return mins === 0 ? "baru saja" : `${mins} min ago`;
}

function OrderCard({
  order,
  action,
}: {
  order: Order;
  action?: { label: string; onClick: () => void; busy: boolean };
}) {
  const badge = BADGE[order.status];
  const place = order.table ? `Table ${order.table.number}` : order.type === "TAKEAWAY" ? "Takeaway" : "Pickup";

  return (
    <div className="grid gap-2.5 rounded-xl border border-[#e4e7ec] bg-white p-4 dark:border-border dark:bg-card">
      {/* Head */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xl font-semibold text-[#17181c] dark:text-foreground">{order.code}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${badge?.cls ?? "bg-[#667085]"}`}>
          {badge?.label ?? order.status}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${PAID_BADGE(order.paymentStatus)}`}>
          {order.paymentStatus}
        </span>
      </div>
      {/* Meta */}
      <p className="text-[13px] text-[#667085] dark:text-muted-foreground" suppressHydrationWarning>
        <span className="font-medium">{place}</span> · <TimeAgo iso={order.createdAt} />
      </p>
      {/* Items */}
      <div className="grid gap-1.5">
        {order.items.map((item) => (
          <div key={item.id}>
            <p className="text-sm text-[#17181c] dark:text-foreground">
              {item.qty}×&nbsp;&nbsp;{item.menuItem.name}
            </p>
            {item.notes && (
              <p className="pl-6 text-xs text-[#667085] dark:text-muted-foreground">{item.notes}</p>
            )}
          </div>
        ))}
      </div>
      {/* Action */}
      {action ? (
        <button
          onClick={action.onClick}
          disabled={action.busy}
          className="flex items-center justify-center gap-2 rounded-[10px] bg-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338ca] disabled:opacity-70 dark:bg-primary dark:hover:bg-primary/90"
        >
          {action.busy && <Loader2 className="size-4 animate-spin" />}
          {action.label}
        </button>
      ) : (
        <div className="flex items-center justify-center rounded-[10px] border border-[#d0d5dd] bg-[#f1f2f4] px-5 py-2.5 text-sm font-semibold text-[#17181c] dark:border-border dark:bg-muted dark:text-foreground">
          Tunggu Waiter
        </div>
      )}
    </div>
  );
}

function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => timeAgo(iso));
  useEffect(() => {
    const t = setInterval(() => setLabel(timeAgo(iso)), 60_000);
    return () => clearInterval(t);
  }, [iso]);
  return <span suppressHydrationWarning>{label}</span>;
}

function Clock() {
  const [now, setNow] = useState(() =>
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () => setNow(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })),
      10_000,
    );
    return () => clearInterval(t);
  }, []);
  return <span suppressHydrationWarning>{now}</span>;
}

const COLUMNS = [
  { key: "PENDING", title: "NEW", dot: "bg-[#b54708]" },
  { key: "PREPARING", title: "PREPARING", dot: "bg-[#2563eb]" },
  { key: "READY", title: "READY", dot: "bg-[#067647]" },
] as const;

export default function KitchenPage() {
  const orders = useOrdersStore((st) => st.orders);
  const loaded = useOrdersStore((st) => st.loaded);
  const fetchOrders = useOrdersStore((st) => st.fetch);
  const [busyId, setBusyId] = useState<number | null>(null);
  const refetch = fetchOrders;

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // Live: any order event refreshes the board.
  useSocketEvent("order:created", refetch);
  useSocketEvent("order:status", refetch);
  useSocketEvent("order:paid", refetch);

  const setStatus = useOrdersStore((st) => st.setStatus);
  const startCooking = async (id: number) => {
    setBusyId(id);
    await setStatus(id, "PREPARING");
    setBusyId(null);
  };
  const markReady = async (id: number) => {
    setBusyId(id);
    await setStatus(id, "READY");
    setBusyId(null);
  };

  return (
    <div className="flex min-h-svh flex-col bg-[#f7f8fa] dark:bg-background">
      {/* Chef Header */}
      <ChefHeader />

      {/* Columns */}
      <main className="grid flex-1 gap-4 p-6 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <section
              key={col.key}
              className="flex flex-col gap-3 rounded-xl bg-[#f1f2f4] p-4 dark:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${col.dot}`} />
                <p className="text-[13px] font-semibold tracking-[1.5px] text-[#667085] dark:text-muted-foreground">
                  {col.title}
                </p>
              </div>
              {!loaded ? (
                <div className="grid place-items-center py-10 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : colOrders.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-[#667085] dark:text-muted-foreground">
                  Kosong
                </p>
              ) : (
                colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    action={
                      col.key === "PENDING" && order.paymentStatus === "PAID"
                        ? { label: "Mulai Masak", onClick: () => startCooking(order.id), busy: busyId === order.id }
                        : col.key === "PREPARING"
                          ? { label: "Mark Ready", onClick: () => markReady(order.id), busy: busyId === order.id }
                          : undefined
                    }
                  />
                ))
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}