"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/types";
import { rp } from "@/lib/format";

const STEPS = [
  { label: "Received" },
  { label: "Paid" },
  { label: "Cooking" },
  { label: "Ready" },
  { label: "Done" },
];

function reachedStep(status: string, paymentStatus: string) {
  if (status === "COMPLETED") return 5;
  if (status === "READY" || status === "SERVED") return 4;
  if (status === "PREPARING") return 3;
  if (paymentStatus === "PAID") return 2;
  return 1;
}

const copyLink = (token: string) => navigator.clipboard.writeText(`${window.location.origin}/track/${token}`);

export function TrackView({ token }: { token: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      apiClient<{ order: Order }>(`/public/orders/${token}`)
        .then((r) => {
          if (alive) setOrder(r.order);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    void load();
    const poll = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [token]);

  const copy = async () => {
    await copyLink(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (failed) {
    return (
      <div className="flex h-svh flex-col overflow-hidden bg-white font-sans text-[#2b2119]">
        <MinimalHeader token={token} onCopy={copy} copied={copied} />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
          <div className="rounded-2xl border border-[#fbeaea] bg-[#fbeaea] p-8 sm:p-10">
            <p className="font-brand text-2xl font-bold text-[#c0392b]">Order Not Found</p>
            <p className="mt-2 text-xs sm:text-sm text-[#5c5147]">This tracking link is invalid or has expired.</p>
          </div>
        </main>
      </div>
    );
  }

  const step = order ? reachedStep(order.status, order.paymentStatus) : 0;

  return (
    <div className="flex min-h-svh flex-col bg-[#faf6f0] font-sans text-[#2b2119]">
      <MinimalHeader token={token} onCopy={copy} copied={copied} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header Title + Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#5c5147] uppercase tracking-wider">
              Guest Order Tracking
            </span>
            <h1 className="font-brand text-2xl sm:text-3xl font-bold text-[#2b2119]">
              Order <span className="text-[#b8521f]">#{order?.code ?? "…"}</span>
            </h1>
          </div>
          {order && (
            <span
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                order.status === "COMPLETED"
                  ? "bg-[#e7f2ec] text-[#2f7a52]"
                  : "bg-[#f1ead9] text-[#b8521f]"
              }`}
            >
              {order.status === "COMPLETED"
                ? "COMPLETED"
                : order.paymentStatus === "UNPAID"
                  ? "AWAITING PAYMENT"
                  : "PAID · PREPARING"}
            </span>
          )}
        </div>

        {/* Responsive Horizontal Stepper */}
        <div className="mt-6 sm:mt-8 rounded-2xl bg-white p-4 sm:p-6 border border-[#f0e8de] shadow-xs">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
            {STEPS.map((s, i) => {
              const done = i + 1 <= step;
              return (
                <div key={s.label} className="flex items-center flex-1 min-w-[60px]">
                  <div className="flex flex-col items-center mx-auto">
                    <span
                      className={`grid size-8 sm:size-10 place-items-center rounded-full text-xs sm:text-sm font-bold transition-all ${
                        done ? "bg-[#b8521f] text-white shadow-xs" : "bg-[#f1ead9] text-[#5c5147]"
                      }`}
                    >
                      {done ? <Check className="size-3.5 sm:size-4" /> : i + 1}
                    </span>
                    <span className={`mt-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap ${done ? "text-[#2b2119]" : "text-[#9a8f83]"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 rounded-full ${i + 1 < step ? "bg-[#b8521f]" : "bg-[#f1ead9]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto Refresh Notice */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7ece4] px-4 py-3 text-xs text-[#5c5147]">
          <span className="flex items-center gap-2 font-medium">
            <RefreshCw className="size-3.5 animate-spin text-[#b8521f]" />
            Auto-updating status every 5 seconds
          </span>
          {order?.table && (
            <span className="font-bold text-[#2b2119]">
              Table {order.table.number}
            </span>
          )}
        </div>

        {/* Order Details */}
        {!order && (
          <div className="mt-8 text-center text-sm text-[#5c5147]">Loading order details…</div>
        )}
        {order && (
          <div className="mt-6 rounded-2xl border border-[#f0e8de] bg-white p-4 sm:p-6 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-[#2b2119]">
              Order Items ({order.items.length})
            </h2>
            <div className="mt-3 divide-y divide-[#f0e8de]">
              {order.items.map((i) => (
                <div key={i.id} className="py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div>
                    <p className="font-bold text-[#2b2119]">
                      {i.qty}× {i.menuItem.name}
                    </p>
                    {i.notes && <p className="text-[11px] text-[#5c5147]">Note: {i.notes}</p>}
                  </div>
                  <span className="font-semibold text-[#2b2119] shrink-0">
                    {rp.format(i.unitPrice * i.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#f0e8de] pt-3 text-sm sm:text-base font-bold text-[#2b2119]">
              <span>Total Paid</span>
              <span className="font-brand text-lg sm:text-xl font-bold text-[#b8521f]">
                {rp.format(order.total)}
              </span>
            </div>
          </div>
        )}

        {/* Contact Support */}
        {order && (
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#f0e8de] bg-white p-4 sm:p-6">
            <div>
              <p className="text-sm font-bold text-[#2b2119]">Need help with your order?</p>
              <p className="mt-0.5 text-xs text-[#5c5147]">
                Contact restaurant staff or cashier directly.
              </p>
            </div>
            <a
              href="https://wa.me/6281234567890"
              className="w-full sm:w-auto text-center rounded-xl border border-[#e4d9cc] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#2b2119] transition-colors hover:border-[#b8521f]"
            >
              Contact Staff
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#f0e8de] bg-white py-4">
        <div className="mx-auto max-w-4xl px-4 text-center text-xs text-[#5c5147]">
          © 2026 Palatia Restaurant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export function MinimalHeader({
  token,
  onCopy,
  copied,
}: {
  token: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <header className="border-b border-[#f0e8de] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-brand text-xl sm:text-2xl font-bold text-[#2b2119]">
          Palatia
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-lg bg-[#b8521f] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#9c4519]"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied!" : "Copy Tracking Link"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
