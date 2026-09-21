import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "http";
import { io as SocketClient } from "socket.io-client";
import { bearer, app, get, post, patch, resetDb, seedUsers, seedMenu } from "./helpers.js";
import { setupSocket } from "../src/socket/index.js";
import { setIo } from "../src/lib/realtime.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let items: Awaited<ReturnType<typeof seedMenu>>;

// Real HTTP server on an ephemeral port so Socket.IO clients can connect.
const httpServer = http.createServer(app);
const io = setupSocket(httpServer, "*");

function clientFor(userId: number, role: "ADMIN" | "CHEF" | "WAITER" | "CUSTOMER") {
  return new SocketClient(`http://localhost:${(httpServer.address() as { port: number }).port}`, {
    auth: { token: bearer(userId, role).Authorization.slice(7) },
  });
}

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  items = await seedMenu(2);
  setIo(io);
  await new Promise<void>((res) => httpServer.listen(0, res));
});

afterAll(async () => {
  io.close();
  httpServer.close();
});

function connect(c: SocketClient) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("socket connect timeout")), 5000);
    c.on("connect", () => { clearTimeout(t); resolve(c); });
    c.on("connect_error", (e: Error) => { clearTimeout(t); reject(e); });
  });
}

describe("Socket.IO auth", () => {
  it("rejects missing token", async () => {
    const c = new SocketClient(`http://localhost:${(httpServer.address() as { port: number }).port}`);
    await expect(connect(c)).rejects.toThrow();
    c.close();
  });

  it("accepts a valid JWT", async () => {
    const c = clientFor(u.chef.id, "CHEF");
    await connect(c);
    expect(c.connected).toBe(true);
    c.close();
  });
});

describe("realtime events", () => {
  it("chef receives order:created live", async () => {
    const chef = await connect(clientFor(u.chef.id, "CHEF"));
    const received = new Promise((resolve) => chef.once("order:created", resolve));

    const res = await post("/api/me/orders").set(bearer(u.customer.id, "CUSTOMER")).send({
      type: "TAKEAWAY",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    });
    expect(res.status).toBe(201);
    await post(`/api/me/orders/${res.body.order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});

    const payload = await received as { code: string; status: string };
    expect(payload.code).toMatch(/^ORD-\d{5}$/);
    expect(payload.status).toBe("PENDING");
    chef.close();
  });

  it("customer subscribed to an order receives order:status updates", async () => {
    const order = (await post("/api/me/orders").set(bearer(u.customer.id, "CUSTOMER")).send({
      type: "TAKEAWAY",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    })).body.order;

    const customer = await connect(clientFor(u.customer.id, "CUSTOMER"));
    const subscribed = new Promise((resolve) => customer.emit("order:subscribe", order.id, resolve));
    expect(await subscribed).toEqual({ ok: true });

    const update = new Promise((resolve) => customer.once("order:status", resolve));
    await post(`/api/me/orders/${order.id}/pay`).set(bearer(u.customer.id, "CUSTOMER")).send({});
    await patch(`/api/bo/orders/${order.id}/status`)
      .set(bearer(u.chef.id, "CHEF")).send({ status: "PREPARING" });

    expect(await update).toMatchObject({ orderId: order.id, status: "PREPARING" });
    customer.close();
  });

  it("customer cannot subscribe to someone else's order", async () => {
    const order = (await post("/api/me/orders").set(bearer(u.customer.id, "CUSTOMER")).send({
      type: "TAKEAWAY",
      items: [{ menuItemId: items[0].id, qty: 1 }],
    })).body.order;

    const stranger = await connect(clientFor(u.customer2.id, "CUSTOMER"));
    const result = await new Promise((resolve) => stranger.emit("order:subscribe", order.id, resolve));
    expect(result).toEqual({ ok: false });
    stranger.close();
  });
});

// keeps helper import used
void get;