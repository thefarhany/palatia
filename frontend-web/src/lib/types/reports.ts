export interface DailyReport {
  date: string;
  orderCount: number;
  revenue: number;
  discounts?: number;
  tax?: number;
}

export interface PopularItem {
  menuItemId: number;
  name: string;
  totalQty: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string; role: string };
}
