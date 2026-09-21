"use client";

import { useEffect, useState } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "sonner";
import { menuService } from "@/services/menu-service";
import { inventoryService } from "@/services/inventory-service";

import type { MenuItem, Ingredient, RecipeRow } from "@/lib/types";
import { toBaseUnit } from "@/lib/format";

let rowKey = 0;
const newRow = (ingredientId: number | null = null, qty = "", unit = "g"): RecipeRow => ({
  key: ++rowKey,
  ingredientId,
  qty,
  unit,
});

/** Konversi antar satuan dalam kelompok yang sama (g↔kg, ml↔L/botol). */
const convertQty = (qty: number, from: string, to: string) => {
  const f = toBaseUnit(from).factor / toBaseUnit(to).factor;
  return qty * f;
};

export function RecipeDialog({
  item,
  mode = "edit",
  onOpenChange,
  onSaved,
}: {
  item: MenuItem | null;
  mode?: "view" | "edit";
  onOpenChange: () => void;
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const open = !!item;

  // Re-fetch recipe and ingredients whenever dialog opens or mode/item changes
  useEffect(() => {
    if (!item) {
      setRows([]);
      return;
    }
    setLoading(true);
    void Promise.all([menuService.getRecipe(item.id), inventoryService.listIngredients()])
      .then(([recipe, ingredients]) => {
        setIngredients(ingredients);
        setRows(
          recipe.length
            ? recipe.map((r) => {
                const ing = ingredients.find((i) => i.id === r.ingredientId);
                const { base, factor } = toBaseUnit(ing?.unit ?? "pcs");
                return newRow(r.ingredientId, String(Number(r.qty) * factor), base);
              })
            : [newRow()],
        );
        setLoading(false);
      })
      .catch((e) => {
        toast.error(e.message);
        setLoading(false);
      });
  }, [item?.id, mode]);

  const save = async () => {
    if (!item) return;
    const selected = rows.filter((r) => r.ingredientId && Number(r.qty) > 0) as {
      key: number;
      ingredientId: number;
      qty: string;
      unit: string;
    }[];
    const dup = selected.length !== new Set(selected.map((r) => r.ingredientId)).size;
    if (dup) {
      toast.error("Ada bahan yang dipilih dua kali");
      return;
    }
    setSaving(true);
    // Input resep dalam satuan dasar (g/ml/pcs) → simpan dalam satuan bahan.
    await menuService.saveRecipe(
      item.id,
      selected.map((r) => {
        const ing = ingredients.find((i) => i.id === r.ingredientId)!;
        return { ingredientId: r.ingredientId, qty: convertQty(Number(r.qty), r.unit, ing.unit) };
      }),
    )
      .then(() => {
        toast.success("Resep disimpan");
        onSaved?.();
      })
      .catch((e) => toast.error(e.message));
    setSaving(false);
    onOpenChange();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kelola Resep — {item?.name}</DialogTitle>
          <DialogDescription>
            Stok bahan berkurang otomatis setiap order COMPLETED.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : mode === "view" ? (
          <div className="grid gap-2">
            {rows.filter((r) => r.ingredientId && Number(r.qty) > 0).length === 0 ? (
              <p className="py-4 text-center text-sm text-[#667085] dark:text-muted-foreground">
                Belum ada resep untuk menu ini.
              </p>
            ) : (
              rows
                .filter((r) => r.ingredientId && Number(r.qty) > 0)
                .map((r) => {
                  const ing = ingredients.find((i) => i.id === r.ingredientId);
                  return (
                    <div
                      key={r.key}
                      className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-3.5 py-2.5 text-sm dark:bg-muted/30"
                    >
                      <p className="text-[#17181c] dark:text-foreground">{ing?.name}</p>
                      <p className="text-[#667085] dark:text-muted-foreground">
                        {Number(r.qty)} {r.unit}
                      </p>
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="flex text-[11px] font-medium tracking-[1px] text-[#667085]">
              <span className="flex-1">BAHAN</span>
              <span className="w-28">QTY</span>
              <span className="w-6" />
            </div>
            {rows.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <SearchableSelect
                  value={row.ingredientId}
                  onChange={(val) => {
                    const ingId = val ? Number(val) : null;
                    const ing = ingredients.find((i) => i.id === ingId);
                    const defaultUnit = ing ? toBaseUnit(ing.unit).base : "g";
                    setRows((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, ingredientId: ingId, unit: defaultUnit } : r,
                      ),
                    );
                  }}
                  options={ingredients.map((ing) => ({
                    value: ing.id,
                    label: ing.name,
                    sublabel: ing.unit,
                  }))}
                  placeholder="Pilih bahan..."
                  searchPlaceholder="Cari bahan..."
                  emptyText="Bahan tidak ditemukan"
                  className="flex-1"
                />
                <div className="flex w-28 items-center gap-1.5 rounded-lg border border-[#e4e7ec] px-2.5 dark:border-border">
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
                </div>
                <span className="flex h-10 min-w-14 items-center justify-center rounded-lg border border-[#e4e7ec] bg-[#f9fafb] px-3 text-xs font-semibold text-[#667085] dark:border-border dark:bg-muted/30 dark:text-muted-foreground">
                  {row.unit}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus baris"
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="link"
              className="h-auto justify-start p-0 text-sm text-[#4f46e5]"
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              <Plus className="size-4" />
              Tambah Bahan
            </Button>
          </div>
        )}
        <DialogFooter>
          {mode === "view" ? (
            <Button variant="outline" onClick={onOpenChange}>
              Tutup
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onOpenChange}>
                Batal
              </Button>
              <Button onClick={save} disabled={saving || loading}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Simpan Resep
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}