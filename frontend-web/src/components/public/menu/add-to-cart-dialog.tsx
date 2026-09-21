"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { rp } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export function AddToCartDialog({ item, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const open = !!item;

  const cartItems = useCartStore((st) => st.items);
  const addToCart = useCartStore((st) => st.add);
  const updateCartItem = useCartStore((st) => st.updateItem);
  const removeFromCart = useCartStore((st) => st.remove);

  const existingItem = item ? cartItems.find((c) => c.menuItemId === item.id) : undefined;

  useEffect(() => {
    if (item) {
      if (existingItem) {
        setQty(existingItem.qty);
        setNotes(existingItem.notes ?? "");
      } else {
        setQty(1);
        setNotes("");
      }
    }
  }, [item?.id, existingItem?.lineId]);

  const confirm = () => {
    if (!item) return;
    if (existingItem) {
      updateCartItem(existingItem.lineId, qty, notes.trim() || undefined);
      toast.success(`${item.name} updated in cart`);
    } else {
      addToCart(item, qty, notes.trim() || undefined);
      toast.success(`${qty}× ${item.name} added to cart`);
    }
    onClose();
  };

  const handleRemove = () => {
    if (existingItem) {
      removeFromCart(existingItem.lineId);
      toast.info(`${item?.name} removed from cart`);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm overflow-hidden p-0">
        {item && (
          <>
            {/* Foto */}
            <div className="relative h-44 bg-[#f7ece4]">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="p-5 pt-4">
              <DialogHeader className="text-left">
                <p className="text-[10px] font-semibold tracking-[2px] text-[#b8521f]">
                  {item.category.toUpperCase()}
                </p>
                <DialogTitle className="font-brand text-2xl font-semibold text-[#2b2119]">
                  {item.name}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-[#5c5147]">
                  {item.description ?? "Home-style cooking, Palatia's way."}
                </DialogDescription>
                <p className="font-brand text-xl font-semibold text-[#b8521f]">
                  {rp.format(Number(item.price))}
                </p>
              </DialogHeader>

              {/* Jumlah */}
              <div className="mt-4 flex items-center justify-between border-t border-[#f0e8de] pt-4">
                <p className="text-sm font-medium text-[#2b2119]">Quantity</p>
                <div className="flex items-center gap-3 rounded-lg bg-[#f7ece4] px-2 py-1.5">
                  <button
                    type="button"
                    aria-label="Kurangi"
                    onClick={() => setQty((v) => Math.max(1, v - 1))}
                    className="grid size-7 place-items-center rounded-md text-[#b8521f] hover:bg-[#f0d9c8]"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-6 text-center text-base font-semibold text-[#2b2119]">{qty}</span>
                  <button
                    type="button"
                    aria-label="Tambah"
                    onClick={() => setQty((v) => Math.min(99, v + 1))}
                    className="grid size-7 place-items-center rounded-md text-[#b8521f] hover:bg-[#f0d9c8]"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {/* Catatan */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#2b2119]">
                    Notes for kitchen <span className="font-normal text-[#5c5147]">(optional)</span>
                  </p>
                  <span className="text-[11px] text-[#5c5147]">
                    {notes.length}/150
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={150}
                  placeholder="e.g. sambal on the side, no pickles..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#e4d9cc] bg-[#f7ece4] px-4 py-3 text-sm outline-none focus:border-[#b8521f]"
                />
              </div>

              <button
                onClick={confirm}
                className="mt-4 w-full rounded-xl bg-[#b8521f] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
              >
                {existingItem ? "Update Cart" : "Add to Cart"} · {rp.format(Number(item.price) * qty)}
              </button>

              {existingItem && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[#c0392b] transition-colors hover:underline"
                >
                  <Trash2 className="size-3.5" />
                  Remove item from cart
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

