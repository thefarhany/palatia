"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { useInventoryStore } from "@/store/inventory-store";
import type { Ingredient } from "@/lib/types";

const ingredientFormSchema = z.object({
  name: z.string().min(1, "Nama bahan wajib diisi").max(100),
  unit: z.string().min(1, "Unit wajib diisi").max(20),
  stock: z.number({ message: "Stok wajib diisi" }).min(0),
  reorderLevel: z.number({ message: "Reorder level wajib diisi" }).min(0),
  supplierName: z.string().max(100).optional(),
  supplierPhone: z.string().max(30).optional(),
});
type IngredientForm = z.infer<typeof ingredientFormSchema>;

// Satuan stok gudang — set tertutup: mencegah typo & satuan liar.
const UNITS = ["kg", "g", "L", "ml", "pcs", "botol", "pack"];

export function IngredientDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Ingredient | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const saveIngredient = useInventoryStore((st) => st.saveIngredient);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<IngredientForm>({ resolver: zodResolver(ingredientFormSchema) });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              name: editing.name,
              unit: editing.unit,
              stock: Number(editing.stock),
              reorderLevel: Number(editing.reorderLevel),
              supplierName: editing.supplierName ?? "",
              supplierPhone: editing.supplierPhone ?? "",
            }
          : {
              name: "",
              unit: "kg",
              stock: 0,
              reorderLevel: 0,
              supplierName: "",
              supplierPhone: "",
            },
      );
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: IngredientForm) => {
    setSaving(true);
    const payload = {
      ...data,
      supplierName: data.supplierName || undefined,
      supplierPhone: data.supplierPhone || undefined,
    };
    await saveIngredient(editing?.id ?? null, payload).catch((e: Error) => {
      setError("name", { message: e.message });
      return null;
    });
    setSaving(false);
    toast.success(editing ? `${data.name} diperbarui` : `${data.name} ditambahkan`);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Tambah Bahan"}</DialogTitle>
          <DialogDescription className="sr-only">Data bahan</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <Field data-invalid={!!errors.name}>
            <FieldLabel>Nama Bahan *</FieldLabel>
            <Input placeholder="cth. Ayam Fillet" {...register("name")} />
            {errors.name && <p className="text-xs text-[#d92d20]">{errors.name.message}</p>}
          </Field>
          <Field data-invalid={!!errors.unit}>
            <FieldLabel>Unit *</FieldLabel>
            <NativeSelect {...register("unit")}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </NativeSelect>
            {errors.unit && <p className="text-xs text-[#d92d20]">{errors.unit.message}</p>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.stock}>
              <FieldLabel>Stok Awal *</FieldLabel>
              <Input type="number" min={0} step="any" {...register("stock", { valueAsNumber: true })} />
              {errors.stock && <p className="text-xs text-[#d92d20]">{errors.stock.message}</p>}
            </Field>
            <Field data-invalid={!!errors.reorderLevel}>
              <FieldLabel>Reorder Level *</FieldLabel>
              <Input
                type="number"
                min={0}
                step="any"
                {...register("reorderLevel", { valueAsNumber: true })}
              />
              {errors.reorderLevel && <p className="text-xs text-[#d92d20]">{errors.reorderLevel.message}</p>}
            </Field>
          </div>
          <Field>
            <FieldLabel>Nama Supplier</FieldLabel>
            <Input placeholder="Opsional — cth. PT Sumber Pangan" {...register("supplierName")} />
          </Field>
          <Field>
            <FieldLabel>Telepon Supplier</FieldLabel>
            <Input placeholder="Opsional — cth. 0812..." {...register("supplierPhone")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}