import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, put, resetDb, seedUsers, seedMenu, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2);
});

async function makeRice(stock: number, reorder = 5) {
  return prisma.ingredient.create({
    data: { name: `Rice-${Math.random().toString(36).slice(2, 8)}`, unit: "kg", stock, reorderLevel: reorder },
  });
}

async function completeOrder(as: { id: number; role: "CUSTOMER" }, menuItemId: number, qty: number) {
  const order = (await post("/api/me/orders").set(bearer(as.id, as.role)).send({
    type: "TAKEAWAY",
    items: [{ menuItemId, qty }],
  })).body.order;
  // prepaid model: pay first, then kitchen, then handed over = COMPLETED
  await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
  await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
  await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "READY" });
  await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
  return order;
}

describe("ingredients CRUD (ADMIN)", () => {
  it("customer gets 403", async () => {
    const res = await get("/api/bo/inventory/ingredients").set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.status).toBe(403);
  });

  it("admin creates and updates an ingredient", async () => {
    const created = await post("/api/bo/inventory/ingredients")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ name: "Chicken", unit: "kg", stock: 20, reorderLevel: 5, supplierName: "Fresh Farm" });
    expect(created.status).toBe(201);

    const updated = await patch(`/api/bo/inventory/ingredients/${created.body.ingredient.id}`)
      .set(bearer(u.admin.id, "ADMIN")).send({ stock: 25 });
    expect(Number(updated.body.ingredient.stock)).toBe(25);
  });

  it("rejects negative stock with 400", async () => {
    const res = await post("/api/bo/inventory/ingredients")
      .set(bearer(u.admin.id, "ADMIN")).send({ name: "Bad", unit: "kg", stock: -1 });
    expect(res.status).toBe(400);
  });
});

describe("recipe mapping + auto-deduct (UC-22)", () => {
  it("PUT recipe replaces mapping; completed order deducts stock", async () => {
    const rice = await makeRice(50);
    const recipe = await put(`/api/bo/inventory/recipes/${items[0].id}`)
      .set(bearer(u.admin.id, "ADMIN")).send({ items: [{ ingredientId: rice.id, qty: 0.3 }] });
    expect(recipe.status).toBe(200);
    expect(recipe.body.recipe).toHaveLength(1);

    // order 2× item[0] → deduct 2 × 0.3 = 0.6
    await completeOrder(u.customer, items[0].id, 2);
    const after = await prisma.ingredient.findUniqueOrThrow({ where: { id: rice.id } });
    expect(Number(after.stock)).toBeCloseTo(49.4, 5);

    // replacing the recipe removes the old row
    await put(`/api/bo/inventory/recipes/${items[0].id}`)
      .set(bearer(u.admin.id, "ADMIN")).send({ items: [] });
    expect(await prisma.recipeItem.count({ where: { menuItemId: items[0].id } })).toBe(0);
  });

  it("completed order without recipe deducts nothing", async () => {
    const before = await prisma.ingredient.findMany();
    const stocks = before.map((i) => Number(i.stock));
    await completeOrder(u.customer, items[1].id, 3); // no recipe on items[1]
    const after = await prisma.ingredient.findMany();
    expect(after.map((i) => Number(i.stock))).toEqual(stocks);
  });

  it("low stock triggers notification for ADMIN (UC-23)", async () => {
    const rice = await makeRice(0.5, 1); // stock below reorder level
    await put(`/api/bo/inventory/recipes/${items[0].id}`)
      .set(bearer(u.admin.id, "ADMIN")).send({ items: [{ ingredientId: rice.id, qty: 0.3 }] });

    await completeOrder(u.customer, items[0].id, 1); // deduct 0.3 → stock 0.2 ≤ 1

    const notif = await prisma.notification.findFirst({
      where: { type: "inventory:low", userId: u.admin.id },
    });
    expect(notif).not.toBeNull();
    expect((notif!.payload as { name: string }).name).toBe(rice.name);
    expect(Number((notif!.payload as { stock: number }).stock)).toBeCloseTo(0.2, 5);
  });
});

describe("purchase orders (UC-24)", () => {
  it("create → ORDERED; receive raises stock; double receive → 409", async () => {
    const rice = await makeRice(10);
    const po = (await post("/api/bo/inventory/purchase-orders")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ supplierName: "Toko Basmati", items: [{ ingredientId: rice.id, qty: 100, unitCost: 15000 }] })
    ).body.order;
    expect(po.status).toBe("ORDERED");
    expect(po.code).toMatch(/^PO-/);

    const receive = await patch(`/api/bo/inventory/purchase-orders/${po.id}/receive`).set(bearer(u.admin.id, "ADMIN"));
    expect(receive.body.order.status).toBe("RECEIVED");
    const after = await prisma.ingredient.findUniqueOrThrow({ where: { id: rice.id } });
    expect(Number(after.stock)).toBe(110);

    const again = await patch(`/api/bo/inventory/purchase-orders/${po.id}/receive`).set(bearer(u.admin.id, "ADMIN"));
    expect(again.status).toBe(409);
  });

  it("cancel only before receive", async () => {
    const po = (await post("/api/bo/inventory/purchase-orders")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({
        supplierName: "X",
        items: [{ ingredientId: (await makeRice(1)).id, qty: 10, unitCost: 1000 }],
      })).body.order;
    const res = await patch(`/api/bo/inventory/purchase-orders/${po.id}/cancel`).set(bearer(u.admin.id, "ADMIN"));
    expect(res.body.order.status).toBe("CANCELLED");

    const received = await patch(`/api/bo/inventory/purchase-orders/${po.id}/receive`).set(bearer(u.admin.id, "ADMIN"));
    expect(received.status).toBe(409);
  });

  it("customer gets 403", async () => {
    const res = await get("/api/bo/inventory/purchase-orders").set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.status).toBe(403);
  });

  it("unknown ingredient in items → 400", async () => {
    const res = await post("/api/bo/inventory/purchase-orders")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ supplierName: "X", items: [{ ingredientId: 99999, qty: 1, unitCost: 1 }] });
    expect(res.status).toBe(400);
  });
});