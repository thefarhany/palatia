import { beforeAll, describe, expect, it } from "vitest";
import { bearer, app, get, post, patch, resetDb, seedUsers, seedMenu, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;
let tableId: number;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2); // prices 10000, 15000
  // resetDb deletes rows but doesn't reset autoincrement — use the fresh id.
  tableId = (await prisma.restaurantTable.create({ data: { number: 1, capacity: 4 } })).id;
});

function createOrder(as: { id: number; role: "CUSTOMER" }, body?: object) {
  return post("/api/me/orders")
    .set(bearer(as.id, as.role))
    .send(
      body ?? {
        type: "DINE_IN",
        tableId,
        items: [
          { menuItemId: items[0].id, qty: 2, notes: "pedas" },
          { menuItemId: items[1].id, qty: 1 },
        ],
      }
    );
}

describe("POST /api/orders", () => {
  it("computes totals server-side from DB prices", async () => {
    const res = await createOrder(u.customer);
    expect(res.status).toBe(201);
    // subtotal 2*10000 + 1*15000 = 35000, tax 10% = 3500, service 5% = 1750, total 40000
    expect(res.body.order.subtotal).toBe(35000);
    expect(res.body.order.tax).toBe(3500);
    expect(res.body.order.serviceCharge).toBe(1750);
    expect(res.body.order.total).toBe(40250);
    expect(res.body.order.code).toMatch(/^ORD-\d{5}$/);
    expect(res.body.order.status).toBe("PENDING");
  });

  it("ignores client-sent price fields", async () => {
    const res = await createOrder(u.customer, {
      type: "TAKEAWAY",
      items: [{ menuItemId: items[0].id, qty: 1, price: 1 }],
    });
    expect(res.body.order.subtotal).toBe(10000); // DB price, not the sent 1
    expect(res.body.order.total).toBe(11500);
  });

  it("rejects unavailable items", async () => {
    await prismaOff();
  });

  it("guest TAKEAWAY is refused (guests may only order DINE_IN from a table QR)", async () => {
    const res = await post("/api/public/orders").send({ type: "TAKEAWAY", items: [{ menuItemId: items[0].id, qty: 1 }] });
    expect(res.status).toBe(400);
  });

  it("rejects empty items with 400", async () => {
    const res = await createOrder(u.customer, { type: "TAKEAWAY", items: [] });
    expect(res.status).toBe(400);
  });
});

// helper: mark an item unavailable then expect create to fail
async function prismaOff() {
  const { prisma } = await import("./helpers.js");
  const last = await prisma.menuItem.findFirstOrThrow({ orderBy: { id: "desc" } });
  await prisma.menuItem.update({ where: { id: last.id }, data: { available: false } });
  const res = await post("/api/me/orders")
    .set(bearer(u.customer.id, "CUSTOMER"))
    .send({ type: "TAKEAWAY", items: [{ menuItemId: last.id, qty: 1 }] });
  expect(res.status).toBe(400);
  await prisma.menuItem.update({ where: { id: last.id }, data: { available: true } });
}

describe("order status state machine (prepaid)", () => {
  it("unpaid order cannot enter the kitchen (paid gate)", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    expect(res.status).toBe(409);
  });

  it("paid order: PENDING → PREPARING → READY → COMPLETED (waiter)", async () => {
    const order = (await createOrder(u.customer)).body.order;
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});

    const s1 = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    expect(s1.body.order.status).toBe("PREPARING");

    const s2 = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "READY" });
    expect(s2.body.order.status).toBe("READY");

    const s3 = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.waiter.id, "WAITER")).send({ status: "SERVED" });
    expect(s3.body.order.status).toBe("SERVED");

    const s4 = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
    expect(s4.body.order.status).toBe("COMPLETED");
  });

  it("blocks illegal jumps with 409", async () => {
    const order = (await createOrder(u.customer)).body.order;
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    const res = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "COMPLETED" });
    expect(res.status).toBe(409);
  });

  it("chef cannot COMPLETE (403), waiter can", async () => {
    const order = (await createOrder(u.customer)).body.order;
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "READY" });

    const denied = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "COMPLETED" });
    expect(denied.status).toBe(403);

    const ok = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
    expect(ok.body.order.status).toBe("COMPLETED");
  });

  it("customer cannot drive status at all", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.customer.id, "CUSTOMER")).send({ status: "PREPARING" });
    expect(res.status).toBe(403);
  });
});

describe("cancel", () => {
  it("customer can cancel own PENDING order", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await patch(`/api/me/orders/${order.id}/cancel`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.body.order.status).toBe("CANCELLED");
  });

  it("cannot cancel after PREPARING", async () => {
    const order = (await createOrder(u.customer)).body.order;
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    const res = await patch(`/api/me/orders/${order.id}/cancel`).set(bearer(u.waiter.id, "WAITER"));
    expect(res.status).toBe(409);
  });

  it("customer cannot cancel someone else's order", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await patch(`/api/me/orders/${order.id}/cancel`).set(bearer(u.customer2.id, "CUSTOMER"));
    expect(res.status).toBe(404);
  });
});

describe("payment (prepaid model)", () => {
  it("customer Pay Now: PAID, status unchanged (kitchen gate opens)", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await post(`/api/me/orders/${order.id}/pay`)
      .set(bearer(u.customer.id, "CUSTOMER"))
      .send({ method: "CARD_AT_COUNTER" });
    expect(res.body.payment.status).toBe("SUCCESS");
    expect(res.body.payment.amount).toBe(res.body.order.total);
    expect(res.body.order.paymentStatus).toBe("PAID");
    expect(res.body.order.status).toBe("PENDING"); // kitchen takes over from here
  });

  it("cashier can pre-pay a PICKUP order (tableless, no gate issues)", async () => {
    const order = (await createOrder(u.customer, {
      type: "PICKUP",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    })).body.order;
    expect(order.tableId).toBeNull();

    const paid = await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.waiter.id, "WAITER")).send({ method: "CASH" });
    expect(paid.body.order.paymentStatus).toBe("PAID");
  });

  it("DINE_IN without a table → 400", async () => {
    const res = await createOrder(u.customer, {
      type: "DINE_IN",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it("double pay → 409", async () => {
    const order = (await createOrder(u.customer)).body.order;
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    const res = await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    expect(res.status).toBe(409);
  });

  it("customer cannot pay someone else's order (404)", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer2.id, "CUSTOMER")).send({});
    expect(res.status).toBe(404);
  });

  it("waiter records a counter payment on any order", async () => {
    const order = (await createOrder(u.customer2)).body.order;
    const res = await post(`/api/me/orders/${order.id}/pay`)
      .set(bearer(u.waiter.id, "WAITER")).send({ method: "CASH" });
    expect(res.body.order.paymentMethod).toBe("CASH");
    expect(res.body.order.paymentStatus).toBe("PAID");
  });
});

describe("visibility", () => {
  it("customer list shows only own orders", async () => {
    const mine = await get("/api/me/orders").set(bearer(u.customer.id, "CUSTOMER"));
    expect(mine.body.orders.every((o: { customerId: number | null }) => o.customerId === u.customer.id)).toBe(true);

    const all = await get("/api/me/orders").set(bearer(u.waiter.id, "WAITER"));
    expect(all.body.orders.length).toBeGreaterThanOrEqual(mine.body.orders.length);
  });

  it("customer reading a stranger's order gets 404", async () => {
    const order = (await createOrder(u.customer)).body.order;
    const res = await get(`/api/me/orders/${order.id}`).set(bearer(u.customer2.id, "CUSTOMER"));
    expect(res.status).toBe(404);
  });
});

// silence unused import warnings for `app` (kept for future socket tests)
void app;