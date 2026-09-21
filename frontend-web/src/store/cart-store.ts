import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  lineId: string;
  menuItemId: number;
  name: string;
  category?: string; // opsional — item cart lama (persist) tidak punya field ini
  price: number;
  qty: number;
  notes?: string;
  imageUrl?: string | null;
}

interface CartState {
  tableToken: string | null; // dari ?t= pada QR menu
  items: CartItem[];
  add: (item: { id: number; name: string; category: string; price: string; imageUrl?: string | null }, qty: number, notes?: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  updateNotes: (lineId: string, notes: string) => void;
  updateItem: (lineId: string, qty: number, notes?: string) => void;
  remove: (lineId: string) => void;
  setTableToken: (token: string | null) => void;
  clear: () => void;
}

/** Keranjang QR-order guest — persist ke localStorage. */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      tableToken: null,
      items: [],
      add: (item, qty, notes) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              lineId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              menuItemId: item.id,
              name: item.name,
              category: item.category,
              price: Number(item.price),
              qty,
              notes,
              imageUrl: item.imageUrl ?? null,
            },
          ],
        })),
      updateQty: (lineId, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)) })),
      updateNotes: (lineId, notes) =>
        set((s) => ({ items: s.items.map((i) => (i.lineId === lineId ? { ...i, notes: notes || undefined } : i)) })),
      updateItem: (lineId, qty, notes) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.lineId !== lineId)
              : s.items.map((i) =>
                  i.lineId === lineId ? { ...i, qty, notes: notes || undefined } : i,
                ),
        })),
      remove: (lineId) => set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),
      setTableToken: (token) => set({ tableToken: token }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "palatia-cart",
      // Items lama (sebelum ada lineId) diberi lineId saat rehydrate.
      migrate: (persisted) => {
        const state = persisted as CartState;
        return {
          ...state,
          // index dijamin unik — dua baris menu yang sama tetap dapat lineId beda.
          items: (state.items ?? []).map((i, idx) => ({
            ...i,
            lineId: i.lineId ?? `migrated-${idx}-${i.menuItemId}`,
          })),
        };
      },
    },
  ),
);
