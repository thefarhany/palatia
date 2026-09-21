import { create } from "zustand";
import { ordersService } from "@/services/orders-service";
import type { Order } from "@/lib/types";

interface OrdersState {
  orders: Order[];
  loaded: boolean;
  fetch: () => Promise<void>;
  set: (orders: Order[]) => void;
  /** Chef/waiter mutation — PATCH status lalu re-sync. */
  setStatus: (id: number, status: string) => Promise<void>;
  /** Waiter: buat order + bayar di muka (PREPAID). */
  createAndPay: (
    data: { type: string; tableId?: number; items: { menuItemId: number; qty: number; notes?: string }[] },
    method: "CASH" | "CARD_AT_COUNTER",
  ) => Promise<Order>;
  pay: (id: number, method: "CASH" | "CARD_AT_COUNTER") => Promise<void>;
  cancel: (id: number) => Promise<void>;
  complete: (id: number) => Promise<void>;
  serve: (id: number) => Promise<void>;
  discount: (id: number, discount: number) => Promise<void>;
}

/** Daftar order staf — share antara kitchen, pickup, orders, floor. */
export const useOrdersStore = create<OrdersState>()((set, get) => ({
  orders: [],
  loaded: false,
  fetch: async () => {
    const orders = await ordersService.list().catch(() => null);
    if (orders) set({ orders, loaded: true });
  },
  set: (orders) => set({ orders, loaded: true }),
  setStatus: async (id, status) => {
    await ordersService.setStatus(id, status);
    await get().fetch();
  },
  createAndPay: async (data, method) => {
    const order = await ordersService.create(data);
    await ordersService.pay(order.id, method);
    await get().fetch();
    return order;
  },
  pay: async (id, method) => {
    await ordersService.pay(id, method);
    await get().fetch();
  },
  cancel: async (id) => {
    await ordersService.cancel(id);
    await get().fetch();
  },
  complete: async (id: number) => {
    await ordersService.setStatus(id, "COMPLETED");
    await get().fetch();
  },
  serve: async (id: number) => {
    await ordersService.setStatus(id, "SERVED");
    await get().fetch();
  },
  discount: async (id, discount) => {
    await ordersService.discount(id, discount);
  },
}));
