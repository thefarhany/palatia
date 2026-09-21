import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, resetDb, seedUsers, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let tableIds: number[] = [];
const DATE = "2030-12-25";
const SLOT = "19:00";

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  const tables = await Promise.all(
    [1, 2].map((n) => prisma.restaurantTable.create({ data: { number: n, capacity: n === 1 ? 4 : 8 } }))
  );
  tableIds = tables.map((t) => t.id);
});

function reserve(as: { id: number; role: "CUSTOMER" }, tableId: number, date = DATE, slot = SLOT) {
  return post("/api/me/reservations").set(bearer(as.id, as.role)).send({ tableId, date, slot, guests: 2 });
}

describe("POST /api/me/reservations", () => {
  it("creates a reservation with status PENDING", async () => {
    const res = await reserve(u.customer, tableIds[0]);
    expect(res.status).toBe(201);
    expect(res.body.reservation.status).toBe("PENDING");
  });

  it("rejects past dates", async () => {
    const res = await reserve(u.customer, tableIds[0], "2020-01-01");
    expect(res.status).toBe(400);
  });

  it("rejects guests over capacity", async () => {
    // tableIds[0] seats 4 — 9 guests must be refused
    const res = await post("/api/me/reservations")
      .set(bearer(u.customer.id, "CUSTOMER"))
      .send({ tableId: tableIds[0], date: "2030-12-26", slot: "19:00", guests: 9 });
    expect(res.status).toBe(400);
  });

  it("rejects unknown table", async () => {
    const res = await reserve(u.customer, 99999, "2030-12-26");
    expect(res.status).toBe(404);
  });

  it("THE GUARD: parallel bookings on same table+date+slot → exactly one wins", async () => {
    const [a, b] = await Promise.all([reserve(u.customer, tableIds[1]), reserve(u.customer2, tableIds[1])]);
    const codes = [a.status, b.status].sort();
    // one 201, one 409 (unique index) — order of resolution is nondeterministic
    expect(codes).toEqual([201, 409]);
    expect((await prisma.reservation.findMany({ where: { tableId: tableIds[1], date: new Date(DATE) } }))).toHaveLength(1);
  });

  it("same table different slot is fine", async () => {
    const res = await reserve(u.customer, tableIds[1], DATE, "21:00");
    expect(res.status).toBe(201);
  });

  it("requires auth", async () => {
    const res = await post("/api/me/reservations").send({ tableId: tableIds[0], date: DATE, slot: SLOT, guests: 2 });
    expect(res.status).toBe(401);
  });
});

describe("GET availability", () => {
  it("flags reserved tables for date+slot, free for other slots", async () => {
    const busy = await get(`/api/me/reservations/availability?date=${DATE}&slot=${SLOT}`).set(bearer(u.customer.id, "CUSTOMER"));
    const busyMap = new Map(busy.body.tables.map((t: { id: number; reserved: boolean }) => [t.id, t.reserved]));
    expect(busyMap.get(tableIds[0])).toBe(true);
    expect(busyMap.get(tableIds[1])).toBe(true);

    const free = await get(`/api/me/reservations/availability?date=${DATE}&slot=11:00`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(free.body.tables.every((t: { reserved: boolean }) => !t.reserved)).toBe(true);
  });
});

describe("reservation status flow (staff)", () => {
  it("waiter: PENDING → CONFIRMED → SEATED → COMPLETED", async () => {
    const r = (await reserve(u.customer2, tableIds[0], "2030-12-27", "11:00")).body.reservation;

    for (const status of ["CONFIRMED", "SEATED", "COMPLETED"]) {
      const res = await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status });
      expect(res.body.reservation.status).toBe(status);
    }
  });

  it("blocks illegal jump (SEATED → CONFIRMED) with 409", async () => {
    const r = (await reserve(u.customer, tableIds[0], "2030-12-28", "11:00")).body.reservation;
    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "CONFIRMED" });
    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "SEATED" });
    const res = await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "CONFIRMED" });
    expect(res.status).toBe(409);
  });
});

describe("cancel rules", () => {
  it("customer cancels own CONFIRMED reservation", async () => {
    const r = (await reserve(u.customer2, tableIds[0], "2030-12-29", "11:00")).body.reservation;
    const res = await patch(`/api/me/reservations/${r.id}/status`).set(bearer(u.customer2.id, "CUSTOMER")).send({ status: "CANCELLED" });
    expect(res.body.reservation.status).toBe("CANCELLED");
  });

  it("customer cannot cancel after SEATED", async () => {
    const r = (await reserve(u.customer, tableIds[0], "2030-12-30", "11:00")).body.reservation;
    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "CONFIRMED" });
    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "SEATED" });
    const res = await patch(`/api/me/reservations/${r.id}/status`).set(bearer(u.customer.id, "CUSTOMER")).send({ status: "CANCELLED" });
    expect(res.status).toBe(403);
  });

  it("customer cannot cancel a stranger's reservation (404)", async () => {
    const r = (await reserve(u.customer, tableIds[0], "2030-12-31", "11:00")).body.reservation;
    const res = await patch(`/api/me/reservations/${r.id}/status`).set(bearer(u.customer2.id, "CUSTOMER")).send({ status: "CANCELLED" });
    expect(res.status).toBe(404);
  });
});

describe("visibility", () => {
  it("customer lists only own reservations", async () => {
    const mine = await get("/api/me/reservations").set(bearer(u.customer2.id, "CUSTOMER"));
    expect(mine.body.reservations.every((r: { userId: number }) => r.userId === u.customer2.id)).toBe(true);

    const all = await get("/api/bo/reservations").set(bearer(u.waiter.id, "WAITER"));
    expect(all.body.reservations.length).toBeGreaterThanOrEqual(mine.body.reservations.length);
  });
});

describe("table management", () => {
  it("customer gets 403 on table routes", async () => {
    const res = await get("/api/bo/tables").set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.status).toBe(403);
  });

  it("admin creates a table", async () => {
    const res = await post("/api/bo/tables").set(bearer(u.admin.id, "ADMIN")).send({ number: 99, capacity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.table.number).toBe(99);
  });

  it("admin marks table OUT_OF_SERVICE → hidden from availability", async () => {
    const t = (await post("/api/bo/tables").set(bearer(u.admin.id, "ADMIN")).send({ number: 98, capacity: 6 })).body.table;
    await patch(`/api/bo/tables/${t.id}`).set(bearer(u.admin.id, "ADMIN")).send({ status: "OUT_OF_SERVICE" });

    const avail = await get(`/api/me/reservations/availability?date=${DATE}&slot=15:00`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(avail.body.tables.every((x: { id: number }) => x.id !== t.id)).toBe(true);
  });
});