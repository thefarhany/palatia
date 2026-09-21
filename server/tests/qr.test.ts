import { beforeAll, describe, expect, it } from "vitest";
import { bearer, get, post, resetDb, seedUsers, prisma } from "./helpers.js";

let u: Awaited<ReturnType<typeof seedUsers>>;
let tableId: number;

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
  // via API so the service layer assigns the QR token
  tableId = (await post("/api/bo/tables").set(bearer(u.admin.id, "ADMIN")).send({ number: 7, capacity: 4 }))
    .body.table.id;
});

describe("QR token lifecycle", () => {
  it("new tables get a QR token automatically", async () => {
    const row = await prisma.restaurantTable.findUniqueOrThrow({ where: { id: tableId } });
    expect(row.qrToken).toMatch(/^[0-9a-f]{16}$/);
  });

  it("public endpoint resolves a scanned token (no auth)", async () => {
    const row = await prisma.restaurantTable.findUniqueOrThrow({ where: { id: tableId } });
    const res = await get(`/api/public/table/${row.qrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.table).toMatchObject({ tableId, number: 7, capacity: 4 });
  });

  it("unknown token → 404", async () => {
    const res = await get("/api/public/table/deadbeefdeadbeef");
    expect(res.status).toBe(404);
  });

  it("regenerate issues a new token; old printed QR stops resolving", async () => {
    const old = await prisma.restaurantTable.findUniqueOrThrow({ where: { id: tableId } });

    const regen = await post(`/api/bo/tables/${tableId}/qr`).set(bearer(u.admin.id, "ADMIN"));
    expect(regen.status).toBe(200);
    expect(regen.body.qr.url).toContain(`t=${regen.body.qr.token}`);
    expect(regen.body.qr.token).not.toBe(old.qrToken);

    const afterOld = await get(`/api/public/table/${old.qrToken!}`);
    expect(afterOld.status).toBe(404);

    const afterNew = await get(`/api/public/table/${regen.body.qr.token}`);
    expect(afterNew.status).toBe(200);
  });

  it("qr.png returns a printable PNG for admin (customer 403)", async () => {
    const asCustomer = await get(`/api/bo/tables/${tableId}/qr.png`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(asCustomer.status).toBe(403);

    const png = await get(`/api/bo/tables/${tableId}/qr.png`).set(bearer(u.admin.id, "ADMIN"));
    expect(png.status).toBe(200);
    expect(png.headers["content-type"]).toBe("image/png");
    // PNG magic bytes
    expect(png.body.slice(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it("customer cannot rotate a QR", async () => {
    const res = await post(`/api/bo/tables/${tableId}/qr`).set(bearer(u.customer.id, "CUSTOMER"));
    expect(res.status).toBe(403);
  });
});