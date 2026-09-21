"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, ChefHat, Loader2, Scale, Sparkles, X } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { inventoryService } from "@/services/inventory-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RecipeItemDetail {
  id: number;
  menuItemId: number;
  ingredientId: number;
  qty: number | string;
  ingredient: {
    name: string;
    unit: string;
  };
}

function formatCookingQty(rawQty: number | string, unit: string): string {
  const qty = Number(rawQty);
  if (isNaN(qty)) return `${rawQty} ${unit}`;
  const u = unit.toLowerCase().trim();

  // Convert fractional kg to gram for chefs (e.g. 0.2 kg -> 200 gram)
  if (u === "kg" || u === "kilogram") {
    if (qty < 1) {
      const grams = Math.round(qty * 1000);
      return `${grams} gram`;
    }
    return `${qty} kg`;
  }

  // Convert fractional Liter to ml for chefs (e.g. 0.05 L -> 50 ml)
  if (u === "l" || u === "liter") {
    if (qty < 1) {
      const ml = Math.round(qty * 1000);
      return `${ml} ml`;
    }
    return `${qty} L`;
  }

  return `${qty} ${unit}`;
}

export function RecipeModal({
  menuItem,
  onClose,
}: {
  menuItem: MenuItem | null;
  onClose: () => void;
}) {
  const [recipeItems, setRecipeItems] = useState<RecipeItemDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuItem) {
      setRecipeItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    inventoryService
      .getRecipe(menuItem.id)
      .then((items) => {
        setRecipeItems(items);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat detail resep.");
        setLoading(false);
      });
  }, [menuItem]);

  if (!menuItem) return null;

  return (
    <Dialog open={!!menuItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl overflow-hidden p-0 sm:max-w-xl sm:rounded-2xl">
        {/* Banner / Header Image */}
        <div className="relative h-48 w-full overflow-hidden bg-[#1a1d23]">
          {menuItem.imageUrl ? (
            <Image
              src={menuItem.imageUrl}
              alt={menuItem.name}
              fill
              className="object-cover opacity-90 transition-opacity"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1d23] to-[#2d3139]">
              <ChefHat className="size-16 text-[#4f46e5]/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
          >
            <X className="size-4" />
          </button>

          {/* Title & Category Badge over Banner */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="inline-block rounded-md bg-[#4f46e5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-white shadow-sm">
              {menuItem.category}
            </span>
            <h2 className="mt-1 text-2xl font-bold text-white drop-shadow-sm line-clamp-1">
              {menuItem.name}
            </h2>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Description */}
          {menuItem.description && (
            <div className="mb-5 rounded-xl border border-[#f0e8de] bg-[#faf6f0] p-3.5 text-xs text-[#5c5147] dark:border-border dark:bg-muted/40 dark:text-muted-foreground">
              <p className="font-semibold text-[#2b2119] dark:text-foreground">Catatan Dapur / Deskripsi:</p>
              <p className="mt-1 leading-relaxed">{menuItem.description}</p>
            </div>
          )}

          {/* Recipe Ingredients Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#4f46e5]/10 text-[#4f46e5]">
                <BookOpen className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#17181c] dark:text-foreground">
                Komposisi & Takaran Resep
              </h3>
            </div>
            {!loading && (
              <span className="text-xs text-[#667085] dark:text-muted-foreground">
                {recipeItems.length} Bahan Terdaftar
              </span>
            )}
          </div>

          {/* Ingredients List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#667085]">
              <Loader2 className="size-6 animate-spin text-[#4f46e5]" />
              <p className="mt-2 text-xs">Memuat resep racikan...</p>
            </div>
          ) : error ? (
            <p className="py-6 text-center text-xs text-[#c0392b]">{error}</p>
          ) : recipeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e4e7ec] bg-[#f8f9fa] py-8 text-center dark:border-border dark:bg-muted/30">
              <Sparkles className="size-8 text-[#98a2b3]" />
              <p className="mt-2 text-sm font-medium text-[#344054] dark:text-foreground">
                Belum Ada Resep
              </p>
              <p className="mt-1 text-xs text-[#667085] dark:text-muted-foreground">
                Resep untuk menu ini belum dikonfigurasi oleh Admin.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
              {recipeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[#e4e7ec] bg-white p-3 text-xs transition-colors hover:border-[#4f46e5]/30 dark:border-border dark:bg-card"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4f46e5]/10 text-xs font-bold text-[#4f46e5]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[#17181c] dark:text-foreground">
                      {item.ingredient.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-[#f7f8fa] px-2.5 py-1 font-semibold text-[#344054] dark:bg-muted dark:text-foreground">
                    <Scale className="size-3 text-[#667085]" />
                    <span>
                      {formatCookingQty(item.qty, item.ingredient.unit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Action */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-[#1a1d23] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-black"
            >
              Tutup Modal
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
