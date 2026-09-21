import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma as db } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/auth.js";
import type { Role } from "@prisma/client";

export const prisma = db;
export const app = createApp();

const TABLES = [
  "audit_logs",
  "notifications",
  "purchase_items",
  "purchase_orders",
  "recipe_items",
  "order_items",
  "orders",
  "reservations",
  "tables",
  "menu_items",
  "ingredients",
  "users",
];

// Wipe every table (FK order handled by disabling checks) — each file starts clean.
export async function resetDb() {
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=0");
  for (const t of TABLES) await prisma.$executeRawUnsafe(`DELETE FROM ${t}`);
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=1");
}

export function bearer(userId: number, role: Role) {
  return { Authorization: `Bearer ${signToken({ userId, role })}` };
}

// Creates one user per role with a known password hash. Returns id+role map.
export async function seedUsers() {
  const data: { email: string; role: Role; name: string }[] = [
    { email: "admin@test.id", role: "ADMIN", name: "Admin" },
    { email: "chef@test.id", role: "CHEF", name: "Chef" },
    { email: "waiter@test.id", role: "WAITER", name: "Waiter" },
    { email: "customer@test.id", role: "CUSTOMER", name: "Customer" },
    { email: "customer2@test.id", role: "CUSTOMER", name: "Customer2" },
  ];
  const created = await prisma.user.createMany({
    data: data.map((u) => ({ ...u, passwordHash: "x" })),
  });
  void created;
  const users = await prisma.user.findMany({ select: { id: true, role: true, email: true } });
  // Two CUSTOMERs exist — resolve by email, not by role, or both resolve to the same row.
  const byEmail = (email: string) => users.find((u) => u.email === email)!;
  return {
    admin: byEmail("admin@test.id"),
    chef: byEmail("chef@test.id"),
    waiter: byEmail("waiter@test.id"),
    customer: byEmail("customer@test.id"),
    customer2: byEmail("customer2@test.id"),
  };
}

export async function seedMenu(count = 3) {
  const items = Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    category: i % 2 === 0 ? "Food" : "Drink",
    price: 10000 + i * 5000,
    available: true,
  }));
  await prisma.menuItem.createMany({ data: items });
  return prisma.menuItem.findMany({ orderBy: { id: "asc" } });
}

export const get = (path: string) => request(app).get(path);
export const post = (path: string) => request(app).post(path);
export const patch = (path: string) => request(app).patch(path);
export const put = (path: string) => request(app).put(path);
export const del = (path: string) => request(app).delete(path);