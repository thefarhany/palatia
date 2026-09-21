import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, resetDb, seedUsers, seedMenu, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;
let tableId: number;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2);
  // via API so the QR token is assigned too
  tableId = (await post("/api/bo/tables").set(bearer(u.admin.id, "ADMIN")).send({ number: 7, capacity: 4 }))
    .body.table.id;
});

async function tableStatus() {
  const res = await get("/api/bo/tables").set(bearer(u.waiter.id, "WAITER"));
  return res.body.tables.find((t: { id: number }) => t.id === tableId).status;
}

async function dineInOrder(as: { id: number; role: "CUSTOMER" }) {
  return (await post("/api/me/orders").set(bearer(as.id, as.role)).send({
    type: "DINE_IN",
    tableId,
    items: [{ menuItemId: items[0].id, qty: 1 }],
  })).body.order;
}

describe("derived table status", () => {
  it("starts FREE", async () => {
    expect(await tableStatus()).toBe("FREE");
  });

  it("DINE_IN order → OCCUPIED (automatic)", async () => {
    await dineInOrder(u.customer);
    expect(await tableStatus()).toBe("OCCUPIED");
  });

  it("PICKUP order never touches the table", async () => {
    await post("/api/me/orders").set(bearer(u.customer.id, "CUSTOMER")).send({
      type: "PICKUP",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    });
    expect(await tableStatus()).toBe("OCCUPIED"); // still occupied by the DINE_IN order
  });

  it("order COMPLETED → table back to FREE", async () => {
    // clear the still-active order from the previous test (it keeps the table OCCUPIED)
    const actives = await prisma.order.findMany({
      where: { tableId, status: { in: ["PENDING", "PREPARING", "READY"] } },
    });
    for (const o of actives) {
      await patch(`/api/me/orders/${o.id}/cancel`).set(bearer(u.customer.id, "CUSTOMER"));
    }

    const order = await dineInOrder(u.customer);
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "READY" });
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
    expect(await tableStatus()).toBe("FREE");
  });

  it("reservation today → RESERVED; SEATED → OCCUPIED; COMPLETED → FREE", async () => {
    const r = (await post("/api/me/reservations").set(bearer(u.customer.id, "CUSTOMER")).send({
      tableId,
      date: new Date().toISOString().slice(0, 10),
      slot: "21:00",
      guests: 2,
    })).body.reservation;
    // PENDING for today → RESERVED
    expect(await tableStatus()).toBe("RESERVED");

    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "CONFIRMED" });
    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "SEATED" });
    expect(await tableStatus()).toBe("OCCUPIED");

    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
    expect(await tableStatus()).toBe("FREE");
  });

  it("OUT_OF_SERVICE is never overridden", async () => {
    await patch(`/api/bo/tables/${tableId}`).set(bearer(u.admin.id, "ADMIN")).send({ status: "OUT_OF_SERVICE" });
    await dineInOrder(u.customer);
    expect(await tableStatus()).toBe("OUT_OF_SERVICE");
    await patch(`/api/bo/tables/${tableId}`).set(bearer(u.admin.id, "ADMIN")).send({ status: "FREE" });
    // refresh happens on next event; force by completing an order
    const order = await dineInOrder(u.customer);
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "READY" });
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
  });
});