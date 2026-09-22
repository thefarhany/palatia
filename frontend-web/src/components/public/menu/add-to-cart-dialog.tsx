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
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-5 rounded-2xl border border-[#f0e8de]">
        {item && (
          <div className="space-y-3.5">
            {/* Foto dengan rounded corner & inset padding */}
            <div className="relative h-36 sm:h-44 w-full overflow-hidden rounded-xl bg-[#f7ece4]">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#b8521f] uppercase">
                {item.category}
              </span>
              <DialogTitle className="font-brand text-xl sm:text-2xl font-bold text-[#2b2119]">
                {item.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5c5147]">
                {item.description ?? "Home-style cooking, Palatia's way."}
              </DialogDescription>
              <p className="mt-2 font-brand text-lg sm:text-xl font-bold text-[#b8521f]">
                {rp.format(Number(item.price))}
              </p>
            </div>

            {/* Jumlah */}
            <div className="flex items-center justify-between border-t border-[#f0e8de] pt-3">
              <span className="text-xs sm:text-sm font-semibold text-[#2b2119]">Quantity</span>
              <div className="flex items-center gap-3 rounded-lg bg-[#f7ece4] px-2 py-1">
                <button
                  type="button"
                  aria-label="Kurangi"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="grid size-7 place-items-center rounded text-[#b8521f] hover:bg-[#f0d9c8]"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-5 text-center text-xs sm:text-sm font-bold text-[#2b2119]">{qty}</span>
                <button
                  type="button"
                  aria-label="Tambah"
                  onClick={() => setQty((v) => Math.min(99, v + 1))}
                  className="grid size-7 place-items-center rounded text-[#b8521f] hover:bg-[#f0d9c8]"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2b2119]">
                  Notes for kitchen <span className="font-normal text-[#5c5147]">(optional)</span>
                </span>
                <span className="text-[10px] text-[#5c5147]">
                  {notes.length}/150
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={150}
                placeholder="e.g. sambal on the side, no pickles..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e4d9cc] bg-[#fdfbf7] p-2.5 text-xs text-[#2b2119] outline-none focus:border-[#b8521f]"
              />
            </div>

            <button
              onClick={confirm}
              className="w-full rounded-xl bg-[#b8521f] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#9c4519] active:scale-98 shadow-xs"
            >
              {existingItem ? "Update Cart" : "Add to Cart"} · {rp.format(Number(item.price) * qty)}
            </button>

            {existingItem && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-[#c0392b] hover:underline"
              >
                <Trash2 className="size-3.5" />
                Remove item from cart
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
