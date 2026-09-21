import { prisma } from "../lib/prisma.js";

// Daily sales: paid+completed orders created that day (UC-26).
export async function dailySales(date?: string) {
  const day = date ? new Date(date) : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const agg = await prisma.order.aggregate({
    where: { paymentStatus: "PAID", status: "COMPLETED", createdAt: { gte: start, lte: end } },
    _sum: { total: true, discount: true, tax: true },
    _count: true,
  });

  return {
    date: day.toISOString().slice(0, 10),
    orderCount: agg._count,
    revenue: Number(agg._sum.total ?? 0),
    discounts: Number(agg._sum.discount ?? 0),
    tax: Number(agg._sum.tax ?? 0),
  };
}

// Popular dishes over the last N days, by completed order quantity (UC-26).
export async function popularDishes(days = 30, take = 10) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: { order: { status: "COMPLETED", paymentStatus: "PAID", createdAt: { gte: since } } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take,
  });

  const names = new Map(
    (await prisma.menuItem.findMany({ where: { id: { in: rows.map((r) => r.menuItemId) } }, select: { id: true, name: true } })).map(
      (m) => [m.id, m.name]
    )
  );

  return rows.map((r) => ({ menuItemId: r.menuItemId, name: names.get(r.menuItemId) ?? "?", totalQty: r._sum.qty }));
}