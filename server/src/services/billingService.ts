import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { computeTotals, RESTAURANT } from "../lib/pricing.js";
import { emitToRoles } from "../lib/realtime.js";
import { HttpError } from "../lib/httpError.js";
import { dec } from "./inventoryService.js";
import { logAudit } from "./auditService.js";

const orderInclude = {
  items: {
    select: { id: true, qty: true, unitPrice: true, notes: true, menuItem: { select: { name: true, category: true } } },
  },
  table: { select: { number: true } },
  customer: { select: { name: true } },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function lineItems(order: OrderWithItems) {
  return order.items.map((i) => ({
    name: i.menuItem.name,
    category: i.menuItem.category,
    qty: i.qty,
    unitPrice: dec(i.unitPrice),
    notes: i.notes,
    amount: Math.round(dec(i.unitPrice) * i.qty * 100) / 100,
  }));
}

// GET invoice — full printable payload (UC-17/20).
export async function invoice(actor: { userId: number; role: string }, id: number) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new HttpError(404, "Not found");
  if (actor.role === "CUSTOMER" && order.customerId !== actor.userId) {
    throw new HttpError(404, "Not found");
  }

  return {
    restaurant: RESTAURANT,
    number: order.code,
    issuedAt: order.updatedAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    type: order.type,
    tableNumber: order.table?.number ?? null,
    servedBy: order.customer?.name ?? null,
    items: lineItems(order),
    subtotal: dec(order.subtotal),
    discount: dec(order.discount),
    tax: dec(order.tax),
    serviceCharge: dec(order.serviceCharge),
    total: dec(order.total),
  };
}

// PATCH discount — waiter/admin apply before payment (UC-18).
// Totals are recomputed server-side: tax & service sit on top of (subtotal - discount).
export async function applyDiscount(actorId: number, id: number, discount: number) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new HttpError(404, "Not found");
  if (order.paymentStatus === "PAID") {
    throw new HttpError(409, "Cannot discount a paid order");
  }
  if (["COMPLETED", "CANCELLED"].includes(order.status)) {
    throw new HttpError(409, `Cannot discount an order in ${order.status}`);
  }
  if (discount > dec(order.subtotal)) {
    throw new HttpError(400, "Discount cannot exceed subtotal");
  }

  const totals = computeTotals(dec(order.subtotal), discount);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      discount: totals.discount,
      tax: totals.tax,
      serviceCharge: totals.serviceCharge,
      total: totals.total,
    },
  });
  emitToRoles(["WAITER", "ADMIN"], "order:status", { orderId: updated.id, status: updated.status });
  await logAudit(actorId, "billing.discount", "order", updated.id, { discount: totals.discount });
  return {
    ...updated,
    subtotal: dec(updated.subtotal),
    discount: dec(updated.discount),
    tax: dec(updated.tax),
    serviceCharge: dec(updated.serviceCharge),
    total: dec(updated.total),
  };
}