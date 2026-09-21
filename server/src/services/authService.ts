import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/auth.js";
import { HttpError } from "../lib/httpError.js";

export const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
} as const;

export async function register(name: string, email: string, password: string) {
  // Public registration always creates CUSTOMER — staff accounts come from createStaff.
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 10), role: "CUSTOMER" },
    select: publicUser,
  });
  return { token: signToken({ userId: user.id, role: user.role }), user };
}

export async function login(email: string, password: string, surface?: "public" | "staff") {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  // Surface role guard: staff cannot login on public customer login, customers cannot login on staff login.
  if (surface === "public" && user.role !== "CUSTOMER") {
    throw new HttpError(
      403,
      `Anda terdeteksi sebagai akun STAF (${user.role}). Silakan login melalui Portal Staff.`
    );
  }
  if (surface === "staff" && user.role === "CUSTOMER") {
    throw new HttpError(
      403,
      "Anda bukan STAF. Silakan login melalui Portal Pelanggan."
    );
  }

  // Same public shape as register/me — passwordHash never leaves the service.
  return {
    token: signToken({ userId: user.id, role: user.role }),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
  };
}

export async function me(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user || !user.isActive) throw new HttpError(401, "Unauthorized");
  return user;
}

// Customer edit nama sendiri (UC account) — email & password immutable.
export async function updateProfile(userId: number, name: string) {
  return prisma.user.update({ where: { id: userId }, data: { name }, select: publicUser });
}

// Staff account management (UC-25).
export async function createStaff(name: string, email: string, password: string, role: Role) {
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 10), role },
    select: publicUser,
  });
  return user;
}

// Staff list = non-customer accounts (customers are not managed here).
export async function listStaff() {
  return prisma.user.findMany({
    where: { role: { not: "CUSTOMER" } },
    select: publicUser,
    orderBy: { name: "asc" },
  });
}

// Assign role / activate-deactivate. Email & password are immutable here —
// password reset is out of scope for v1 (docs: deactivate only).
export async function updateStaff(
  id: number,
  data: { role?: Role; isActive?: boolean; name?: string },
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "CUSTOMER") throw new HttpError(404, "Staff not found");
  if (user.role === "ADMIN" && (data.isActive === false || (data.role && data.role !== "ADMIN"))) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: id } },
    });
    if (activeAdmins === 0) throw new HttpError(409, "Minimal harus ada satu admin aktif");
  }
  return prisma.user.update({
    where: { id },
    data,
    select: publicUser,
  });
}