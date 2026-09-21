"use client";

import { useState } from "react";
import { Minus, Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { ordersService } from "@/services/orders-service";
import { rp } from "@/lib/format";

// Estimasi UI — total final dihitung server saat order dibuat (lib/pricing.ts).
const TAX = 0.1;
const SERVICE = 0.05;

interface Props {
  open: boolean;
  onClose: () => void;
  tableNumber: number | null;
  tableId: number | null;
  onPlaced: (trackingToken: string, total: number) => void;
}

export function CartModal({ open, onClose, tableNumber, tableId, onPlaced }: Props) {
  const items = useCartStore((st) => st.items);
  const updateQty = useCartStore((st) => st.updateQty);
  const updateNotes = useCartStore((st) => st.updateNotes);
  const removeLine = useCartStore((st) => st.remove);
  const clearCart = useCartStore((st) => st.clear);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * TAX;
  const service = subtotal * SERVICE;
  const total = subtotal + tax + service;

  const placeOrder = async () => {
    setPlacing(true);
    const order = await ordersService
      .createGuestOrder({
        type: "DINE_IN",
        tableId: tableId ?? undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          qty: i.qty,
          notes: i.notes ? i.notes.trim().slice(0, 150) || undefined : undefined,
        })),
      })
      .catch((e: Error) => {
        toast.error(e.message);
        return null;
      });
    setPlacing(false);
    if (!order) return;
    if (!order.trackingToken) {
      toast.error("No tracking token returned");
      return;
    }
    clearCart();
    onPlaced(order.trackingToken, total);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl p-6 sm:p-8">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <DialogTitle className="font-brand text-2xl font-semibold text-[#2b2119]">Cart</DialogTitle>
            {tableNumber && (
              <span className="rounded-full bg-[#f1ead9] px-3.5 py-1 text-xs font-medium text-[#2b2119]">
                Dine In · Table {tableNumber}
              </span>
            )}
          </div>
          <DialogDescription className="sr-only">Your cart</DialogDescription>
        </DialogHeader>

        {/* Items */}
        <div className="grid gap-4 py-2">
          {items.map((line) => (
            <div key={line.lineId} className="flex items-start gap-3 border-b border-[#f0e8de] pb-4 last:border-0">
              <div className="relative">
                <div className="relative size-14 overflow-hidden rounded-xl bg-[#f7ece4]">
                  {line.imageUrl && (
                    <Image src={line.imageUrl} alt={line.name} fill className="object-cover" />
                  )}
                </div>
                <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-[#b8521f] text-[11px] font-bold text-white">
                  {line.qty}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                {line.category && (
                  <p className="text-[10px] font-semibold tracking-[2px] text-[#b8521f]">
                    {line.category.toUpperCase()}
                  </p>
                )}
                <p className="text-sm font-semibold text-[#2b2119]">{line.name}</p>
                {editingNotes === line.lineId ? (
                  <input
                    autoFocus
                    maxLength={150}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateNotes(line.lineId, notesDraft);
                        setEditingNotes(null);
                      }
                    }}
                    onBlur={() => {
                      updateNotes(line.lineId, notesDraft);
                      setEditingNotes(null);
                    }}
                    placeholder="Add note for kitchen..."
                    className="mt-1.5 w-full rounded-lg border border-[#b8521f] bg-white px-2.5 py-1 text-xs text-[#2b2119] outline-none shadow-sm focus:ring-1 focus:ring-[#b8521f]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotes(line.lineId);
                      setNotesDraft(line.notes ?? "");
                    }}
                    className="mt-1.5 flex max-w-full items-start gap-1.5 rounded-md bg-[#f7ece4] px-2.5 py-1 text-left text-xs text-[#5c5147] transition-colors hover:bg-[#ebdcd0] hover:text-[#2b2119]"
                    title="Click to edit note"
                  >
                    <Pencil className="mt-0.5 size-3 shrink-0 text-[#b8521f]" />
                    <span className="min-w-0 break-words line-clamp-2">
                      {line.notes ? `note: ${line.notes}` : "+ Add note"}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#f7ece4] px-1.5 py-1">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() =>
                    line.qty > 1 ? updateQty(line.lineId, line.qty - 1) : removeLine(line.lineId)
                  }
                  className="grid size-6 place-items-center rounded text-[#b8521f] hover:bg-[#f0d9c8]"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-semibold text-[#2b2119]">x{line.qty}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => updateQty(line.lineId, line.qty + 1)}
                  className="grid size-6 place-items-center rounded text-[#b8521f] hover:bg-[#f0d9c8]"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-[#c0392b] hover:underline"
                onClick={() => removeLine(line.lineId)}
              >
                Remove
              </button>
              <p className="w-24 text-right text-base font-semibold text-[#2b2119]">
                {rp.format(line.price * line.qty)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="grid gap-2 border-t border-[#f0e8de] pt-4">
          <div className="flex justify-between text-base">
            <p className="text-[#5c5147]">Subtotal</p>
            <p className="text-[#2b2119]">{rp.format(subtotal)}</p>
          </div>
          <div className="flex justify-between text-base">
            <p className="text-[#5c5147]">VAT (GST) 10%</p>
            <p className="text-[#2b2119]">{rp.format(tax)}</p>
          </div>
          <div className="flex justify-between text-base">
            <p className="text-[#5c5147]">Service 5%</p>
            <p className="text-[#2b2119]">{rp.format(service)}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-base font-bold text-[#2b2119]">TOTAL</p>
            <p className="font-brand text-xl font-bold text-[#b8521f]">{rp.format(total)}</p>
          </div>
        </div>

        {/* Guest note */}
        <div className="rounded-xl bg-[#f1ead9] px-4 py-3">
          <p className="text-sm font-medium text-[#2b2119]">
            Order as guest — Dine In from QR{tableNumber ? ` Table ${tableNumber}` : ""}.
          </p>
          <p className="mt-0.5 text-xs text-[#5c5147]">
            Sign in/register for live notifications. Guests get a unique tracking link.
          </p>
        </div>

        <button
          onClick={placeOrder}
          disabled={placing || items.length === 0}
          className="w-full rounded-xl bg-[#b8521f] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-60"
        >
          {placing ? "Placing order…" : `Continue to Payment · ${rp.format(total)}`}
        </button>
      </DialogContent>
    </Dialog>
  );
}
