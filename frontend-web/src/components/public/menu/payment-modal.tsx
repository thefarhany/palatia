"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ordersService } from "@/services/orders-service";
import { rp } from "@/lib/format";

const METHODS = [
  { code: "QR", name: "QRIS", desc: "All payment apps — GoPay, OVO, DANA, ShopeePay.", expandable: true },
  { code: "GO", name: "GoPay", desc: "Automatically opens the Gojek app" },
  { code: "DA", name: "DANA", desc: "Automatically opens the DANA app" },
  { code: "OV", name: "OVO", desc: "Opens the OVO app" },
  { code: "BC", name: "BCA Virtual Account", desc: "Transfer / VA — manual confirmation" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  trackingToken: string;
  total: number;
}

export function PaymentModal({ open, onClose, trackingToken, total }: Props) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [selected, setSelected] = useState("QRIS");
  const [expanded, setExpanded] = useState("QRIS");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  // Countdown 15:00 — habis = bayar via tracking page.
  useEffect(() => {
    if (paid) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paid]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const pay = async () => {
    setPaying(true);
    await ordersService.payByToken(trackingToken).catch(() => {});
    setPaying(false);
    setPaid(true);
    toast.success("Payment received — thank you!");
    onClose();
    router.push(`/payment/success?token=${trackingToken}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl border border-[#f0e8de]">
        <DialogHeader className="pr-8">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-brand text-xl font-bold text-[#2b2119]">Payment</DialogTitle>
            <span className="flex items-center gap-1.5 rounded-full bg-[#fbeaea] px-2.5 py-0.5 text-xs font-bold text-[#c0392b]">
              ⏱ {mm}:{ss}
            </span>
          </div>
          <DialogDescription className="sr-only">Payment</DialogDescription>
        </DialogHeader>

        {/* Total tagihan */}
        <div className="text-center py-1">
          <p className="text-xs text-[#5c5147]">Total bill</p>
          <p className="font-brand text-2xl sm:text-3xl font-bold text-[#2b2119]">{rp.format(total)}</p>
        </div>

        {/* Methods */}
        <div className="overflow-hidden rounded-xl border border-[#f0e8de]">
          {METHODS.map((m, idx) => {
            const isSel = selected === m.name;
            const isExp = expanded === m.name && isSel && m.code === "QR";
            return (
              <div key={m.name} className={idx > 0 ? "border-t border-[#f0e8de]" : ""}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(m.name);
                    setExpanded(m.name);
                  }}
                  className="flex w-full items-center gap-3 bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#faf6f0]"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      isSel ? "bg-[#b8521f] text-white" : "bg-[#f7ece4] text-[#2b2119]"
                    }`}
                  >
                    {m.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs sm:text-sm font-semibold text-[#2b2119]">{m.name}</span>
                    <span className="block truncate text-[11px] text-[#5c5147]">{m.desc}</span>
                  </span>
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${
                      isSel ? "border-[#b8521f]" : "border-[#d0d5dd]"
                    }`}
                  >
                    {isSel && <span className="size-2 rounded-full bg-[#b8521f]" />}
                  </span>
                  {m.expandable !== undefined && <ChevronDown className={`size-4 text-[#5c5147] transition-transform ${isExp ? "rotate-180" : ""}`} />}
                </button>
                {isExp && (
                  <div className="bg-[#f2ede3] p-4 text-center">
                    <div className="mx-auto grid size-28 place-items-center rounded-xl bg-white shadow-xs">
                      <span className="text-[10px] tracking-widest text-[#c9b8a6] font-bold">QRIS</span>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-[#5c5147]">
                      One QR for all apps — scan with GoPay, OVO, DANA, ShopeePay, or m-banking.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={pay}
          disabled={paying || secondsLeft === 0 || paid}
          className="w-full rounded-xl bg-[#b8521f] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-60 active:scale-98 shadow-xs"
        >
          {paid ? "Paid ✓" : `Pay Now · ${rp.format(total)}`}
        </button>
      </DialogContent>
    </Dialog>
  );
}
