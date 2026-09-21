"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSocketEvent } from "@/components/providers/socket-provider";
import { useNotifsStore } from "@/store/notifications-store";

// Human title/subtitle per notification type (payload shapes from server services).
function describe(type: string, p: Record<string, unknown>): { title: string; sub: string } {
  switch (type) {
    case "order:new":
      return { title: "Order baru", sub: `${p.code ?? ""} · ${p.type ?? ""}` };
    case "order:status":
      return { title: "Order diperbarui", sub: `ORD → ${p.status ?? ""}` };
    case "payment:recorded":
      return { title: "Pembayaran dicatat", sub: `#${p.orderId ?? ""}` };
    case "inventory:low":
      return {
        title: "Stok menipis",
        sub: `${p.name} ${p.stock} ${p.unit} — di bawah reorder level ${p.reorderLevel}`,
      };
    case "inventory:received":
      return { title: "Purchase order diterima", sub: `${p.code ?? ""}` };
    case "reservation:new":
      return {
        title: "Reservasi baru",
        sub: `${p.slot ?? ""} · ${p.guests ?? ""} orang · T-${String(p.tableNumber ?? "").padStart(2, "0")}`,
      };
    case "reservation:status":
      return { title: "Reservasi diperbarui", sub: `→ ${p.status ?? ""}` };
    default:
      return { title: type, sub: "" };
  }
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "baru";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}j`;
  return `${Math.floor(h / 24)}h`;
}

export function NotifButton() {
  const [open, setOpen] = useState(false);
  const items = useNotifsStore((st) => st.items);
  const refetch = useNotifsStore((st) => st.fetch);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Realtime push (room user:{id}) — badge updates even when closed.
  useSocketEvent("notification", refetch);

  const unread = items.filter((n) => !n.read).length;

  const markAll = useNotifsStore((st) => st.markAll);
  const markOne = useNotifsStore((st) => st.markOne);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) void refetch();
      }}
    >
      <PopoverTrigger asChild>
        <button
          aria-label="Notifikasi"
          className="relative grid size-10 place-items-center rounded-full border border-[#e4e7ec] bg-[#f1f2f4] text-[#17181c] transition-colors hover:bg-[#e9eaec] dark:border-border dark:bg-muted dark:text-foreground dark:hover:bg-muted/70"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-2 top-2 grid size-3 place-items-center rounded-full bg-[#d92d20] text-[8px] font-bold text-white">
              {unread > 9 ? "9" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-[#e4e7ec] px-5 py-4 dark:border-border">
          <p className="text-base font-semibold text-[#17181c] dark:text-foreground">Notifikasi</p>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-sm font-medium text-[#4f46e5] hover:underline dark:text-primary"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-[#667085] dark:text-muted-foreground">
              Belum ada notifikasi.
            </p>
          )}
          {items.map((n) => {
            const { title, sub } = describe(n.type, n.payload ?? {});
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 border-b border-[#e4e7ec] px-5 py-3.5 last:border-0 dark:border-border"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-[#4f46e5]"}`}
                />
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => !n.read && markOne(n.id)}
                >
                  <p className="text-sm font-semibold text-[#17181c] dark:text-foreground">{title}</p>
                  <p className="mt-0.5 text-[13px] text-[#667085] dark:text-muted-foreground">{sub}</p>
                </button>
                <p className="shrink-0 text-xs text-[#667085] dark:text-muted-foreground" suppressHydrationWarning>
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}