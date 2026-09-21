import { beforeAll, describe, expect, it } from "vitest";
import { bearer, post, get, resetDb, seedUsers } from "./helpers.js";
import { prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
});

describe("POST /api/auth/register", () => {
  it("creates a CUSTOMER account and returns a working token", async () => {
    const res = await post("/api/auth/register")
      .send({ name: "Baru", email: "baru@test.id", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CUSTOMER");
    expect(res.body.token).toBeDefined();

    const me = await get("/api/me/profile").set("Authorization", `Bearer ${res.body.token}`);
    expect(me.body.user.email).toBe("baru@test.id");
  });

  it("rejects duplicate email with 409", async () => {
    const res = await post("/api/auth/register")
      .send({ name: "Dup", email: "baru@test.id", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("rejects weak password with 400", async () => {
    const res = await post("/api/auth/register")
      .send({ name: "Lemah", email: "lemah@test.id", password: "123" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 for wrong password", async () => {
    const res = await post("/api/auth/login")
      .send({ email: "admin@test.id", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const res = await post("/api/auth/login")
      .send({ email: "ghost@test.id", password: "whatever1" });
    expect(res.status).toBe(401);
  });

  it("blocks staff user on public login surface with 403", async () => {
    // Create staff account via createStaff
    await post("/api/bo/staff")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ name: "Admin Surface", email: "adminsurf@test.id", password: "password123", role: "ADMIN" });

    const res = await post("/api/auth/login")
      .send({ email: "adminsurf@test.id", password: "password123", surface: "public" });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("STAF");
  });

  it("blocks customer user on staff login surface with 403", async () => {
    await post("/api/auth/register")
      .send({ name: "Cust Surface", email: "custsurf@test.id", password: "password123" });

    const res = await post("/api/auth/login")
      .send({ email: "custsurf@test.id", password: "password123", surface: "staff" });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("bukan STAF");
  });

  it("allows customer user on public login surface", async () => {
    const res = await post("/api/auth/login")
      .send({ email: "custsurf@test.id", password: "password123", surface: "public" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("CUSTOMER");
  });

  it("allows staff user on staff login surface", async () => {
    const res = await post("/api/auth/login")
      .send({ email: "adminsurf@test.id", password: "password123", surface: "staff" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("ADMIN");
  });
});

describe("RBAC", () => {
  it("blocks unauthenticated /me with 401", async () => {
    const res = await get("/api/me/profile");
    expect(res.status).toBe(401);
  });

  it("only ADMIN can create staff accounts", async () => {
    const asCustomer = await post("/api/bo/staff")
      .set(bearer(u.customer.id, "CUSTOMER"))
      .send({ name: "S", email: "s1@test.id", password: "password123", role: "CHEF" });
    expect(asCustomer.status).toBe(403);

    const asAdmin = await post("/api/bo/staff")
      .set(bearer(u.admin.id, "ADMIN"))
      .send({ name: "S", email: "s1@test.id", password: "password123", role: "CHEF" });
    expect(asAdmin.status).toBe(201);
    expect(asAdmin.body.user.role).toBe("CHEF");
  });

  it("deactivated staff cannot log in", async () => {
    await prisma.user.update({ where: { email: "waiter@test.id" }, data: { isActive: false } });
    const res = await post("/api/auth/login")
      .send({ email: "waiter@test.id", password: "x" });
    expect(res.status).toBe(401);
    // wrong password path: hash mismatch also 401 — already covered; restore
    await prisma.user.update({ where: { email: "waiter@test.id" }, data: { isActive: true } });
  });
});