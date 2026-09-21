import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, patch, resetDb, seedUsers, seedMenu, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2);
});

async function makeOrder(as: { id: number; role: "CUSTOMER" }) {
  return (await post("/api/me/orders").set(bearer(as.id, as.role)).send({
    type: "TAKEAWAY",
    items: [{ menuItemId: items[0].id, qty: 1 }],
  })).body.order;
}

describe("notification triggers", () => {
  it("order created → chef gets order:new", async () => {
    const order = await makeOrder(u.customer);
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    const notif = await prisma.notification.findFirst({
      where: { userId: u.chef.id, type: "order:new" },
      orderBy: { id: "desc" },
    });
    expect((notif!.payload as { code: string }).code).toBe(order.code);
  });

  it("status change → customer gets order:status", async () => {
    const order = await makeOrder(u.customer);
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    await patch(`/api/bo/orders/${order.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    const notif = await prisma.notification.findFirst({
      where: { userId: u.customer.id, type: "order:status" },
      orderBy: { id: "desc" },
    });
    expect((notif!.payload as { status: string }).status).toBe("PREPARING");
  });

  it("payment recorded → customer notified + audit row for the staff actor", async () => {
    const order = await makeOrder(u.customer);
    await post(`/api/bo/orders/${order.id}/pay`).set(bearer(u.waiter.id, "WAITER")).send({ method: "CASH" });

    const notif = await prisma.notification.findFirst({
      where: { userId: u.customer.id, type: "payment:recorded" },
      orderBy: { id: "desc" },
    });
    expect((notif!.payload as { method: string }).method).toBe("CASH");

    const audit = await prisma.auditLog.findFirst({
      where: { actorId: u.waiter.id, action: "payment.recorded", entityId: order.id },
    });
    expect(audit).not.toBeNull();
  });

  it("reservation created → waiter notified; confirmed → customer notified", async () => {
    const table = await prisma.restaurantTable.create({ data: { number: 42, capacity: 4 } });
    const r = (await post("/api/me/reservations").set(bearer(u.customer.id, "CUSTOMER")).send({
      tableId: table.id,
      date: "2031-01-01",
      slot: "19:00",
      guests: 2,
    })).body.reservation;

    const waiterNotif = await prisma.notification.findFirst({
      where: { userId: u.waiter.id, type: "reservation:new" },
      orderBy: { id: "desc" },
    });
    expect((waiterNotif!.payload as { reservationId: number }).reservationId).toBe(r.id);

    await patch(`/api/bo/reservations/${r.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "CONFIRMED" });
    const customerNotif = await prisma.notification.findFirst({
      where: { userId: u.customer.id, type: "reservation:status" },
      orderBy: { id: "desc" },
    });
    expect((customerNotif!.payload as { status: string }).status).toBe("CONFIRMED");
  });
});

describe("GET /api/notifications", () => {
  it("lists only own notifications", async () => {
    const mine = await get("/api/me/notifications").set(bearer(u.customer.id, "CUSTOMER"));
    expect(mine.status).toBe(200);
    expect(mine.body.notifications.every((n: { userId: number }) => n.userId === u.customer.id)).toBe(true);
  });

  it("unread=true filters unread only", async () => {
    const unread = await get("/api/me/notifications?unread=true").set(bearer(u.customer.id, "CUSTOMER"));
    expect(unread.body.notifications.every((n: { read: boolean }) => !n.read)).toBe(true);
  });

  it("mark read works; stranger's notification → 404", async () => {
    const mine = (await get("/api/me/notifications?unread=true").set(bearer(u.customer.id, "CUSTOMER"))).body.notifications;
    const target = mine[0];
    const marked = await patch(`/api/me/notifications/${target.id}/read`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(marked.body.notification.read).toBe(true);

    const stranger = await patch(`/api/me/notifications/${target.id}/read`).set(bearer(u.customer2.id, "CUSTOMER"));
    expect(stranger.status).toBe(404);
  });

  it("read-all marks everything read", async () => {
    const res = await patch("/api/me/notifications/read-all").set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.body.updated).toBeGreaterThanOrEqual(0);
    const left = await get("/api/me/notifications?unread=true").set(bearer(u.customer.id, "CUSTOMER"));
    expect(left.body.notifications).toHaveLength(0);
  });
});

describe("reports (ADMIN)", () => {
  async function complete(as: { id: number; role: "CUSTOMER" }) {
    const o = await makeOrder(as);
    await post(`/api/bo/orders/${o.id}/pay`).set(bearer(u.waiter.id, "WAITER")).send({});
    await patch(`/api/bo/orders/${o.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });
    await patch(`/api/bo/orders/${o.id}/status`).set(bearer(u.chef.id, "CHEF")).send({ status: "READY" });
    await patch(`/api/bo/orders/${o.id}/status`).set(bearer(u.waiter.id, "WAITER")).send({ status: "COMPLETED" });
    return o;
  }

  it("daily sales counts paid completed orders", async () => {
    await complete(u.customer);
    await complete(u.customer);

    const report = (await get("/api/bo/reports/sales/daily").set(bearer(u.admin.id, "ADMIN"))).body.report;
    // both orders completed today via pay; earlier paid orders also count
    expect(report.orderCount).toBeGreaterThanOrEqual(2);
    expect(report.revenue).toBeGreaterThan(0);
    expect(report.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("popular dishes rank by completed qty", async () => {
    await complete(u.customer);
    const report = (await get("/api/bo/reports/sales/popular").set(bearer(u.admin.id, "ADMIN"))).body.report;
    expect(report.length).toBeGreaterThanOrEqual(1);
    expect(report[0]).toHaveProperty("name");
    expect(report[0].totalQty).toBeGreaterThanOrEqual(1);
  });

  it("customer gets 403", async () => {
    expect((await get("/api/bo/reports/sales/daily").set(bearer(u.customer.id, "CUSTOMER"))).status).toBe(403);
  });
});

describe("audit log (ADMIN)", () => {
  it("menu change is audited", async () => {
    const created = (await post("/api/bo/menu").set(bearer(u.admin.id, "ADMIN")).send({
      name: "AuditDish", category: "Food", price: 1000,
    })).body.item;
    await patch(`/api/bo/menu/${created.id}`).set(bearer(u.admin.id, "ADMIN")).send({ available: false });

    const logs = (await get("/api/bo/audit").set(bearer(u.admin.id, "ADMIN"))).body.logs;
    expect(logs.some((l: { action: string; actorId: number }) => l.action === "menu.created" && l.actorId === u.admin.id)).toBe(true);
    expect(logs.some((l: { action: string }) => l.action === "menu.updated")).toBe(true);
  });

  it("customer gets 403", async () => {
    expect((await get("/api/bo/audit").set(bearer(u.customer.id, "CUSTOMER"))).status).toBe(403);
  });
});