"use client";

import { useEffect } from "react";
import { useAuditStore } from "@/store/audit-store";

// Badge color by action family.
function actionCls(action: string) {
  if (action.startsWith("order.status")) return "bg-[#2563eb]";
  if (action.startsWith("order.created")) return "bg-[#067647]";
  if (action.startsWith("payment") || action.startsWith("order.paid")) return "bg-[#067647]";
  if (action.startsWith("menu.") || action.startsWith("inventory.")) return "bg-[#b54708]";
  if (action.startsWith("reservation.")) return "bg-[#667085]";
  if (action.startsWith("staff.")) return "bg-[#7c3aed]";
  return "bg-[#667085]";
}

// Human-readable detail line from entity + meta (best effort, generic fallback).
function detail(log: AuditLog) {
  const meta = log.meta ?? {};
  switch (log.action) {
    case "order.status":
      return `#${log.entityId} → ${meta.status ?? ""}`;
    case "order.created":
      return `#${log.entityId}${meta.tableNumber ? ` · Table ${meta.tableNumber}` : ""}`;
    case "menu.updated":
      return `${meta.name ?? `#${log.entityId}`} → ${meta.available ? "available" : "unavailable"}`;
    case "inventory.low":
      return `${meta.name ?? log.entityId}: stok ${meta.stock ?? "?"}`;
    case "purchase_order.created":
      return `Purchase order ${meta.code ?? `#${log.entityId}`} dibuat`;
    case "purchase_order.received":
      return `Purchase order ${meta.code ?? `#${log.entityId}`} diterima`;
    case "reservation.status":
      return `#${log.entityId} → ${meta.status ?? ""}`;
    case "staff.created":
      return `${meta.name ?? ""} sebagai ${meta.role ?? "staff"}`;
    default: {
      const pairs = Object.entries(meta)
        .map(([k, v]) => `${k}=${String(v)}`)
        .slice(0, 3)
        .join(" · ");
      return `${log.entity}${log.entityId ? ` #${log.entityId}` : ""}${pairs ? ` · ${pairs}` : ""}`;
    }
  }
}

import type { AuditLog } from "@/lib/types";

export function AuditClient() {
  const logs = useAuditStore((st) => st.logs);
  const loaded = useAuditStore((st) => st.loaded);
  const fetchLogs = useAuditStore((st) => st.fetch);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafb] dark:bg-muted/50">
              <th className="px-4 py-3 text-center text-[11px] font-medium tracking-[1px] text-[#667085]">WAKTU</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                PENGGUNA
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium tracking-[1px] text-[#667085]">AKSI</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium tracking-[1px] text-[#667085]">DETAIL</th>
            </tr>
          </thead>
          <tbody>
            {!loaded && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-[#667085]">
                  Memuat…
                </td>
              </tr>
            )}
            {loaded && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-[#667085]">
                  Belum ada aktivitas.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[#e4e7ec] dark:border-border">
                <td className="px-4 py-3 text-center whitespace-nowrap text-[#667085] dark:text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-[#17181c] dark:text-foreground">
                  {log.actor.name}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.5px] text-white ${actionCls(log.action)}`}
                  >
                    {log.action.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-[#667085] dark:text-muted-foreground">{detail(log)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#667085] dark:text-muted-foreground">
        100 aksi terakhir — trail aksi sensitif (menu, order, payment, inventory, staff).
      </p>
    </>
  );
}
