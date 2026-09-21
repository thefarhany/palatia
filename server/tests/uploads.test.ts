import { beforeAll, afterAll, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { bearer, prisma, get, post, resetDb, seedUsers } from "./helpers.js";
import { UPLOAD_ROOT } from "../src/lib/uploads.js";

let u: Awaited<ReturnType<typeof seedUsers>>;

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000148afa4710000000049454e44ae426082",
  "hex"
);

beforeAll(async () => {
  await resetDb();
  u = await seedUsers();
});

afterAll(() => {
  // clean test artifacts from disk
  for (const sub of ["menu", "profile"]) {
    fs.rmSync(path.join(UPLOAD_ROOT, sub), { recursive: true, force: true });
  }
});

function upload(pathname: string, as: { id: number; role: Parameters<typeof bearer>[1] }) {
  return post(pathname)
    .set(bearer(as.id, as.role))
    .attach("file", PNG, { filename: "test.png", contentType: "image/png" });
}

describe("POST /api/bo/uploads/menu (ADMIN)", () => {
  it("stores the file under uploads/menu and returns a working url", async () => {
    const res = await upload("/api/bo/uploads/menu", u.admin);
    expect(res.status).toBe(201);
    const url = res.body.url as string;
    expect(url).toMatch(/^\/uploads\/menu\/[\w-]+\.png$/);

    // file actually on disk
    expect(fs.existsSync(path.join(UPLOAD_ROOT, "menu", path.basename(url)))).toBe(true);

    // reachable through the API
    const served = await get(url);
    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toContain("image/png");
  });

  it("rejects non-image with 400", async () => {
    const res = await post("/api/bo/uploads/menu")
      .set(bearer(u.admin.id, "ADMIN"))
      .attach("file", Buffer.from("bukan gambar"), { filename: "x.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jpg|png|webp/i);
  });

  it("forbids customer (403)", async () => {
    const res = await upload("/api/bo/uploads/menu", u.customer);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/me/uploads/avatar", () => {
  it("any user can set own avatar; saved to users.avatar", async () => {
    const res = await upload("/api/me/uploads/avatar", u.customer);
    expect(res.status).toBe(201);
    expect(res.body.url).toContain("/uploads/profile/");

    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.customer.id } });
    expect(row.avatar).toBe(res.body.url);
  });
});