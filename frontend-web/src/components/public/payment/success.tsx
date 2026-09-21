"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/types";
import { rp } from "@/lib/format";
import { MinimalHeader } from "@/components/public/track/track-view";
import { useCartStore } from "@/store/cart-store";

export function PaymentSuccess({ token }: { token: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const tableToken = useCartStore((st) => st.tableToken);

  useEffect(() => {
    void apiClient<{ order: Order }>(`/public/orders/${token}`)
      .then((r) => setOrder(r.order))
      .catch(() => setFailed(true));
  }, [token]);

  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/track/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-white font-sans text-[#2b2119]">
      <MinimalHeader token={token} onCopy={copy} copied={copied} />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-4">
        {failed && (
          <div className="rounded-2xl border border-[#fbeaea] bg-[#fbeaea] p-10 text-center">
            <p className="font-brand text-2xl font-semibold text-[#c0392b]">Order not found</p>
            <p className="mt-2 text-sm text-[#5c5147]">The tracking link is invalid or the order was removed.</p>
          </div>
        )}
        {!failed && !order && (
          <div className="py-24 text-center text-sm text-[#5c5147]">Loading your order…</div>
        )}
        {order && (
          <div className="rounded-2xl border border-[#f0e8de] bg-white p-6 md:p-8">
            {/* Success head */}
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#2f7a52]">
                <Check className="size-8 text-white" />
              </span>
              <h1 className="mt-4 font-brand text-3xl font-semibold text-[#2b2119]">Payment successful!</h1>
              <p className="mt-2 text-sm text-[#5c5147]">
                Your order is in the kitchen. Keep the Order ID &amp; tracking link below.
              </p>
            </div>

            {/* Order ID */}
            <div className="mt-6 rounded-2xl bg-[#f7ece4] px-6 py-4 text-center">
              <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">ORDER ID</p>
              <p className="font-brand text-3xl font-semibold text-[#2b2119]">{order.code}</p>
            </div>

            {/* Ringkasan */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2b2119]">Order summary</p>
                <p className="text-xs text-[#5c5147]" suppressHydrationWarning>
                  {new Date(order.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                {order.items.map((i) => (
                  <div key={i.id}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-[#2b2119]">
                        {i.qty}× {i.menuItem.name}
                      </p>
                      <p className="text-[#2b2119]">{rp.format(i.unitPrice * i.qty)}</p>
                    </div>
                    {i.notes && <p className="pl-6 text-xs text-[#5c5147]">note: {i.notes}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 border-t border-[#f0e8de] pt-5 text-sm">
                <div className="flex justify-between">
                  <p className="text-[#5c5147]">Payment method</p>
                  <p className="font-semibold text-[#2b2119]">QRIS</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[#5c5147]">Dine In · Table</p>
                  <p className="font-semibold text-[#2b2119]">
                    {order.table ? `T-${String(order.table.number).padStart(2, "0")}` : "—"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[#5c5147]">Total paid</p>
                  <p className="font-brand text-lg font-semibold text-[#b8521f]">{rp.format(order.total)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href={`/track/${token}`}
                className="rounded-xl bg-[#b8521f] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
              >
                Track Order
              </Link>
              {/* Balik ke menu meja yang di-scan — fallback ke menu publik kalau token meja tidak ada. */}
              <Link
                href={tableToken ? `/menu?t=${tableToken}` : "/menu"}
                className="rounded-xl bg-[#f1ead9] py-3 text-center text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
              >
                Order Again
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
