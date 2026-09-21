"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ComboSelect } from "@/components/ui/combo-select";
import { toast } from "sonner";
import { useInventoryStore } from "@/store/inventory-store";
import { rp } from "@/lib/format";
import type { Ingredient, PoRow } from "@/lib/types";

let rowKey = 0;
const newRow = (): PoRow => ({ key: ++rowKey, ingredientId: null, qty: "", unitCost: "" });

export function PoDialog({
  open,
  onOpenChange,
  ingredients,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredients: Ingredient[];
  onSaved: () => void;
}) {
  const [supplier, setSupplier] = useState("");
  const [rows, setRows] = useState<PoRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const createPOStore = useInventoryStore((st) => st.createPO);

  const suppliers = [...new Set(ingredients.map((i) => i.supplierName).filter(Boolean))] as string[];

  const total = rows.reduce(
    (s, r) => (r.ingredientId && Number(r.qty) > 0 ? s + Number(r.qty) * (Number(r.unitCost) || 0) : s),
    0,
  );

  const save = async () => {
    const items = rows
      .filter((r) => r.ingredientId && Number(r.qty) > 0)
      .map((r) => ({ ingredientId: r.ingredientId!, qty: Number(r.qty), unitCost: Number(r.unitCost) || 0 }));
    if (!supplier.trim()) {
      toast.error("Supplier wajib diisi");
      return;
    }
    if (items.length === 0) {
      toast.error("Minimal 1 item PO");
      return;
    }
    setSaving(true);
    await createPOStore(supplier, items)
      .then(() => toast.success("Purchase order dibuat"))
      .catch((e: Error) => toast.error(e.message));
    setSaving(false);
    onOpenChange(false);
    setSupplier("");
    setRows([newRow()]);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Purchase Order</DialogTitle>
          <DialogDescription>
            Transaksi pengadaan — stok baru bertambah saat PO diterima (Receive).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field>
            <FieldLabel>Supplier *</FieldLabel>
            <ComboSelect
              value={supplier}
              onChange={setSupplier}
              options={suppliers}
              placeholder="Pilih supplier, atau ketik baru..."
              searchPlaceholder="Cari supplier..."
            />
          </Field>

          <div className="grid gap-2">
            {rows.map((row) => {
              const unit = ingredients.find((i) => i.id === row.ingredientId)?.unit ?? "";
              return (
                <div key={row.key} className="flex items-center gap-2">
                  <SearchableSelect
                    value={row.ingredientId}
                    onChange={(val) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.key === row.key ? { ...r, ingredientId: val ? Number(val) : null } : r,
                        ),
                      )
                    }
                    options={ingredients.map((i) => ({
                      value: i.id,
                      label: i.name,
                      sublabel: i.unit,
                    }))}
                    placeholder="Pilih bahan..."
                    searchPlaceholder="Cari bahan..."
                    emptyText="Bahan tidak ditemukan"
                    className="flex-1"
                  />
                  <div className="flex w-24 items-center gap-1.5 rounded-lg border border-[#e4e7ec] px-2.5 dark:border-border">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      className="h-10 border-0 bg-transparent px-0 [appearance:textfield] focus-visible:ring-0 dark:bg-transparent"
                      value={row.qty}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) => (r.key === row.key ? { ...r, qty: e.target.value } : r)),
                        )
                      }
                    />
                    <span className="shrink-0 text-xs text-[#667085]">{unit}</span>
                  </div>
                  <CurrencyInput
                    value={Number(row.unitCost) || undefined}
                    onValueChange={(v) =>
                      setRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, unitCost: String(v) } : r)),
                      )
                    }
                    className="w-28"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus baris"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              );
            })}
            <Button
              variant="link"
              className="h-auto w-fit p-0 text-sm text-[#4f46e5]"
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              <Plus className="size-4" />
              Tambah Item
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#667085] dark:text-muted-foreground">Total PO</p>
            <p className="text-base font-semibold text-[#4f46e5] dark:text-primary">{rp.format(total)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Buat PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}