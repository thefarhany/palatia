"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
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
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <header className="sticky top-0 z-40 border-b border-[#f0e8de] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-brand text-2xl font-semibold text-[#2b2119]"
          >
            Palatia
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-[#f1ead9] px-4 py-2 text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
            >
              Login
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="rounded-lg bg-[#b8521f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
            >
              Cart · {cartCount}
            </button>
          </div>
        </div>
      </header>

      <main
        className={
          invalid
            ? "flex min-h-[80vh] w-full flex-1 flex-col items-center justify-center px-6 py-10"
            : "mx-auto min-h-[80vh] w-full max-w-6xl px-6 py-10"
        }
      >
        {invalid ? (
          <div className="w-full max-w-3xl rounded-2xl border border-[#fbeaea] bg-[#fbeaea] p-14 text-center">
            <p className="font-brand text-2xl font-semibold text-[#c0392b]">
              QR tidak valid
            </p>
            <p className="mt-2 text-sm text-[#5c5147]">
              QR ini sudah dicabut atau salah link. Minta QR terbaru ke pelayan.
            </p>
          </div>
        ) : (
          <>
            {/* Banner meja */}
            <div className="flex items-center justify-between rounded-2xl bg-[#f7ece4] px-6 py-5">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-[#b8521f] text-base font-bold text-white">
                  T{String(table?.number ?? "?").padStart(2, "0")}
                </span>
                <div>
                  <p className="text-lg font-semibold text-[#2b2119]">
                    {table
                      ? `Ordering from Table ${table.number}`
                      : "Resolving your table…"}
                  </p>
                  <p className="text-sm text-[#5c5147]">
                    Pick your menu, pay from your phone — served to your table.
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#5c5147]">As guest</p>
            </div>

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
              {!loaded && !loadError && (
                <p className="text-sm text-[#5c5147]">Loading menu…</p>
              )}
              {loadError && (
                <p className="text-sm text-[#c0392b]">Failed to load menu — check your connection and refresh.</p>
              )}
              {loaded && filtered.length === 0 && (
                <p className="text-sm text-[#5c5147]">No matching menu.</p>
              )}
              {filtered.map((item, i) => {
                const cartItem = cart.find((c) => c.menuItemId === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#f0e8de] bg-white"
                  >
                    <div className="relative h-44 shrink-0 overflow-hidden bg-[#f7ece4]">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <p className="text-[10px] font-semibold tracking-[2px] text-[#b8521f]">
                          {item.category.toUpperCase()}
                        </p>
                        <p className="mt-1.5 text-base font-semibold text-[#2b2119] line-clamp-1">
                          {item.name}
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#5c5147]">
                          {item.description ??
                            "Home-style cooking, Palatia's way."}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="font-brand text-lg font-semibold text-[#b8521f]">
                          {rp.format(Number(item.price))}
                        </p>
                        {cartItem ? (
                          <button
                            onClick={() => setAdding(item)}
                            className="rounded-lg bg-[#e7f2ec] px-3 py-1.5 text-xs font-semibold text-[#2f7a52] transition-colors hover:bg-[#d5e7dc]"
                            title="Click to edit quantity or notes"
                          >
                            {cartItem.qty}x In Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => setAdding(item)}
                            className="rounded-lg bg-[#b8521f] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#9c4519]"
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

      {/* Footer mini: copyright saja */}
      <footer className="mt-auto border-t border-[#f0e8de] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-[#5c5147]">
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

      {/* Cart bar */}
      {!invalid && cartCount > 0 && (
        <div className="sticky bottom-0 z-40 bg-[#2b2119] py-5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
            <div>
              <p className="text-lg font-semibold text-white">
                {cartCount} item{cartCount > 1 ? "s" : ""} in cart
              </p>
              <p className="text-sm text-white/70">
                Subtotal {rp.format(cartSubtotal)} · before tax &amp; service
              </p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="rounded-xl bg-[#b8521f] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
            >
              Continue to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
