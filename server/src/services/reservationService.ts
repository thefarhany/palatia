import crypto from "crypto";
import type { Prisma, ReservationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { emitToRoles } from "../lib/realtime.js";
import { HttpError } from "../lib/httpError.js";
import { notifyRole, notifyUser } from "./notificationService.js";
import { refreshTableStatus } from "../lib/tableStatus.js";
import env from "../lib/env.js";

export interface Actor {
  userId: number;
  role: "ADMIN" | "CHEF" | "WAITER" | "CUSTOMER";
}

const include = {
  user: { select: { id: true, name: true } },
  table: { select: { number: true } },
} satisfies Prisma.ReservationInclude;

export type ReservationFull = Prisma.ReservationGetPayload<{ include: typeof include }>;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET availability — tables with reserved flag for date+slot (UC-07).
export async function availability(date: string, slot: string) {
  const day = new Date(date);
  const tables = await prisma.restaurantTable.findMany({
    where: { status: { not: "OUT_OF_SERVICE" } },
    orderBy: { number: "asc" },
    include: {
      reservations: {
        where: { date: day, slot, status: { in: ["PENDING", "CONFIRMED", "SEATED"] } },
        select: { id: true, status: true },
      },
    },
  });
  return tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    status: t.status,
    reserved: t.reservations.length > 0,
  }));
}

// POST (UC-08). No check-then-insert: the unique index (tableId, date, slot)
// is the guard — a losing insert surfaces as P2002 → 409 via the error handler.
export async function create(
  actor: Actor | null,
  body: { tableId: number; date: string; slot: string; guests: number; name?: string; phone?: string }
) {
  const { tableId, date, slot, guests, name, phone } = body;

  // Guest reservations (no account) must carry name+phone inline.
  if (!actor && (!name || !phone)) {
    throw new HttpError(400, "Guest reservation requires name and phone");
  }
  if (new Date(date) < startOfToday()) {
    throw new HttpError(400, "Cannot reserve a past date");
  }

  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table || table.status === "OUT_OF_SERVICE") {
    throw new HttpError(404, "Table not found");
  }
  if (guests > table.capacity) {
    throw new HttpError(400, `Table ${table.number} seats max ${table.capacity}`);
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId: actor ? actor.userId : undefined,
      name: name ?? undefined,
      phone: phone ?? undefined,
      tableId,
      date: new Date(date),
      slot,
      guests,
    },
    include,
  });
  emitToRoles(["WAITER", "ADMIN"], "reservation:created", reservation);
  await notifyRole("WAITER", "reservation:new", {
    reservationId: reservation.id,
    date,
    slot,
    guests,
    tableNumber: table.number,
  });
  await refreshTableStatus(reservation.tableId);
  return reservation;
}

// List: customer sees own, staff see all (filterable by date).
export async function list(actor: Actor, date?: string) {
  return prisma.reservation.findMany({
    where: {
      ...(actor.role === "CUSTOMER" ? { userId: actor.userId } : {}),
      ...(date ? { date: new Date(date) } : {}),
    },
    orderBy: [{ date: "asc" }, { slot: "asc" }],
    include,
  });
}

const staffTransitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SEATED", "CANCELLED"],
  SEATED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

// PATCH status (UC-09/UC-16). Customer may only cancel own PENDING/CONFIRMED.
export async function changeStatus(actor: Actor, id: number, target: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id }, include });
  if (!reservation) throw new HttpError(404, "Not found");

  if (actor.role === "CUSTOMER") {
    if (reservation.userId !== actor.userId) throw new HttpError(404, "Not found");
    if (target !== "CANCELLED" || !["PENDING", "CONFIRMED"].includes(reservation.status)) {
      throw new HttpError(403, "You can only cancel your own upcoming reservation");
    }
  } else if (!["WAITER", "ADMIN"].includes(actor.role)) {
    throw new HttpError(403, "Forbidden");
  } else if (!staffTransitions[reservation.status].includes(target)) {
    throw new HttpError(409, `Cannot move ${reservation.status} → ${target}`);
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: target as ReservationStatus },
    include,
  });
  if (["CONFIRMED", "CANCELLED", "SEATED", "COMPLETED"].includes(updated.status) && reservation.userId) {
    await notifyUser(reservation.userId, "reservation:status", {
      reservationId: updated.id,
      status: updated.status,
      date: updated.date,
      slot: updated.slot,
    });
  }
  await refreshTableStatus(reservation.tableId);
  emitToRoles(["WAITER", "ADMIN"], "reservation:status", {
    reservationId: updated.id,
    status: updated.status,
  });
  return updated;
}

export function listTables() {
  return prisma.restaurantTable.findMany({ orderBy: { number: "asc" } });
}

export function newQrToken(): string {
  return crypto.randomBytes(8).toString("hex"); // 16 hex chars — unguessable enough for a table QR
}

export function qrUrl(token: string, reqHost?: string): string {
  // If PUBLIC_URL is explicitly set in env, use it.
  // Otherwise if reqHost is passed (from request headers), dynamically resolve frontend origin.
  let origin = process.env.PUBLIC_URL;
  if (!origin && reqHost) {
    const proto = reqHost.includes("localhost") || reqHost.includes("127.0.0.1") ? "http" : "https";
    const frontendHost = reqHost.replace("api-palatia.", "palatia.");
    origin = `${proto}://${frontendHost}`;
  }
  if (!origin) {
    origin = env.PUBLIC_URL || "http://localhost:3000";
  }
  return `${origin}/menu?t=${token}`;
}

export function createTable(data: { number: number; capacity: number; status?: "FREE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE" }) {
  return prisma.restaurantTable.create({ data: { ...data, qrToken: newQrToken() } });
}

// Rotating the token invalidates every printed QR for this table — that IS the
// revoke/delete of "QR CRUD". No separate QR storage; the token lives on the table row.
export async function regenerateQr(tableId: number, reqHost?: string) {
  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table) throw new HttpError(404, "Not found");
  const token = newQrToken();
  await prisma.restaurantTable.update({ where: { id: tableId }, data: { qrToken: token } });
  return { tableId, token, url: qrUrl(token, reqHost) };
}

export async function getQr(tableId: number, reqHost?: string) {
  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table) throw new HttpError(404, "Not found");
  const token = table.qrToken ?? (await regenerateQr(tableId, reqHost)).token; // legacy rows from before the column existed
  return { tableId, token, url: qrUrl(token, reqHost) };
}

// Public: a scanned QR resolves to its table (UC-06). Token unknown → 404.
export async function resolveTableByToken(token: string) {
  const table = await prisma.restaurantTable.findUnique({ where: { qrToken: token } });
  if (!table) throw new HttpError(404, "Table not found");
  return { tableId: table.id, number: table.number, capacity: table.capacity, status: table.status };
}

export function updateTable(id: number, data: { number?: number; capacity?: number; status?: "FREE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE" }) {
  return prisma.restaurantTable.update({ where: { id }, data });
}