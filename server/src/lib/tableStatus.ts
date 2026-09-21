import { prisma } from "./prisma.js";
import { emitToRoles } from "./realtime.js";

// Table status is DERIVED from active orders + reservations — never hand-set
// (only OUT_OF_SERVICE stays manual, set by admin).
//   OCCUPIED = active order (PENDING/PREPARING/READY) or a SEATED reservation
//   RESERVED = PENDING/CONFIRMED reservation for today
//   FREE     = neither
export async function refreshTableStatus(tableId: number) {
  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table || table.status === "OUT_OF_SERVICE") return;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [activeOrder, seated, reservedToday] = await Promise.all([
    prisma.order.findFirst({ where: { tableId, status: { in: ["PENDING", "PREPARING", "READY"] } } }),
    prisma.reservation.findFirst({ where: { tableId, status: "SEATED" } }),
    prisma.reservation.findFirst({
      where: { tableId, status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: start, lte: end } },
    }),
  ]);

  const status = activeOrder || seated ? "OCCUPIED" : reservedToday ? "RESERVED" : "FREE";
  if (status !== table.status) {
    await prisma.restaurantTable.update({ where: { id: tableId }, data: { status } });
    emitToRoles(["WAITER", "ADMIN"], "table:status", { tableId, status });
  }
}