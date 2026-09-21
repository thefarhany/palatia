export interface OrderItem {
  id: number;
  qty: number;
  unitPrice: number;
  notes: string | null;
  menuItem: { name: string };
}

export interface Order {
  id: number;
  code: string;
  trackingToken: string | null;
  type: "DINE_IN" | "PICKUP" | "TAKEAWAY";
  status: string;
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod: string | null;
  total: number;
  createdAt: string;
  tableId: number | null;
  table: { id: number; number: number } | null;
  items: OrderItem[];
}

export interface OrderItemRow {
  key: number;
  menuItemId: number | null;
  qty: number;
  notes: string;
}

export type OrdersFilter = "aktif" | "selesai" | "semua";
