"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { menuService } from "@/services/menu-service";
import type { MenuItem } from "@/lib/types";
import { rp } from "@/lib/format";

export function MenuGrid() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    menuService
      .publicList(false)
      .then((items) => {
        setItems(items);
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === "all" || i.category === category) &&
          i.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, category, query],
  );

  return (
    <>
      {/* Filter + search */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-[#b8521f] text-white"
                  : "border border-[#e4d9cc] bg-white text-[#5c5147] hover:border-[#b8521f]"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5c5147]" />
          <input
            placeholder="Search menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-[#e4d9cc] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#b8521f]"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {!loaded && !loadError && <p className="text-sm text-[#5c5147]">Memuat menu…</p>}
        {loadError && <p className="text-sm text-[#c0392b]">Gagal memuat menu — refresh halaman.</p>}
        {loaded && filtered.length === 0 && (
          <p className="text-sm text-[#5c5147]">Tidak ada menu yang cocok.</p>
        )}
        {filtered.map((item, i) => (
          <div
            key={item.id}
            className={`flex flex-col overflow-hidden rounded-2xl border border-[#f0e8de] bg-white ${
              item.available ? "" : "opacity-80"
            }`}
          >
            <div className="relative h-44 shrink-0 overflow-hidden bg-[#f7ece4]">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <p className="text-[10px] font-semibold tracking-[2px] text-[#b8521f]">
                  {item.category.toUpperCase()}
                </p>
                <p className="mt-1.5 text-base font-semibold text-[#2b2119] line-clamp-1">{item.name}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#5c5147]">
                  {item.description ?? "Masakan rumahan khas Palatia."}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-brand text-lg font-semibold text-[#b8521f]">
                  {rp.format(Number(item.price))}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    item.available
                      ? "bg-[#e7f2ec] text-[#2f7a52]"
                      : "bg-[#fbeaea] text-[#c0392b]"
                  }`}
                >
                  {item.available ? "Available" : "Sold Out"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
