"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/ui/switch";
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
import { apiClient } from "@/lib/api-client";
import type { MenuItem } from "@/lib/types";

const menuSchema = z.object({
  name: z.string().min(1, "Nama menu wajib diisi").max(150),
  category: z.string().min(1, "Kategori wajib diisi").max(50),
  price: z
    .number({ message: "Harga wajib diisi" })
    .positive("Harga harus lebih dari 0"),
  description: z.string().max(1000).optional(),
});
type MenuForm = z.infer<typeof menuSchema>;

const DEFAULT_CATEGORIES = [
  "Main Course",
  "Appetizer",
  "Beverage",
  "Dessert",
  "Side Dish",
  "Snack",
];

export function MenuFormDialog({
  open,
  onOpenChange,
  editing,
  categories = [],
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: MenuItem | null;
  categories: string[];
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors },
  } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: { name: "", category: "", price: undefined as unknown as number, description: "" },
  });

  const selectedCategory = watch("category");

  // Merge default preset categories with existing categories from DB
  const allCategories = useMemo(() => {
    return Array.from(
      new Set([...DEFAULT_CATEGORIES, ...(categories || [])])
    ).filter(Boolean);
  }, [categories]);

  // Reset form and state whenever dialog opens or editing item changes
  useEffect(() => {
    if (!open) return;
    const existingCat = editing?.category ?? "";
    const isCustom = !!existingCat && !allCategories.includes(existingCat);
    setIsCustomCategory(isCustom);
    reset({
      name: editing?.name ?? "",
      category: existingCat,
      price: editing ? Number(editing.price) : (undefined as unknown as number),
      description: editing?.description ?? "",
    });
    setImageUrl(editing?.imageUrl ?? null);
    setAvailable(editing?.available ?? true);
  }, [open, editing, reset]);

  const upload = async (file: File) => {
    const fd = new FormData();
    const currentName = getValues("name") || editing?.name || "";
    if (currentName) {
      fd.append("name", currentName);
    }
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await apiClient<{ url: string }>("/bo/uploads/menu", { method: "POST", body: fd });
      setImageUrl(res.url);
      toast.success("Foto terupload");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setUploading(false);
  };

  const onSubmit = async (data: MenuForm) => {
    setSaving(true);
    const payload = { ...data, available, imageUrl: imageUrl ?? undefined };
    const res = await (editing
      ? apiClient<{ item: MenuItem }>(`/bo/menu/${editing.id}`, { method: "PATCH", body: payload })
      : apiClient<{ item: MenuItem }>("/bo/menu", { method: "POST", body: payload })
    ).catch((e: Error & { details?: Record<string, string[]> }) => {
      // Server-side field errors → masing-masing field; sisanya toast.
      const details = e.details;
      if (details) {
        for (const [field, msgs] of Object.entries(details)) {
          if (field === "name" || field === "category" || field === "price" || field === "description") {
            setError(field, { message: msgs[0] });
          }
        }
      } else {
        toast.error(e.message);
      }
      return null;
    });
    setSaving(false);
    if (!res) return;
    toast.success(editing ? "Menu diperbarui" : "Menu ditambahkan");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Menu" : "Tambah Menu"}</DialogTitle>
          <DialogDescription className="sr-only">
            {editing ? "Ubah detail menu" : "Buat menu baru"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <Field data-invalid={!!errors.name}>
            <FieldLabel>Nama Menu *</FieldLabel>
            <Input placeholder="cth. Nasi Goreng Spesial" {...register("name")} />
            {errors.name && <p className="text-xs text-[#d92d20]">{errors.name.message}</p>}
          </Field>

          <Field data-invalid={!!errors.category}>
            <FieldLabel>Kategori *</FieldLabel>
            {isCustomCategory ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ketik nama kategori baru (cth. Special Combo)..."
                  value={selectedCategory || ""}
                  onChange={(e) => setValue("category", e.target.value, { shouldValidate: true })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setValue("category", allCategories[0] || "", { shouldValidate: true });
                  }}
                >
                  Pilih Preset
                </Button>
              </div>
            ) : (
              <NativeSelect
                value={selectedCategory || ""}
                onChange={(e) => {
                  if (e.target.value === "__NEW__") {
                    setIsCustomCategory(true);
                    setValue("category", "");
                  } else {
                    setValue("category", e.target.value, { shouldValidate: true });
                  }
                }}
              >
                <option value="">Pilih kategori...</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__NEW__">+ Tambah Kategori Baru...</option>
              </NativeSelect>
            )}
            {errors.category && <p className="text-xs text-[#d92d20]">{errors.category.message}</p>}
          </Field>

          <Field data-invalid={!!errors.price}>
            <FieldLabel>Harga *</FieldLabel>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  prefix="Rp"
                />
              )}
            />
            {errors.price && <p className="text-xs text-[#d92d20]">{errors.price.message}</p>}
          </Field>

          <Field>
            <FieldLabel>Deskripsi</FieldLabel>
            <Input placeholder="Opsional — deskripsi singkat menu..." {...register("description")} />
          </Field>

          {/* Image dropzone (click to pick) */}
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-[#d0d5dd] bg-[#f9fafb] px-4 py-5 text-sm text-[#667085] transition-colors hover:border-[#4f46e5] hover:text-[#4f46e5] dark:border-border dark:bg-muted/30"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : imageUrl ? (
                <Check className="size-4 text-[#067647]" />
              ) : (
                <Upload className="size-4" />
              )}
              <span className="font-medium text-[#4f46e5]">
                {imageUrl ? "Foto terupload — klik untuk ganti" : "Seret foto ke sini, atau klik untuk pilih file"}
              </span>
              <span className="text-xs">PNG / JPG · maks 5MB</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={available} onCheckedChange={setAvailable} />
            <span className="text-sm font-medium text-[#17181c] dark:text-foreground">Tersedia</span>
            <span className="text-xs text-[#667085]">· default aktif</span>
          </div>

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