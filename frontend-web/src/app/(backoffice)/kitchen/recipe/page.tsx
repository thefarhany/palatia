"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, ChefHat, Loader2, Search, Sparkles, ArrowRight } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { menuService } from "@/services/menu-service";
import { rp } from "@/lib/format";
import { ChefHeader } from "@/components/backoffice/kitchen/chef-header";
import { RecipeModal } from "@/components/backoffice/kitchen/recipe-modal";

export default function ChefRecipePage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    menuService
      .list()
      .then((data) => {
        setItems(
          data.map((item) => ({
            ...item,
            recipeCount: item._count?.recipeItems ?? 0,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-svh flex-col bg-[#f7f8fa] dark:bg-background">
      {/* Chef Header with Navigation Bar */}
      <ChefHeader />

      <main className="flex-1 p-6 sm:p-8">
        {/* Page Title & Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#17181c] dark:text-foreground">
              Daftar Resep & Komposisi Makanan
            </h1>
            <p className="mt-0.5 text-xs text-[#667085] dark:text-muted-foreground">
              Klik pada kartu menu untuk melihat racikan bahan dan takaran saji.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-[#98a2b3]" />
            <input
              type="text"
              placeholder="Cari menu atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e4e7ec] bg-white py-2 pl-9 pr-4 text-xs font-medium text-[#17181c] shadow-sm outline-none transition-all focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 dark:border-border dark:bg-card dark:text-foreground"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? "bg-[#1a1d23] text-white shadow-sm"
                  : "border border-[#e4e7ec] bg-white text-[#667085] hover:bg-[#f1f2f4] hover:text-[#17181c] dark:border-border dark:bg-card dark:text-muted-foreground"
              }`}
            >
              {cat === "all" ? "Semua Menu" : cat}
            </button>
          ))}
        </div>

        {/* 6 Cards Per Row Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#667085]">
            <Loader2 className="size-7 animate-spin text-[#4f46e5]" />
            <p className="mt-3 text-xs font-medium">Memuat daftar resep menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e4e7ec] bg-white py-16 text-center dark:border-border dark:bg-card">
            <ChefHat className="size-10 text-[#98a2b3]" />
            <p className="mt-3 text-sm font-semibold text-[#17181c] dark:text-foreground">
              Tidak Ada Menu Ditemukan
            </p>
            <p className="mt-1 text-xs text-[#667085] dark:text-muted-foreground">
              Coba kata kunci pencarian lain atau pilih kategori berbeda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {filteredItems.map((item) => {
              const hasRecipe = (item.recipeCount ?? 0) > 0;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveModalItem(item)}
                  className="group cursor-pointer flex flex-col overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#4f46e5]/40 hover:shadow-md dark:border-border dark:bg-card"
                >
                  {/* Image Container */}
                  <div className="relative h-36 w-full overflow-hidden bg-[#f7ece4]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f7ece4]">
                        <BookOpen className="size-8 text-[#b8521f]/40" />
                      </div>
                    )}
                    {/* Badge Overlay */}
                    <div className="absolute left-2.5 top-2.5">
                      <span className="rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-white backdrop-blur-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-[#17181c] transition-colors group-hover:text-[#4f46e5] line-clamp-1 dark:text-foreground">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-[#b8521f]">
                        {rp.format(Number(item.price))}
                      </p>
                    </div>

                    {/* Footer Badge (Has Recipe indicator) */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#f0f2f5] pt-2.5 dark:border-border">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          hasRecipe
                            ? "bg-[#ecfdf3] text-[#027a48] dark:bg-[#027a48]/20 dark:text-[#6ce9a6]"
                            : "bg-[#f2f4f7] text-[#344054] dark:bg-muted dark:text-muted-foreground"
                        }`}
                      >
                        <Sparkles className="size-3" />
                        {hasRecipe ? `${item.recipeCount} Bahan` : "Lihat Resep"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4f46e5] group-hover:underline">
                        <span>Buka</span>
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pop Up Modal Detail Resep */}
      <RecipeModal
        menuItem={activeModalItem}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}
