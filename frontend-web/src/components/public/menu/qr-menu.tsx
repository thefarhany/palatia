"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag } from "lucide-react";
import { menuService } from "@/services/menu-service";
import { publicService, type ResolvedTable } from "@/services/public-service";
import { useCartStore } from "@/store/cart-store";
import { AddToCartDialog } from "@/components/public/menu/add-to-cart-dialog";
import { CartModal } from "@/components/public/menu/cart-modal";
import { PaymentModal } from "@/components/public/menu/payment-modal";
import type { MenuItem } from "@/lib/types";
import { rp } from "@/lib/format";

export function QrMenu({ token }: { token: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [table, setTable] = useState<ResolvedTable | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const cart = useCartStore((st) => st.items);
  const [adding, setAdding] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [payment, setPayment] = useState<{
    trackingToken: string;
    total: number;
  } | null>(null);
  const setTableToken = useCartStore((st) => st.setTableToken);

  useEffect(() => {
    setTableToken(token);
    void publicService.tableByToken(token).then((t) => {
      if (t) setTable(t);
      else setInvalid(true);
    });
  }, [token, setTableToken]);

  useEffect(() => {
    menuService
      .publicList()
      .then((items) => {
        setItems(items.filter((i) => i.available));
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

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="flex min-h-svh flex-col bg-[#faf6f0] font-sans text-[#2b2119]">
      {/* Sticky Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-[#f0e8de] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-brand text-xl sm:text-2xl font-semibold text-[#2b2119]"
          >
            Palatia
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-[#f1ead9] px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
            >
              Login
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#b8521f] px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
            >
              <ShoppingBag className="size-3.5 sm:size-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="ml-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-[#b8521f]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        className={
          invalid
            ? "flex min-h-[80vh] w-full flex-1 flex-col items-center justify-center px-4 py-8"
            : "mx-auto min-h-[80vh] w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10"
        }
      >
        {invalid ? (
          <div className="w-full max-w-xl rounded-2xl border border-[#fbeaea] bg-[#fbeaea] p-8 sm:p-12 text-center">
            <p className="font-brand text-2xl font-semibold text-[#c0392b]">
              QR Tidak Valid
            </p>
            <p className="mt-2 text-sm text-[#5c5147]">
              QR ini sudah dicabut atau salah link. Silakan minta QR terbaru ke staf restoran.
            </p>
          </div>
        ) : (
          <>
            {/* Banner Meja Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#f7ece4] p-4 sm:px-6 sm:py-5 border border-[#eedfd1]">
              <div className="flex items-center gap-3.5">
                <span className="grid size-11 sm:size-12 shrink-0 place-items-center rounded-xl bg-[#b8521f] text-sm sm:text-base font-bold text-white shadow-sm">
                  T{String(table?.number ?? "?").padStart(2, "0")}
                </span>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#2b2119] leading-tight">
                    {table
                      ? `Ordering from Table ${table.number}`
                      : "Resolving your table…"}
                  </h1>
                  <p className="mt-0.5 text-xs sm:text-sm text-[#5c5147]">
                    Pick your menu &amp; order directly from your phone.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center rounded-full bg-[#f1ead9] px-3 py-1 text-xs font-semibold text-[#5c5147]">
                Dine In · Guest Mode
              </span>
            </div>

            {/* Filter & Search Responsive Container */}
            <div className="mt-6 sm:mt-8 space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {["all", ...categories].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                      category === c
                        ? "bg-[#b8521f] text-white shadow-xs"
                        : "border border-[#e4d9cc] bg-white text-[#5c5147] hover:border-[#b8521f]"
                    }`}
                  >
                    {c === "all" ? "All Items" : c}
                  </button>
                ))}
              </div>

              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#5c5147]" />
                <input
                  placeholder="Search dishes or drinks..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#e4d9cc] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#b8521f] focus:ring-1 focus:ring-[#b8521f]"
                />
              </div>
            </div>

            {/* Responsive Menu Grid */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {!loaded && !loadError && (
                <div className="col-span-full py-12 text-center text-sm text-[#5c5147]">
                  Loading menu items…
                </div>
              )}
              {loadError && (
                <div className="col-span-full py-12 text-center text-sm text-[#c0392b]">
                  Failed to load menu — please refresh page.
                </div>
              )}
              {loaded && filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-[#5c5147]">
                  No items match your search.
                </div>
              )}
              {filtered.map((item) => {
                const cartItem = cart.find((c) => c.menuItemId === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-row sm:flex-col overflow-hidden rounded-2xl border border-[#f0e8de] bg-white shadow-xs transition-shadow hover:shadow-md"
                  >
                    <div className="relative w-28 sm:w-full h-auto sm:h-44 shrink-0 bg-[#f7ece4]">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-[#b8521f] uppercase">
                          {item.category}
                        </span>
                        <h3 className="mt-1 text-sm sm:text-base font-bold text-[#2b2119] line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5c5147]">
                          {item.description ?? "Home-style cooking, Palatia's way."}
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2">
                        <span className="font-brand text-base sm:text-lg font-bold text-[#b8521f]">
                          {rp.format(Number(item.price))}
                        </span>
                        {cartItem ? (
                          <button
                            onClick={() => setAdding(item)}
                            className="rounded-lg bg-[#e7f2ec] px-3 py-1.5 text-xs font-bold text-[#2f7a52] transition-colors hover:bg-[#d5e7dc]"
                          >
                            {cartItem.qty}× In Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => setAdding(item)}
                            className="rounded-lg bg-[#b8521f] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#9c4519] active:scale-95"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#f0e8de] bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-[#5c5147]">
          © 2026 Palatia Restaurant. All rights reserved.
        </div>
      </footer>

      <AddToCartDialog item={adding} onClose={() => setAdding(null)} />
      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        tableNumber={table?.number ?? null}
        tableId={table?.tableId ?? null}
        onPlaced={(trackingToken, total) => {
          setCartOpen(false);
          setPayment({ trackingToken, total });
        }}
      />
      <PaymentModal
        open={!!payment}
        onClose={() => setPayment(null)}
        trackingToken={payment?.trackingToken ?? ""}
        total={payment?.total ?? 0}
      />

      {/* Sticky Floating Mobile Cart Bar */}
      {!invalid && cartCount > 0 && (
        <div className="sticky bottom-0 z-40 bg-[#2b2119] px-4 py-3 sm:py-4 shadow-lg border-t border-white/10 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-sm sm:text-base font-bold text-white">
                {cartCount} item{cartCount > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-white/70">
                {rp.format(cartSubtotal)} <span className="hidden sm:inline">· before tax &amp; service</span>
              </p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="rounded-xl bg-[#b8521f] px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-colors hover:bg-[#9c4519] active:scale-95"
            >
              Checkout Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
