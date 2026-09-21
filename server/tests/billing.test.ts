import { beforeAll, describe, expect, it } from "vitest";
import { bearer, post, patch, get, resetDb, seedUsers, seedMenu } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2); // 10000, 15000
});

async function makeOrder(as: { id: number; role: "CUSTOMER" }) {
  return (await post("/api/me/orders").set(bearer(as.id, as.role)).send({
    type: "TAKEAWAY",
    items: [{ menuItemId: items[0].id, qty: 2 }, { menuItemId: items[1].id, qty: 1 }],
  })).body.order;
}
// base totals: subtotal 35000, tax 3500, service 1750, total 40250

describe("PATCH /api/billing/orders/:id/discount", () => {
  it("waiter applies discount; tax & service recomputed on (subtotal - discount)", async () => {
    const order = await makeOrder(u.customer);
    const res = await patch(`/api/bo/orders/${order.id}/discount`)
      .set(bearer(u.waiter.id, "WAITER")).send({ discount: 10000 });
    // 25000 base → tax 2500, service 1250, total 28750
    expect(res.body.order.discount).toBe(10000);
    expect(res.body.order.tax).toBe(2500);
    expect(res.body.order.serviceCharge).toBe(1250);
    expect(res.body.order.total).toBe(28750);
  });

  it("discount over subtotal → 400", async () => {
    const order = await makeOrder(u.customer);
    const res = await patch(`/api/bo/orders/${order.id}/discount`)
      .set(bearer(u.waiter.id, "WAITER")).send({ discount: 50000 });
    expect(res.status).toBe(400);
  });

  it("negative discount → 400", async () => {
    const order = await makeOrder(u.customer);
    const res = await patch(`/api/bo/orders/${order.id}/discount`)
      .set(bearer(u.waiter.id, "WAITER")).send({ discount: -1 });
    expect(res.status).toBe(400);
  });

  it("customer cannot apply discount (403)", async () => {
    const order = await makeOrder(u.customer);
    const res = await patch(`/api/bo/orders/${order.id}/discount`)
      .set(bearer(u.customer.id, "CUSTOMER")).send({ discount: 1000 });
    expect(res.status).toBe(403);
  });

  it("paid order cannot be discounted (409)", async () => {
    const order = await makeOrder(u.customer);
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.waiter.id, "WAITER")).send({});
    const res = await patch(`/api/bo/orders/${order.id}/discount`)
      .set(bearer(u.waiter.id, "WAITER")).send({ discount: 1000 });
    expect(res.status).toBe(409);
  });
});

describe("GET /api/billing/orders/:id/invoice", () => {
  it("returns full printable invoice for own order (customer)", async () => {
    const order = await makeOrder(u.customer);
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({ method: "CASH" });

    const invRes = await get(`/api/me/orders/${order.id}/invoice`)
      .set(bearer(u.customer.id, "CUSTOMER"));
    expect(invRes.status).toBe(200);
    const i = invRes.body.invoice;
    expect(i.restaurant.name).toBe("Palatia Restaurant");
    expect(i.number).toMatch(/^ORD-\d{5}$/);
    expect(i.items).toHaveLength(2);
    expect(i.items[0].amount).toBe(20000);
    expect(i.subtotal).toBe(35000);
    expect(i.discount).toBe(0);
    expect(i.total).toBe(40250);
    expect(i.paymentStatus).toBe("PAID");
    expect(i.paymentMethod).toBe("CASH");
  });

  it("waiter can read any invoice", async () => {
    const order = await makeOrder(u.customer);
    const res = await get(`/api/me/orders/${order.id}/invoice`).set(bearer(u.waiter.id, "WAITER"));
    expect(res.status).toBe(200);
  });

  it("stranger customer gets 404", async () => {
    const order = await makeOrder(u.customer);
    const res = await get(`/api/me/orders/${order.id}/invoice`).set(bearer(u.customer2.id, "CUSTOMER"));
    expect(res.status).toBe(404);
  });

  it("unpaid invoice shows UNPAID", async () => {
    const order = await makeOrder(u.customer);
    const res = await get(`/api/me/orders/${order.id}/invoice`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.body.invoice.paymentStatus).toBe("UNPAID");
  });
});