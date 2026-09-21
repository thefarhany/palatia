"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useOrdersStore } from "@/store/orders-store";
import type { Order as WaiterOrder, OrdersFilter as Filter } from "@/lib/types";
import { rp } from "@/lib/format";
import { STATUS_BADGE } from "@/lib/format";
import { useSocketEvent } from "@/components/providers/socket-provider";
import { OrderBaruDialog } from "@/components/backoffice/waiter/orders/order-baru-dialog";

const ACTIVE = ["PENDING", "PREPARING", "READY", "SERVED"];


export function OrdersClient() {
  const orders = useOrdersStore((st) => st.orders);
  const fetchOrders = useOrdersStore((st) => st.fetch);
  const cancelStore = useOrdersStore((st) => st.cancel);
  const serveStore = useOrdersStore((st) => st.serve);
  const completeStore = useOrdersStore((st) => st.complete);
  const [filter, setFilter] = useState<Filter>("aktif");
  const [query, setQuery] = useState("");
  const [orderBaru, setOrderBaru] = useState(false);
  const [cancelling, setCancelling] = useState<WaiterOrder | null>(null);

  const refetch = fetchOrders;

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Live queue mirror: any order event refreshes the table.
  useSocketEvent("order:created", refetch);
  useSocketEvent("order:status", refetch);
  useSocketEvent("order:paid", refetch);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => {
      if (filter === "aktif" && !ACTIVE.includes(o.status)) return false;
      if (filter === "selesai" && !(o.status === "COMPLETED" && o.createdAt.slice(0, 10) === today))
        return false;
      const q = query.toLowerCase().replace(/^#/, "");
      if (q && !o.code.toLowerCase().includes(q) && !(o.table && String(o.table.number) === q)) return false;
      return true;
    });
  }, [orders, filter, query]);

  const serve = async (o: WaiterOrder) => {
    await serveStore(o.id)
      .then(() => toast.success(`${o.code} diantar ke meja`))
      .catch((e: Error) => toast.error(e.message));
  };

  const complete = async (o: WaiterOrder) => {
    await completeStore(o.id)
      .then(() => toast.success(`${o.code} selesai`))
      .catch((e: Error) => toast.error(e.message));
  };

  const cancel = async (o: WaiterOrder) => {
    await cancelStore(o.id)
      .then(() => toast.success(`${o.code} dibatalkan`))
      .catch((e: Error) => toast.error(e.message));
    setCancelling(null);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2">
        {(
          [
            ["aktif", "Aktif"],
            ["selesai", "Selesai hari ini"],
            ["semua", "Semua"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-[#4f46e5] text-white dark:bg-primary"
                : "border border-[#e4e7ec] bg-white text-[#667085] hover:text-[#17181c] dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Cari order / meja..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 max-w-xs flex-1 rounded-lg"
        />
        <div className="flex-1" />
        <Button className="h-10 rounded-[10px]" onClick={() => setOrderBaru(true)}>
          <Plus className="size-4" />
          Order Baru
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">ORDER</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">TIPE</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">ITEM</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">TOTAL</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">PEMBAYARAN</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">STATUS</TableHead>
              <TableHead className="text-[11px] font-medium tracking-[1px] text-[#667085]">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-[#667085]">
                  Tidak ada order.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="text-center font-semibold text-[#4f46e5] dark:text-primary">{o.code}</TableCell>
                <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                  {o.type === "DINE_IN" ? "Dine In" : o.type === "TAKEAWAY" ? "Takeaway" : "Pickup"}
                  {o.table ? ` · T${String(o.table.number).padStart(2, "0")}` : ""}
                </TableCell>
                <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{o.items.length} item</TableCell>
                <TableCell className="text-center font-semibold text-[#17181c] dark:text-foreground">{rp.format(o.total)}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                      o.paymentStatus === "PAID" ? "bg-[#067647]" : "bg-[#b54708]"
                    }`}
                  >
                    {o.paymentStatus}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${STATUS_BADGE[o.status]?.cls ?? "bg-[#667085]"}`}
                  >
                    {STATUS_BADGE[o.status]?.label ?? o.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {o.status === "READY" && (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => serve(o)}
                      >
                        Antar ke Meja
                      </Button>
                    )}
                    {o.status === "SERVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => complete(o)}
                      >
                        Selesaikan
                      </Button>
                    )}
                    {o.status === "PENDING" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi ${o.code}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-[#d92d20] focus:text-[#d92d20]"
                            onClick={() => setCancelling(o)}
                          >
                            Batalkan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderBaruDialog open={orderBaru} onOpenChange={setOrderBaru} onCreated={refetch} />

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan {cancelling?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Order hanya bisa dibatalkan sebelum dimasak. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#d92d20] text-white hover:bg-[#b42318]"
              onClick={() => cancelling && cancel(cancelling)}
            >
              Batalkan Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}