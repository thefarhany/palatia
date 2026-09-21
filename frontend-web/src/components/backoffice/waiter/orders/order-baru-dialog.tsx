"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "sonner";
import { menuService } from "@/services/menu-service";
import { tablesService } from "@/services/tables-service";
import { useOrdersStore } from "@/store/orders-store";
import { tableLabel } from "@/lib/format";
import { rp } from "@/lib/format";
import type { MenuItem, OrderItemRow as Row, Table } from "@/lib/types";

let rowKey = 0;
const newRow = (): Row => ({ key: ++rowKey, menuItemId: null, qty: 1, notes: "" });

export function OrderBaruDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<"DINE_IN" | "PICKUP">("DINE_IN");
  const [tableId, setTableId] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [payMethod, setPayMethod] = useState<"CASH" | "CARD_AT_COUNTER">("CASH");
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [saving, setSaving] = useState(false);

  // Render-time sync on open — replaces an effect (react-hooks rule).
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setLastOpen(true);
    setRows([newRow()]);
    setType("DINE_IN");
    setPayMethod("CASH");
    void Promise.all([menuService.publicList(), tablesService.list()]).then(([menus, tables]) => {
      setMenus(menus.filter((i) => i.available));
      setTables(tables.filter((x) => x.status === "FREE"));
    });
  }
  if (!open && lastOpen) setLastOpen(false);

  const unitPrice = (row: Row) =>
    row.menuItemId ? Number(menus.find((m) => m.id === row.menuItemId)?.price ?? 0) : 0;
  // Subtotal saja — pajak & service charge dihitung server saat order dibuat.
  const total = rows.reduce((s, r) => s + unitPrice(r) * r.qty, 0);

  const createAndPay = useOrdersStore((st) => st.createAndPay);
  const submit = async () => {
    const items = rows
      .filter((r) => r.menuItemId && r.qty > 0)
      .map((r) => ({
        menuItemId: r.menuItemId!,
        qty: r.qty,
        notes: r.notes.trim() || undefined,
      }));
    if (items.length === 0) {
      toast.error("Minimal 1 item");
      return;
    }
    if (type === "DINE_IN" && !tableId) {
      toast.error("Pilih meja dulu");
      return;
    }
    setSaving(true);
    // Waiter creates + records upfront payment — kitchen gate opens on PAID.
    const created = await createAndPay(
      { type, tableId: type === "DINE_IN" ? (tableId ?? undefined) : undefined, items },
      payMethod,
    ).catch((e: Error) => {
      toast.error(e.message);
      return null;
    });
    if (created) {
      toast.success(`${created.code} dibuat & dibayar (${payMethod === "CASH" ? "tunai" : "kartu"})`);
      onOpenChange(false);
      onCreated();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Baru</DialogTitle>
          <DialogDescription className="sr-only">Buat order atas nama customer</DialogDescription>
        </DialogHeader>

        {/* Type toggle */}
        <div className="grid grid-cols-2 rounded-lg bg-[#f1f2f4] p-1 dark:bg-muted">
          {(
            [
              ["DINE_IN", "Dine In"],
              ["PICKUP", "Pickup"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                type === key ? "bg-[#4f46e5] text-white dark:bg-primary" : "text-[#667085] dark:text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {type === "DINE_IN" && (
          <div>
            <Field>
              <FieldLabel>Meja *</FieldLabel>
              <NativeSelect
                value={tableId ?? ""}
                onChange={(e) => setTableId(Number(e.target.value) || null)}
                className=""
              >
                <option value="">Pilih meja kosong...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {tableLabel(t.number)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <p className="mt-1.5 text-xs text-[#667085] dark:text-muted-foreground">
              hanya untuk Dine In · Pickup tableless
            </p>
          </div>
        )}

        {/* Items */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#17181c] dark:text-foreground">Items</p>
            <p className="text-xs text-[#667085] dark:text-muted-foreground">qty 1–99 · catatan opsional</p>
          </div>
          <div className="mt-2 grid gap-2">
            {rows.map((row) => (
              <div key={row.key} className="grid gap-1.5">
                <div className="flex items-center gap-2">
                  <NativeSelect
                    value={row.menuItemId ?? ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.key === row.key ? { ...r, menuItemId: Number(e.target.value) || null } : r,
                        ),
                      )
                    }
                    className="flex-1"
                  >
                    <option value="">Pilih menu...</option>
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </NativeSelect>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    className="h-10 w-16"
                    value={row.qty}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.key === row.key
                            ? { ...r, qty: Math.min(99, Math.max(1, Number(e.target.value) || 1)) }
                            : r,
                        ),
                      )
                    }
                  />
                  <p className="w-24 text-right text-sm text-[#17181c] dark:text-foreground">
                    {rp.format(unitPrice(row) * row.qty)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus item"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <Input
                  placeholder="catatan: cth. sambal terpisah"
                  className="h-8 text-xs"
                  value={row.notes}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, notes: e.target.value } : r)))
                  }
                />
              </div>
            ))}
            <Button
              variant="link"
              className="h-auto w-fit p-0 text-sm text-[#4f46e5]"
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              <Plus className="size-4" />
              Tambah Item
            </Button>
          </div>
        </div>

        {/* Upfront payment */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#17181c] dark:text-foreground">Pembayaran di muka</p>
            <p className="text-xs font-medium text-[#b54708]">kitchen cuma masak order PAID</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["CASH", "Tunai (CASH)"],
                ["CARD_AT_COUNTER", "Kartu (CARD_AT_COUNTER)"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPayMethod(key)}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  payMethod === key
                    ? "bg-[#4f46e5] text-white dark:bg-primary"
                    : "border border-[#e4e7ec] bg-white text-[#667085] dark:border-border dark:bg-card dark:text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-[#667085] dark:text-muted-foreground">Total dibayar</p>
            <p className="text-base font-semibold text-[#4f46e5] dark:text-primary">{rp.format(total)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Buat Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}