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
import { useStaffStore } from "@/store/staff-store";
import type { StaffMember } from "@/lib/types";

const staffFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  role: z.enum(["ADMIN", "CHEF", "WAITER"], { message: "Role wajib dipilih" }),
});
type StaffForm = z.infer<typeof staffFormSchema>;

export function StaffDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: StaffMember | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const saveStaff = useStaffStore((st) => st.save);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StaffForm>({ resolver: zodResolver(staffFormSchema) });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? { name: editing.name, email: editing.email, password: "", role: editing.role }
          : { name: "", email: "", password: "", role: undefined as unknown as StaffForm["role"] },
      );
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: StaffForm) => {
    setSaving(true);
    await saveStaff(editing?.id ?? null, data).catch((e: Error) => {
      setError("email", { message: e.message });
      return null;
    });
    setSaving(false);
    toast.success(editing ? `${data.name} diperbarui` : `${data.name} ditambahkan sebagai ${data.role}`);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Tambah Staff"}</DialogTitle>
          <DialogDescription className="sr-only">Data staff</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <Field data-invalid={!!errors.name}>
            <FieldLabel>Nama *</FieldLabel>
            <Input placeholder="cth. Rina Kusuma" {...register("name")} />
            {errors.name && <p className="text-xs text-[#d92d20]">{errors.name.message}</p>}
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel>Email *</FieldLabel>
            <Input
              type="email"
              placeholder="cth. rina@palatia.id"
              disabled={!!editing}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-[#d92d20]">{errors.email.message}</p>}
            {editing && (
              <p className="text-xs text-[#667085] dark:text-muted-foreground">
                Email tidak bisa diubah.
              </p>
            )}
          </Field>
          {!editing && (
            <Field data-invalid={!!errors.password}>
              <FieldLabel>Password *</FieldLabel>
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-[#d92d20]">{errors.password.message}</p>}
            </Field>
          )}
          <Field data-invalid={!!errors.role}>
            <FieldLabel>Role *</FieldLabel>
            <NativeSelect {...register("role")}>
              <option value="">Pilih role...</option>
              <option value="ADMIN">Admin</option>
              <option value="CHEF">Chef</option>
              <option value="WAITER">Waiter</option>
            </NativeSelect>
            {errors.role && <p className="text-xs text-[#d92d20]">{errors.role.message}</p>}
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