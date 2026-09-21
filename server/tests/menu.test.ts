import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, del, resetDb, seedUsers, seedMenu } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  await seedMenu(4); // 2 Food, 2 Drink
});

describe("GET /api/menu (public)", () => {
  it("lists available items without auth", async () => {
    const res = await get("/api/public/menu");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(4);
  });

  it("filters by q and category", async () => {
    const byQ = await get("/api/public/menu?q=Item 1");
    expect(byQ.body.items).toHaveLength(1);

    const byCat = await get("/api/public/menu?category=Drink");
    expect(byQ.status).toBe(200);
    expect(byCat.body.items).toHaveLength(2);
    expect(byCat.body.items.every((i: { category: string }) => i.category === "Drink")).toBe(true);
  });

  it("hides unavailable items", async () => {
    const first = (await get("/api/public/menu")).body.items[0];
    await patch(`/api/bo/menu/${first.id}`).set(bearer(u.admin.id, "ADMIN")).send({ available: false });

    const res = await get("/api/public/menu");
    expect(res.body.items.every((i: { id: number }) => i.id !== first.id)).toBe(true);

    // admin view (available=false param) still sees it
    const adminView = await get("/api/public/menu?available=false").set(bearer(u.admin.id, "ADMIN"));
    expect(adminView.body.items.some((i: { id: number }) => i.id === first.id)).toBe(true);
  });
});

describe("menu CRUD (ADMIN only)", () => {
  it("customer gets 403 on create", async () => {
    const res = await post("/api/bo/menu")
      .set(bearer(u.customer.id, "CUSTOMER"))
      .send({ name: "X", category: "Y", price: 1 });
    expect(res.status).toBe(403);
  });

  it("rejects invalid price with 400", async () => {
    const res = await post("/api/bo/menu")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ name: "Negatif", category: "Food", price: -5 });
    expect(res.status).toBe(400);
  });

  it("admin creates, updates, deletes", async () => {
    const created = await post("/api/bo/menu")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ name: "Rendang", category: "Food", price: 50000, imageUrl: "https://x.test/a.png" });
    expect(created.status).toBe(201);

    const updated = await patch(`/api/bo/menu/${created.body.item.id}`)
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ price: 55000 });
    expect(Number(updated.body.item.price)).toBe(55000);

    const removed = await del(`/api/bo/menu/${created.body.item.id}`).set(bearer(u.admin.id, "ADMIN"));
    expect(removed.status).toBe(204);

    const after = await get("/api/public/menu?q=Rendang");
    expect(after.body.items).toHaveLength(0);
  });
});