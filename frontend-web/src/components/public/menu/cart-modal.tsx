"use client";

import { useState } from "react";
import { Minus, Plus, Pencil, Trash2 } from "lucide-react";
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
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[85vh] p-3.5 sm:p-6 gap-2.5 rounded-2xl border border-[#f0e8de] flex flex-col">
        <DialogHeader className="pb-0 pr-8">
          <div className="flex items-center gap-2">
            <DialogTitle className="font-brand text-xl sm:text-2xl font-bold text-[#2b2119]">
              Your Cart
            </DialogTitle>
            {tableNumber && (
              <span className="rounded-full bg-[#f1ead9] px-2.5 py-0.5 text-xs font-semibold text-[#2b2119]">
                Table {tableNumber}
              </span>
            )}
          </div>
          <DialogDescription className="sr-only">Your cart</DialogDescription>
        </DialogHeader>

        {/* Responsive Items List - Capped at ~350px, scrollable if items exceed height */}
        <div className="max-h-[350px] sm:max-h-[380px] overflow-y-auto pr-1 grid gap-2.5 py-1">
          {items.map((line) => (
            <div
              key={line.lineId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-[#f0e8de] bg-[#fdfbf7] p-2.5 sm:p-4"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="relative size-12 sm:size-14 overflow-hidden rounded-xl bg-[#f7ece4]">
                    {line.imageUrl && (
                      <Image src={line.imageUrl} alt={line.name} fill className="object-cover" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  {line.category && (
                    <span className="text-[10px] font-bold tracking-wider text-[#b8521f] uppercase">
                      {line.category}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-[#2b2119] line-clamp-1">
                    {line.name}
                  </h4>

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
                      className="mt-1 w-full rounded-lg border border-[#b8521f] bg-white px-2 py-1 text-xs text-[#2b2119] outline-none shadow-xs"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotes(line.lineId);
                        setNotesDraft(line.notes ?? "");
                      }}
                      className="mt-1 flex items-center gap-1 rounded-md bg-[#f7ece4] px-2 py-0.5 text-xs text-[#5c5147] transition-colors hover:bg-[#ebdcd0]"
                    >
                      <Pencil className="size-3 text-[#b8521f]" />
                      <span className="truncate max-w-[180px] sm:max-w-xs">
                        {line.notes ? `Note: ${line.notes}` : "+ Add note"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Controls & Price Row */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-0 border-dashed border-[#e4d9cc]">
                <div className="flex items-center gap-2 rounded-lg bg-[#f7ece4] px-2 py-1">
                  <button
                    type="button"
                    aria-label="Decrease"
                    onClick={() =>
                      line.qty > 1 ? updateQty(line.lineId, line.qty - 1) : removeLine(line.lineId)
                    }
                    className="grid size-6 place-items-center rounded text-[#b8521f] hover:bg-[#f0d9c8]"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-[#2b2119]">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase"
                    onClick={() => updateQty(line.lineId, line.qty + 1)}
                    className="grid size-6 place-items-center rounded text-[#b8521f] hover:bg-[#f0d9c8]"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#2b2119]">
                    {rp.format(line.price * line.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.lineId)}
                    className="text-[#c0392b] hover:opacity-75 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown Totals */}
        <div className="grid gap-1 border-t border-[#f0e8de] pt-2 text-xs sm:text-sm">
          <div className="flex justify-between text-[#5c5147]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#2b2119]">{rp.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#5c5147]">
            <span>VAT (10%)</span>
            <span className="font-semibold text-[#2b2119]">{rp.format(tax)}</span>
          </div>
          <div className="flex justify-between text-[#5c5147]">
            <span>Service (5%)</span>
            <span className="font-semibold text-[#2b2119]">{rp.format(service)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#f0e8de] pt-1.5 mt-0.5">
            <span className="text-sm sm:text-base font-bold text-[#2b2119]">TOTAL</span>
            <span className="font-brand text-lg sm:text-xl font-bold text-[#b8521f]">
              {rp.format(total)}
            </span>
          </div>
        </div>

        <button
          onClick={placeOrder}
          disabled={placing || items.length === 0}
          className="mt-1.5 w-full rounded-xl bg-[#b8521f] py-3 text-sm font-bold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-60 active:scale-98"
        >
          {placing ? "Placing Order…" : `Continue to Payment · ${rp.format(total)}`}
        </button>
      </DialogContent>
    </Dialog>
  );
}
