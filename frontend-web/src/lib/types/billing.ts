import type { Order } from "./orders";

export type BillingOrder = Order;

export interface InvoiceData {
  number: string;
  issuedAt?: string;
  status: string;
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod: string | null;
  tableNumber: number | null;
  servedBy: string | null;
  items: { qty: number; name: string; unitPrice: number; notes: string | null }[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  total: number;
}
