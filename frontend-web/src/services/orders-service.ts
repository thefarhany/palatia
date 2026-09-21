import { apiClient } from "@/lib/api-client";
import type { InvoiceData, Order } from "@/lib/types";

export const ordersService = {
  list: () => apiClient<{ orders: Order[] }>("/bo/orders").then((r) => r.orders),
  create: (data: { type: string; tableId?: number; items: { menuItemId: number; qty: number; notes?: string }[] }) =>
    apiClient<{ order: Order }>("/bo/orders", { method: "POST", body: data }).then((r) => r.order),
  setStatus: (id: number, status: string) =>
    apiClient(`/bo/orders/${id}/status`, { method: "PATCH", body: { status } }),
  pay: (id: number, method: "CASH" | "CARD_AT_COUNTER") =>
    apiClient(`/bo/orders/${id}/pay`, { method: "POST", body: { method } }),
  cancel: (id: number) => apiClient(`/bo/orders/${id}/cancel`, { method: "PATCH" }),
  discount: (id: number, discount: number) =>
    apiClient(`/bo/orders/${id}/discount`, { method: "PATCH", body: { discount } }),
  /** Guest QR order — tanpa auth, DINE_IN dari token meja. Balikin order + trackingToken. */
  createGuestOrder: (data: {
    type: string;
    tableId?: number;
    items: { menuItemId: number; qty: number; notes?: string }[];
  }) => apiClient<{ order: Order }>("/public/orders", { method: "POST", body: data }).then((r) => r.order),
  /** Guest bayar (placeholder gateway) via token. */
  payByToken: (token: string) =>
    apiClient(`/public/orders/${token}/pay`, { method: "POST" }),
  invoice: (id: number) =>
    apiClient<{ invoice: InvoiceData }>(`/me/orders/${id}/invoice`).then((r) => r.invoice),
};
