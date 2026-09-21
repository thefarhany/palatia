"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, Receipt, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ordersService } from "@/services/orders-service";
import { rp, tableLabel, STATUS_BADGE, PAID_BADGE } from "@/lib/format";
import type { InvoiceData, Order as WaiterOrder } from "@/lib/types";
import { useOrdersStore } from "@/store/orders-store";
import { useSocketEvent } from "@/components/providers/socket-provider";

type PaymentFilter = "semua" | "unpaid" | "paid";

export function BillingClient({
  orderParam,
  tableParam,
}: {
  orderParam?: string;
  tableParam?: string;
}) {
  const orders = useOrdersStore((st) => st.orders);
  const fetchOrders = useOrdersStore((st) => st.fetch);
  const discountStore = useOrdersStore((st) => st.discount);
  const payStore = useOrdersStore((st) => st.pay);

  const [filter, setFilter] = useState<PaymentFilter>("semua");
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [method, setMethod] = useState<"CASH" | "CARD_AT_COUNTER">("CASH");
  const [busy, setBusy] = useState(false);

  const refetch = fetchOrders;

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Socket live refresh
  useSocketEvent("order:created", refetch);
  useSocketEvent("order:status", refetch);
  useSocketEvent("order:paid", refetch);

  // Auto-select order if query param orderParam or tableParam is passed
  useEffect(() => {
    if (orderParam) {
      setSelectedOrderId(Number(orderParam));
    } else if (tableParam && orders.length > 0) {
      const match = orders.find((o) => o.table?.id === Number(tableParam));
      if (match) setSelectedOrderId(match.id);
    }
  }, [orderParam, tableParam, orders]);

  // Load invoice data when modal opens for an order
  const loadInvoice = useCallback(async (id: number) => {
    setLoadingInvoice(true);
    const data = await ordersService.invoice(id).catch(() => null);
    setInvoice(data);
    setLoadingInvoice(false);
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setInvoice(null);
      return;
    }
    void loadInvoice(selectedOrderId);
  }, [selectedOrderId, loadInvoice]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filter === "unpaid" && o.paymentStatus !== "UNPAID") return false;
      if (filter === "paid" && o.paymentStatus !== "PAID") return false;

      const q = query.toLowerCase().replace(/^#/, "");
      if (
        q &&
        !o.code.toLowerCase().includes(q) &&
        !(o.table && String(o.table.number) === q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, filter, query]);

  return (
    <div className="grid gap-6">
      {/* Header Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(
            [
              ["semua", "Semua Transaksi"],
              ["unpaid", "Belum Bayar (UNPAID)"],
              ["paid", "Lunas (PAID)"],
            ] as [PaymentFilter, string][]
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

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#667085]" />
          <Input
            placeholder="Cari order / meja..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 pl-9 rounded-lg"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                ORDER
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                TIPE & MEJA
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                PEMBAYARAN
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                METODE
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                STATUS ORDER
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                TOTAL
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                AKSI
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-[#667085]"
                >
                  Tidak ada data transaksi billing.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((o) => (
                <TableRow key={o.id} className="hover:bg-[#f9fafb] dark:hover:bg-muted/30">
                  <TableCell className="text-center font-semibold">
                    <button
                      onClick={() => setSelectedOrderId(o.id)}
                      className="text-[#4f46e5] hover:underline dark:text-primary"
                    >
                      {o.code}
                    </button>
                  </TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {o.type === "DINE_IN" ? "Dine In" : o.type === "TAKEAWAY" ? "Takeaway" : "Pickup"}
                    {o.table ? ` · T${String(o.table.number).padStart(2, "0")}` : ""}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${PAID_BADGE(
                        o.paymentStatus
                      )}`}
                    >
                      {o.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs font-medium text-[#667085] dark:text-muted-foreground">
                    {o.paymentMethod === "CASH"
                      ? "Tunai"
                      : o.paymentMethod === "CARD_AT_COUNTER"
                      ? "Kartu"
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                        STATUS_BADGE[o.status]?.cls ?? "bg-[#667085]"
                      }`}
                    >
                      {STATUS_BADGE[o.status]?.label ?? o.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-[#17181c] dark:text-foreground">
                    {rp.format(o.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={() => setSelectedOrderId(o.id)}
                    >
                      <Receipt className="mr-1.5 size-3.5" />
                      {o.paymentStatus === "UNPAID" && o.status !== "CANCELLED"
                        ? "Bayar / Struk"
                        : "Lihat Struk"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Popup Modal Struk / Receipt View */}
      <Dialog
        open={!!selectedOrderId}
        onOpenChange={(v) => !v && setSelectedOrderId(null)}
      >
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Receipt className="size-5 text-[#4f46e5]" />
              Struk Belanja — {selectedOrder?.code}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#667085]">
              {selectedOrder?.table
                ? `Meja ${tableLabel(selectedOrder.table.number)}`
                : selectedOrder?.type}{" "}
              · Tanggal: {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString("id-ID") : "—"}
            </DialogDescription>
          </DialogHeader>

          {loadingInvoice || !invoice ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              {/* Item List */}
              <div className="max-h-52 overflow-y-auto divide-y divide-[#e4e7ec] rounded-lg border border-[#e4e7ec] p-3 text-sm dark:divide-border dark:border-border">
                {invoice.items.map((item, i) => (
                  <div key={i} className="py-2 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between font-medium">
                      <p className="text-[#17181c] dark:text-foreground">
                        {item.qty}× {item.name}
                      </p>
                      <p className="text-[#17181c] dark:text-foreground">
                        {rp.format(item.unitPrice * item.qty)}
                      </p>
                    </div>
                    {item.notes && (
                      <p className="pl-4 text-xs text-[#667085] dark:text-muted-foreground">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="grid gap-1.5 rounded-lg bg-[#f9fafb] p-4 text-sm dark:bg-muted/40">
                <div className="flex justify-between">
                  <p className="text-[#667085] dark:text-muted-foreground">Subtotal</p>
                  <p className="font-medium text-[#17181c] dark:text-foreground">
                    {rp.format(invoice.subtotal)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[#667085] dark:text-muted-foreground">PPN (GST) 10%</p>
                  <p className="font-medium text-[#17181c] dark:text-foreground">
                    {rp.format(invoice.tax)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[#667085] dark:text-muted-foreground">Service Charge 5%</p>
                  <p className="font-medium text-[#17181c] dark:text-foreground">
                    {rp.format(invoice.serviceCharge)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[#667085] dark:text-muted-foreground">Diskon</p>
                  {invoice.paymentStatus !== "PAID" && invoice.status !== "COMPLETED" ? (
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Rp 0"
                      className="h-8 w-28 text-right text-sm"
                      disabled={busy}
                      onBlur={(e) =>
                        e.target.value !== "" &&
                        selectedOrder &&
                        discountStore(selectedOrder.id, Number(e.target.value) || 0)
                          .then(() => {
                            toast.success("Diskon diterapkan");
                            loadInvoice(selectedOrder.id);
                          })
                          .catch((err: Error) => toast.error(err.message))
                      }
                    />
                  ) : (
                    <p className="font-medium text-[#067647]">−{rp.format(invoice.discount)}</p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[#e4e7ec] pt-2 dark:border-border">
                  <p className="font-bold text-[#17181c] dark:text-foreground">TOTAL HARGA</p>
                  <p className="text-lg font-bold text-[#4f46e5] dark:text-primary">
                    {rp.format(invoice.total)}
                  </p>
                </div>
              </div>

              {/* Payment Status / Action */}
              {invoice.paymentStatus === "PAID" ? (
                <div className="rounded-lg bg-[#067647]/10 p-3 text-center text-sm font-semibold text-[#067647]">
                  ✓ Lunas ({invoice.paymentMethod === "CASH" ? "Tunai" : "Kartu"})
                </div>
              ) : invoice.status === "CANCELLED" ? (
                <div className="rounded-lg bg-[#c0392b]/10 p-3 text-center text-sm font-semibold text-[#c0392b]">
                  ✕ Order Dibatalkan (CANCELLED)
                </div>
              ) : (
                <div className="grid gap-2 border-t border-[#e4e7ec] pt-3 dark:border-border">
                  <p className="text-xs font-medium text-[#667085] dark:text-muted-foreground">
                    Pilih Metode Pembayaran:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["CASH", "💵 Tunai"],
                        ["CARD_AT_COUNTER", "💳 Kartu"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMethod(key)}
                        className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                          method === key
                            ? "bg-[#4f46e5] text-white dark:bg-primary"
                            : "border border-[#e4e7ec] bg-white text-[#667085] dark:border-border dark:bg-card dark:text-muted-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="mt-1 w-full rounded-[10px]"
                    onClick={async () => {
                      if (!selectedOrder) return;
                      setBusy(true);
                      await payStore(selectedOrder.id, method)
                        .then(() => {
                          toast.success(`Pembayaran ${method === "CASH" ? "tunai" : "kartu"} dicatat`);
                          loadInvoice(selectedOrder.id);
                        })
                        .catch((e: Error) => toast.error(e.message));
                      setBusy(false);
                    }}
                    disabled={busy}
                  >
                    Catat Pembayaran
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-2 flex items-center justify-between gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => {
                if (selectedOrder) {
                  window.open(`/print/invoice?order=${selectedOrder.id}`, "_blank", "noopener");
                }
              }}
            >
              <Printer className="mr-1.5 size-3.5" />
              Cetak Struk
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => setSelectedOrderId(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}