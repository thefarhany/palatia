import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { notifyRole } from "./notificationService.js";
import { HttpError } from "../lib/httpError.js";

export function dec(n: Prisma.Decimal): number {
  return Number(n);
}

export async function listIngredients() {
  return prisma.ingredient.findMany({ orderBy: { name: "asc" } });
}

export async function createIngredient(data: Prisma.IngredientCreateInput) {
  return prisma.ingredient.create({ data });
}

export async function updateIngredient(id: number, data: Prisma.IngredientUpdateInput) {
  return prisma.ingredient.update({ where: { id }, data });
}

// Read the current recipe of a menu item (modal prefill for PUT /recipes/:id).
export async function getRecipe(menuItemId: number) {
  return prisma.recipeItem.findMany({
    where: { menuItemId },
    include: { ingredient: { select: { name: true, unit: true } } },
  });
}

// PUT replaces the whole recipe for a menu item — simplest correct semantics.
export async function replaceRecipe(menuItemId: number, items: { ingredientId: number; qty: number }[]) {
  const menu = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!menu) throw new HttpError(404, "Menu item not found");

  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeItem.deleteMany({ where: { menuItemId } });
    if (items.length) {
      await tx.recipeItem.createMany({
        data: items.map((i) => ({ menuItemId, ...i })),
      });
    }
    return tx.recipeItem.findMany({ where: { menuItemId } });
  });
  return recipe;
}

export async function listPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { ingredient: { select: { id: true, name: true, unit: true } } } } },
  });
}

export async function createPurchaseOrder(supplierName: string, items: { ingredientId: number; qty: number; unitCost: number }[]) {
  const exists = await prisma.ingredient.count({ where: { id: { in: items.map((i) => i.ingredientId) } } });
  if (exists !== items.length) throw new HttpError(400, "Unknown ingredient in items");

  const order = await prisma.purchaseOrder.create({
    data: {
      code: `PO-${Date.now().toString(36).toUpperCase()}`,
      supplierName,
      items: { createMany: { data: items } },
    },
    include: { items: true },
  });
  return order;
}

export async function receivePurchaseOrder(id: number) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new HttpError(404, "Not found");
  if (order.status !== "ORDERED") throw new HttpError(409, `Cannot receive a purchase order in ${order.status}`);

  const received = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.ingredient.update({
        where: { id: item.ingredientId },
        data: { stock: { increment: item.qty } },
      });
    }
    return tx.purchaseOrder.update({
      where: { id: order.id },
      data: { status: "RECEIVED" },
      include: { items: true },
    });
  });

  // Receiving stock can clear the low-stock condition — let admin know.
  await notifyRole("ADMIN", "inventory:received", {
    purchaseOrderId: received.id,
    code: received.code,
    items: received.items.map((i) => ({ ingredientId: i.ingredientId, qty: Number(i.qty) })),
  });
  return received;
}

export async function cancelPurchaseOrder(id: number) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) throw new HttpError(404, "Not found");
  if (order.status !== "ORDERED") throw new HttpError(409, `Cannot cancel a purchase order in ${order.status}`);
  return prisma.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
}

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { select: { qty: true; menuItemId: true } } };
}>;

// Runs once per completed order (hooked from both the status flow and the pay
// endpoint). Deducts recipe ingredients, then flags low stock.
// ponytail: no lock against two concurrent COMPLETED transitions — the state
// machine already prevents most paths; add a conditional update if it ever matters.
export async function onOrderCompleted(order: OrderWithItems) {
  const menuItemIds = order.items.map((i) => i.menuItemId);
  const recipes = await prisma.recipeItem.findMany({ where: { menuItemId: { in: menuItemIds } } });

  if (!recipes.length) return;

  // Per-order-item deduction, aggregated per ingredient in a single transaction.
  const deduct = new Map<number, number>();
  for (const item of order.items) {
    for (const r of recipes.filter((r) => r.menuItemId === item.menuItemId)) {
      deduct.set(r.ingredientId, (deduct.get(r.ingredientId) ?? 0) + Number(r.qty) * item.qty);
    }
  }

  await prisma.$transaction(
    Array.from(deduct).map(([ingredientId, qty]) =>
      prisma.ingredient.update({ where: { id: ingredientId }, data: { stock: { decrement: qty } } })
    )
  );

  const low = await prisma.ingredient.findMany({
    where: { id: { in: Array.from(deduct.keys()) } },
  });
  for (const ing of low) {
    if (Number(ing.stock) <= Number(ing.reorderLevel)) {
      await notifyRole("ADMIN", "inventory:low", {
        ingredientId: ing.id,
        name: ing.name,
        stock: Number(ing.stock),
        reorderLevel: Number(ing.reorderLevel),
        unit: ing.unit,
      });
    }
  }
}