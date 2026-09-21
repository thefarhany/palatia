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
import { toast } from "sonner";
import { useTablesStore } from "@/store/tables-store";
import { tableLabel } from "@/lib/format";
import type { TableRow } from "@/lib/types";

const tableFormSchema = z.object({
  number: z
    .number({ message: "Nomor meja wajib diisi" })
    .int()
    .positive("Nomor harus lebih dari 0"),
  capacity: z
    .number({ message: "Kapasitas wajib diisi" })
    .int()
    .min(1, "Minimal 1")
    .max(50, "Maksimal 50"),
});
type TableForm = z.infer<typeof tableFormSchema>;

export function TableFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: TableRow | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TableForm>({ resolver: zodResolver(tableFormSchema) });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? { number: editing.number, capacity: editing.capacity }
          : { number: undefined as unknown as number, capacity: 4 },
      );
    }
  }, [open, editing, reset]);

  const saveTable = useTablesStore((st) => st.save);
  const onSubmit = async (data: TableForm) => {
    setSaving(true);
    await saveTable(editing?.id ?? null, data).catch((e: Error) => {
      setError("number", { message: e.message });
      return null;
    });
    setSaving(false);
    toast.success(editing ? `${tableLabel(data.number)} diperbarui` : `${tableLabel(data.number)} ditambahkan`);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${tableLabel(editing.number)}` : "Tambah Meja"}</DialogTitle>
          <DialogDescription className="sr-only">Data meja</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <Field data-invalid={!!errors.number}>
            <FieldLabel>Nomor Meja *</FieldLabel>
            <Input
              type="number"
              min={1}
              placeholder="cth. 9"
              {...register("number", { valueAsNumber: true })}
            />
            {errors.number && <p className="text-xs text-[#d92d20]">{errors.number.message}</p>}
          </Field>
          <Field data-invalid={!!errors.capacity}>
            <FieldLabel>Kapasitas *</FieldLabel>
            <Input
              type="number"
              min={1}
              max={50}
              placeholder="cth. 4"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && <p className="text-xs text-[#d92d20]">{errors.capacity.message}</p>}
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