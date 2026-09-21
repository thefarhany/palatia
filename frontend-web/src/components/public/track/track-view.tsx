"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/lib/types";
import { rp } from "@/lib/format";

const STEPS = [
  { label: "Received" },
  { label: "Paid" },
  { label: "Cooking" },
  { label: "Ready" },
  { label: "Completed" },
];

// Status order → jumlah step yang tercapai.
function reachedStep(status: string, paymentStatus: string) {
  if (status === "COMPLETED") return 5;
  if (status === "READY") return 4;
  if (status === "PREPARING") return 3;
  if (paymentStatus === "PAID") return 2;
  return 1;
}

const copyLink = (token: string) => navigator.clipboard.writeText(`${window.location.origin}/track/${token}`);

export function TrackView({ token }: { token: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initial fetch + polling 5s — setState hanya di callback (react-hooks rules).
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
    const poll = setInterval(load, 5000); // guest = polling 5s (docs)
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
        <main className="mx-auto max-w-2xl px-6 py-20">
          <div className="rounded-2xl border border-[#fbeaea] bg-[#fbeaea] p-10 text-center">
            <p className="font-brand text-2xl font-semibold text-[#c0392b]">Order not found</p>
            <p className="mt-2 text-sm text-[#5c5147]">This tracking link is invalid or has been removed.</p>
          </div>
        </main>
      </div>
    );
  }

  const step = order ? reachedStep(order.status, order.paymentStatus) : 0;

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-white font-sans text-[#2b2119]">
      <MinimalHeader token={token} onCopy={copy} copied={copied} />

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-6 py-6">
        {/* Title + status badge */}
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">
            Order <span className="text-[#b8521f]">#{order?.code ?? "…"}</span>
          </h1>
          {order && (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ${
                order.status === "COMPLETED"
                  ? "bg-[#e7f2ec] text-[#2f7a52]"
                  : "bg-[#f1ead9] text-[#b8521f]"
              }`}
            >
              {order.status === "COMPLETED"
                ? "DONE"
                : order.paymentStatus === "UNPAID"
                  ? "AWAITING PAYMENT"
                  : "PAID"}
            </span>
          )}
        </div>

        {/* Stepper */}
        <div className="mt-8 flex items-center">
          {STEPS.map((s, i) => {
            const done = i + 1 <= step;
            return (
              <div key={s.label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <div className="flex flex-col items-center">
                  <span
                    className={`grid size-9 place-items-center rounded-full text-sm font-bold ${
                      done ? "bg-[#b8521f] text-white" : "bg-[#f1ead9] text-[#5c5147]"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <p className={`mt-2 text-xs font-medium whitespace-nowrap ${done ? "text-[#2b2119]" : "text-[#9a8f83]"}`}>
                    {s.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-3 h-1 flex-1 rounded-full ${i + 1 < step ? "bg-[#b8521f]" : "bg-[#f1ead9]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Banner notifikasi guest */}
        <div className="mt-8 rounded-2xl bg-[#f7ece4] px-5 py-4">
          <p className="text-sm font-semibold text-[#2b2119]">This page is your notification (guest).</p>
          <p className="mt-1 text-xs text-[#5c5147]">
            Save this link: palatia.id/track/{token} — status updates automatically every 5 seconds.
          </p>
        </div>

        {/* Summary */}
        {!order && <p className="mt-10 text-sm text-[#5c5147]">Loading your order…</p>}
        {order && (
          <div className="mt-6 rounded-2xl border border-[#f0e8de] bg-white p-5 md:p-6">
            <p className="text-lg font-semibold text-[#2b2119]">
              Dine In{order.table ? ` · Table ${order.table.number}` : ""} · {order.items.length} item
              {order.items.length > 1 ? "s" : ""}
            </p>
            <div className="mt-4 grid gap-3">
              {order.items.map((i) => (
                <div key={i.id}>
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold text-[#2b2119]">
                      {i.qty}× {i.menuItem.name}
                    </p>
                    <p className="text-[#2b2119]">{rp.format(i.unitPrice * i.qty)}</p>
                  </div>
                  {i.notes && <p className="pl-6 text-xs text-[#5c5147]">note: {i.notes}</p>}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#f0e8de] pt-4">
              <p className="text-sm font-semibold text-[#2b2119]">Total paid</p>
              <p className="font-brand text-xl font-semibold text-[#b8521f]">{rp.format(order.total)}</p>
            </div>
            <p className="mt-3 text-xs text-[#5c5147]">
              This page is your notification — status updates automatically. Keep this link.
            </p>
          </div>
        )}

        {/* Ada yang salah */}
        {order && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#f0e8de] bg-white p-6">
            <div>
              <p className="text-sm font-semibold text-[#2b2119]">Something wrong with your order?</p>
              <p className="mt-1 text-xs text-[#5c5147]">
                Call the cashier or phone +62 812-3456-7890 — mention the order code.
              </p>
            </div>
            <a
              href="https://wa.me/6281234567890"
              className="rounded-xl border border-[#e4d9cc] bg-white px-5 py-2.5 text-sm font-semibold text-[#2b2119] transition-colors hover:border-[#b8521f]"
            >
              Contact Us
            </a>
          </div>
        )}
      </main>

      {/* Footer mini */}
      <footer className="border-t border-[#f0e8de] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-[#5c5147]">
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
    <header className="border-b border-[#f0e8de]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-brand text-2xl font-semibold text-[#2b2119]">
          Palatia
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-[#f1ead9] px-4 py-2 text-sm text-[#5c5147] sm:block">
            palatia.id/track/{token}
          </span>
          <button
            onClick={onCopy}
            aria-label="Copy tracking link"
            className="grid size-10 place-items-center rounded-full bg-[#b8521f] text-white transition-colors hover:bg-[#9c4519]"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
