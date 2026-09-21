import crypto from "crypto";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { computeTotals } from "../lib/pricing.js";
import { emitEvent, emitToRoles } from "../lib/realtime.js";
import { HttpError } from "../lib/httpError.js";
import { onOrderCompleted } from "./inventoryService.js";
import { notifyRole, notifyUser } from "./notificationService.js";
import { logAudit } from "./auditService.js";
import { refreshTableStatus } from "../lib/tableStatus.js";

export interface Actor {
  userId: number;
  role: "ADMIN" | "CHEF" | "WAITER" | "CUSTOMER";
}

const orderInclude = {
  items: {
    select: {
      id: true,
      menuItemId: true,
      qty: true,
      unitPrice: true,
      notes: true,
      menuItem: { select: { name: true } },
    },
  },
  table: { select: { number: true } },
} satisfies Prisma.OrderInclude;

export type OrderFull = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// Prisma Decimal serializes as a string in JSON — normalize money fields once.
export function orderView(order: OrderFull) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    serviceCharge: Number(order.serviceCharge),
    discount: Number(order.discount),
    total: Number(order.total),
    items: order.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
  };
}

export async function loadOrder(id: number) {
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

function canRead(order: OrderFull, actor: Actor) {
  return actor.role !== "CUSTOMER" || order.customerId === actor.userId;
}

function mustBeReadable(order: OrderFull | null, actor: Actor): OrderFull {
  if (!order || !canRead(order, actor)) throw new HttpError(404, "Not found");
  return order;
}

// Create order (UC-11 / UC-12). actor = null → guest order (anonymous QR):
// table-bound DINE_IN only, tracked/paid via trackingToken. Prices are read
// from the DB — client-sent prices are never trusted.
export async function createOrder(
  actor: Actor | null,
  body: { type: "DINE_IN" | "PICKUP" | "TAKEAWAY"; tableId?: number; items: { menuItemId: number; qty: number; notes?: string }[] }
) {
  const { type, tableId, items } = body;

  if (!actor) {
    // Guest orders must come from a table QR — PICKUP/TAKEAWAY belong to the cashier.
    if (type !== "DINE_IN" || !tableId) {
      throw new HttpError(400, "Guest orders must be DINE_IN placed from a table QR");
    }
  } else if (type === "DINE_IN" && !tableId) {
    throw new HttpError(400, "DINE_IN order requires a table");
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) }, available: true },
  });
  if (menuItems.length !== items.length) {
    throw new HttpError(400, "Some menu items are unavailable");
  }

  const priceOf = new Map(menuItems.map((m) => [m.id, Number(m.price)]));
  const subtotal = items.reduce((s, i) => s + priceOf.get(i.menuItemId)! * i.qty, 0);
  const totals = computeTotals(subtotal);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        // temp unique token; replaced by ORD-xxxxx below (id isn't known pre-insert)
        code: `tmp-${crypto.randomUUID()}`,
        // unguessable handle for guest tracking/payment (ORD-xxxxx is guessable)
        trackingToken: crypto.randomBytes(8).toString("hex"),
        type,
        tableId: type === "DINE_IN" ? tableId : undefined,
        customerId: actor ? actor.userId : undefined,
        status: "PENDING",
        subtotal,
        tax: totals.tax,
        serviceCharge: totals.serviceCharge,
        discount: 0,
        total: totals.total,
        items: {
          createMany: {
            data: items.map((i) => ({
              menuItemId: i.menuItemId,
              qty: i.qty,
              unitPrice: priceOf.get(i.menuItemId)!,
              notes: i.notes,
            })),
          },
        },
      },
    });
    // Human-readable code derived from id, e.g. ORD-00042.
    const code = `ORD-${String(created.id).padStart(5, "0")}`;
    return tx.order.update({ where: { id: created.id }, data: { code }, include: orderInclude });
  });

  if (order.paymentStatus === "PAID") {
    emitToRoles(["CHEF", "ADMIN"], "order:created", orderView(order));
    await notifyRole("CHEF", "order:new", { orderId: order.id, code: order.code, type: order.type });
  } else {
    emitToRoles(["ADMIN", "WAITER"], "order:created", orderView(order));
  }
  if (order.tableId) await refreshTableStatus(order.tableId);
  return order;
}

// List orders. CUSTOMER sees only their own; CHEF sees only PAID orders; staff see all.
export async function listOrders(actor: Actor, status?: OrderStatus) {
  const orders = await prisma.order.findMany({
    where: {
      ...(actor.role === "CUSTOMER" ? { customerId: actor.userId } : {}),
      ...(actor.role === "CHEF" ? { paymentStatus: "PAID" } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: orderInclude,
  });
  return orders;
}

export async function getOrder(actor: Actor, id: number) {
  return mustBeReadable(await loadOrder(id), actor);
}

// State machine + who may drive each edge (UC-14). PREPAID model:
// the kitchen only starts on a PAID order; "handed to customer" = SERVED / COMPLETED.
const transitions: Record<OrderStatus, { to: OrderStatus[]; roles: string[] }> = {
  PENDING: { to: ["PREPARING"], roles: ["CHEF", "ADMIN"] },
  PREPARING: { to: ["READY"], roles: ["CHEF", "ADMIN"] },
  READY: { to: ["SERVED", "COMPLETED"], roles: ["WAITER", "ADMIN"] },
  SERVED: { to: ["COMPLETED"], roles: ["WAITER", "ADMIN"] },
  COMPLETED: { to: [], roles: [] },
  CANCELLED: { to: [], roles: [] },
};

export async function changeStatus(actor: Actor, id: number, target: OrderStatus) {
  const order = await loadOrder(id);
  if (!order) throw new HttpError(404, "Not found");

  const rule = transitions[order.status];
  if (!rule.to.includes(target)) {
    throw new HttpError(409, `Cannot move ${order.status} → ${target}`);
  }
  if (!rule.roles.includes(actor.role)) {
    throw new HttpError(403, `Only ${rule.roles.join("/")} can move to ${target}`);
  }
  // Prepaid model: the kitchen only starts on paid orders (both modes pay upfront).
  if (target === "PREPARING" && order.paymentStatus !== "PAID") {
    throw new HttpError(409, "Order must be paid before the kitchen starts");
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: target },
    include: orderInclude,
  });

  if (target === "COMPLETED") {
    await onOrderCompleted(updated);
    if (updated.tableId) await refreshTableStatus(updated.tableId);
  }

  if (order.customerId) {
    await notifyUser(order.customerId, "order:status", { orderId: updated.id, status: updated.status });
  }
  emitEvent(`order:${updated.id}`, "order:status", { orderId: updated.id, status: updated.status });
  emitToRoles(["WAITER", "ADMIN", "CHEF"], "order:status", {
    orderId: updated.id,
    status: updated.status,
  });
  return updated;
}

// Cancel — only before PREPARING (UC-16). CUSTOMER may cancel own order.
export async function cancelOrder(actor: Actor, id: number) {
  const order = await loadOrder(id);
  if (!order) throw new HttpError(404, "Not found");
  if (!canRead(order, actor)) throw new HttpError(404, "Not found");
  if (!["PENDING"].includes(order.status)) {
    throw new HttpError(409, `Cannot cancel an order in ${order.status}`);
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
    include: orderInclude,
  });
  emitToRoles(["CHEF", "WAITER", "ADMIN"], "order:status", { orderId: updated.id, status: "CANCELLED" });
  return updated;
}

// Shared payment recording — guards + update + events. Guests skip audit/notify
// (they have no account; the order row itself is their receipt).
// ponytail: guest payments aren't in audit_logs (actorId is required + FK'd to
// users) — make the column nullable if guest-payment auditing ever matters.
async function recordPayment(order: OrderFull, method: "CASH" | "CARD_AT_COUNTER") {
  if (order.paymentStatus === "PAID") {
    throw new HttpError(409, "Order already paid");
  }
  if (["COMPLETED", "CANCELLED"].includes(order.status)) {
    throw new HttpError(409, `Cannot pay an order in ${order.status}`);
  }
  return prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", paymentMethod: method },
    include: orderInclude,
  });
}

async function paidEvents(order: OrderFull, customerId?: number | null, actorId?: number, method?: string) {
  if (customerId) {
    await notifyUser(customerId, "payment:recorded", {
      orderId: order.id,
      code: order.code,
      total: Number(order.total),
      method,
    });
  }
  if (actorId) {
    await logAudit(actorId, "payment.recorded", "order", order.id, {
      total: Number(order.total),
      method,
    });
  }
  await notifyRole("CHEF", "order:new", { orderId: order.id, code: order.code, type: order.type });
  emitToRoles(["CHEF"], "order:created", orderView(order));
  emitEvent(`order:${order.id}`, "order:paid", { orderId: order.id });
  emitToRoles(["WAITER", "ADMIN", "CHEF"], "order:paid", { orderId: order.id });
}

// Payment recording (UC-19 + frontend "Pay Now"). PREPAID model: payment happens
// upfront (cashless in-app, or CASH/CARD recorded by the cashier at order time)
// — it never changes order status. Kitchen gate lives in changeStatus.
export async function payOrder(actor: Actor, id: number, method: "CASH" | "CARD_AT_COUNTER") {
  const order = await loadOrder(id);
  mustBeReadable(order, actor);

  const staff = ["WAITER", "ADMIN"].includes(actor.role);
  // Customer may only pay their own order (the Pay Now flow); staff may record counter payments.
  if (!staff && order!.customerId !== actor.userId) throw new HttpError(404, "Not found");

  const updated = await recordPayment(order!, method);
  await paidEvents(updated, order!.customerId, actor.userId, method);
  return updated;
}

// Guest (anonymous QR) flows — addressed by the order's unguessable trackingToken.
export async function trackGuestOrder(token: string) {
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: { ...orderInclude, items: { include: { menuItem: { select: { name: true } } } } },
  });
  if (!order) throw new HttpError(404, "Not found");
  return order;
}

export async function payGuestOrder(token: string, method: "CASH" | "CARD_AT_COUNTER") {
  const order = await prisma.order.findUnique({ where: { trackingToken: token }, include: orderInclude });
  if (!order) throw new HttpError(404, "Not found");
  const updated = await recordPayment(order, method);
  await paidEvents(updated);
  return updated;
}