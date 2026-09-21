import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, resetDb, seedUsers, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let tableId: number;
const DATE = "2030-12-25";

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  // via API so the QR token is assigned too
  tableId = (await post("/api/bo/tables").set(bearer(u.admin.id, "ADMIN")).send({ number: 7, capacity: 4 }))
    .body.table.id;
});

function guestReserve(tableId: number, slot = "19:00", extra: object = {}) {
  return post("/api/public/reservations").send({
    tableId,
    date: DATE,
    slot,
    guests: 2,
    name: "Tamu Kirana",
    phone: "0812-3456-7890",
    ...extra,
  });
}

describe("guest (anonymous) reservation", () => {
  it("creates without login; name+phone stored inline, no account attached", async () => {
    const res = await guestReserve(tableId);
    expect(res.status).toBe(201);
    expect(res.body.reservation.userId).toBeNull();
    expect(res.body.reservation.name).toBe("Tamu Kirana");
    expect(res.body.reservation.phone).toBe("0812-3456-7890");
    expect(res.body.reservation.status).toBe("PENDING");
  });

  it("requires name and phone", async () => {
    const res = await post("/api/public/reservations").send({
      tableId, date: DATE, slot: "19:00", guests: 2,
    });
    expect(res.status).toBe(400);
  });

  it("THE GUARD still holds for guests: parallel booking → exactly one wins", async () => {
    // fresh date so the earlier test's reservation doesn't collide
    const [a, b] = await Promise.all([
      post("/api/public/reservations").send({
        tableId, date: "2030-12-26", slot: "19:00", guests: 2, name: "A", phone: "0812-1111-1111",
      }),
      post("/api/public/reservations").send({
        tableId, date: "2030-12-26", slot: "19:00", guests: 2, name: "B", phone: "0812-2222-2222",
      }),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });

  it("public availability needs no auth; flags the reserved table", async () => {
    const res = await get(`/api/public/reservations/availability?date=${DATE}&slot=19:00`);
    expect(res.status).toBe(200);
    const found = res.body.tables.find((t: { id: number }) => t.id === tableId);
    expect(found.reserved).toBe(true);
  });

  it("design slots accepted (18:00, 20:00); removed 17:00 rejected", async () => {
    expect((await guestReserve(tableId, "18:00")).status).toBe(201);
    expect((await guestReserve(tableId, "20:00")).status).toBe(201);
    const removed = await post("/api/public/reservations").send({
      tableId, date: "2030-12-27", slot: "17:00", guests: 2, name: "X", phone: "081200000000",
    });
    expect(removed.status).toBe(400);
  });

  it("waiter sees the reservation with guest name; confirm works", async () => {
    const all = await get("/api/bo/reservations").set(bearer(u.waiter.id, "WAITER"));
    const guestRow = all.body.reservations.find((r: { name?: string }) => r.name === "Tamu Kirana");
    expect(guestRow).toBeDefined();
    expect(guestRow.name).toBe("Tamu Kirana");

    const latest = await prisma.reservation.findFirstOrThrow({ where: { userId: null }, orderBy: { id: "desc" } });
    const confirm = await patch(`/api/bo/reservations/${latest.id}/status`)
      .set(bearer(u.waiter.id, "WAITER")).send({ status: "CONFIRMED" });
    expect(confirm.body.reservation.status).toBe("CONFIRMED");
  });
});

describe("isFeatured (Best Seller badge)", () => {
  it("admin sets featured; public menu exposes it", async () => {
    const created = await post("/api/bo/menu")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ name: "Best Seller Dish", category: "Food", price: 30000 });
    expect(created.status).toBe(201);
    const item = created.body.item;

    await patch(`/api/bo/menu/${item.id}`).set(bearer(u.admin.id, "ADMIN")).send({ isFeatured: true });

    const list = (await get("/api/public/menu")).body.items;
    expect(list.find((i: { id: number }) => i.id === item.id).isFeatured).toBe(true);
    expect(list.every((i: { isFeatured: boolean }) => typeof i.isFeatured === "boolean")).toBe(true);
  });
});