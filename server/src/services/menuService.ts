import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "./auditService.js";
import { HttpError } from "../lib/httpError.js";
import { deleteUploadFile } from "../lib/uploads.js";

export const publicFields = {
  id: true,
  name: true,
  category: true,
  description: true,
  price: true,
  available: true,
  isFeatured: true,
  imageUrl: true,
} satisfies Prisma.MenuItemSelect;

// Admin list adds recipe count (badge "sudah ada resep?" on the menu table).
export const adminFields = {
  ...publicFields,
  _count: { select: { recipeItems: true } },
} satisfies Prisma.MenuItemSelect;

export async function listAdmin() {
  return prisma.menuItem.findMany({
    orderBy: { name: "asc" },
    select: adminFields,
  });
}

export async function list(q: string, category: string, onlyAvailable: boolean) {
  const items = await prisma.menuItem.findMany({
    where: {
      AND: [
        onlyAvailable ? { available: true } : {},
        q ? { name: { contains: q } } : {},
        category ? { category } : {},
      ].filter((c) => Object.keys(c).length > 0),
    },
    orderBy: { name: "asc" },
    select: publicFields,
  });
  return items;
}

export async function categories() {
  const rows = await prisma.menuItem.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

export async function create(actorId: number, data: Prisma.MenuItemCreateInput) {
  const item = await prisma.menuItem.create({ data, select: publicFields });
  await logAudit(actorId, "menu.created", "menu_item", item.id, { name: item.name });
  return item;
}

export async function update(actorId: number, id: number, data: Prisma.MenuItemUpdateInput) {
  const existing = await prisma.menuItem.findUnique({ where: { id }, select: { imageUrl: true } });
  const item = await prisma.menuItem.update({ where: { id }, data, select: publicFields });

  if (existing?.imageUrl && typeof data.imageUrl === "string" && existing.imageUrl !== data.imageUrl) {
    deleteUploadFile(existing.imageUrl);
  }

  await logAudit(actorId, "menu.updated", "menu_item", id, data);
  return item;
}

export async function remove(actorId: number, id: number) {
  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, recipeItems: true } } },
  });
  if (!item) throw new HttpError(404, "Menu item not found");

  if (item._count.orderItems > 0) {
    throw new HttpError(
      409,
      "Cannot delete a menu item that has past orders. Disable its availability instead."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.recipeItem.deleteMany({ where: { menuItemId: id } });
    await tx.menuItem.delete({ where: { id } });
  });

  if (item.imageUrl) {
    deleteUploadFile(item.imageUrl);
  }

  await logAudit(actorId, "menu.deleted", "menu_item", id, { name: item.name });
}