import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, resetDb, seedUsers, seedMenu, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;
let tableId: number;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2);
  tableId = (await post("/api/bo/tables").set(bearer(u.admin.id, "ADMIN")).send({ number: 7, capacity: 4 }))
    .body.table.id;
});

function guestOrder() {
  return post("/api/public/orders").send({
    type: "DINE_IN",
    tableId,
    items: [{ menuItemId: items[0].id, qty: 2, notes: "pedas" }],
  });
}

describe("guest (anonymous QR) ordering", () => {
  it("guest creates a DINE_IN order without login; gets trackingToken", async () => {
    const res = await guestOrder();
    expect(res.status).toBe(201);
    expect(res.body.order.customerId).toBeNull();
    expect(res.body.order.trackingToken).toMatch(/^[0-9a-f]{16}$/);
    expect(res.body.order.code).toMatch(/^ORD-\d{5}$/);
  });

  it("guest cannot create PICKUP/TAKEAWAY (cashier domain)", async () => {
    const res = await post("/api/public/orders").send({
      type: "PICKUP",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it("guest DINE_IN without table → 400", async () => {
    const res = await post("/api/public/orders").send({
      type: "DINE_IN",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it("guest tracks order by token (no auth); unknown token → 404", async () => {
    const { trackingToken } = (await guestOrder()).body.order;

    const res = await get(`/api/public/orders/${trackingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("PENDING");
    expect(res.body.order.paymentStatus).toBe("UNPAID");
    expect(res.body.order.items[0].menuItem.name).toBe(items[0].name);

    const bad = await get("/api/public/orders/deadbeefdeadbeef");
    expect(bad.status).toBe(404);
  });

  it("guest pays by token (prepaid); double pay → 409", async () => {
    const { trackingToken } = (await guestOrder()).body.order;

    const res = await post(`/api/public/orders/${trackingToken}/pay`).send({ method: "CARD_AT_COUNTER" });
    expect(res.body.payment.status).toBe("SUCCESS");
    expect(res.body.order.paymentStatus).toBe("PAID");
    expect(res.body.order.status).toBe("PENDING");

    const again = await post(`/api/public/orders/${trackingToken}/pay`).send({});
    expect(again.status).toBe(409);
  });

  it("paid guest order enters the kitchen normally", async () => {
    const order = (await guestOrder()).body.order;
    await post(`/api/public/orders/${order.trackingToken}/pay`).send({});

    const res = await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("PREPARING");
  });

  it("guest order still occupies the table (auto table status)", async () => {
    await guestOrder();
    const tables = (await get("/api/bo/tables").set(bearer(u.waiter.id, "WAITER"))).body.tables;
    expect(tables.find((t: { id: number }) => t.id === tableId).status).toBe("OCCUPIED");
  });

  it("member orders also carry a trackingToken (harmless, usable for web tracking)", async () => {
    const order = (await post("/api/me/orders").set(bearer(u.customer.id, "CUSTOMER")).send({
      type: "TAKEAWAY",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    })).body.order;
    expect(order.trackingToken).toMatch(/^[0-9a-f]{16}$/);
  });

  it("guest tokens are unique across orders", async () => {
    const [a, b] = await Promise.all([guestOrder(), guestOrder()]);
    expect(a.body.order.trackingToken).not.toBe(b.body.order.trackingToken);
  });
});

void prisma;