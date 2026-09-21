import { prisma } from "../lib/prisma.js";
import { emitEvent } from "../lib/realtime.js";

// In-app notification: one row per user of the target role (or explicit users),
// plus a live push to their socket room. UI surface comes with the clients.
export async function notifyUsers(userIds: number[], type: string, payload: object) {
  if (!userIds.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, payload })),
  });
  for (const userId of userIds) {
    emitEvent(`user:${userId}`, "notification", { type, payload });
  }
}

export async function notifyRole(role: "ADMIN" | "CHEF" | "WAITER" | "CUSTOMER", type: string, payload: object) {
  const users = await prisma.user.findMany({ where: { role, isActive: true }, select: { id: true } });
  await notifyUsers(users.map((u) => u.id), type, payload);
}

export function notifyUser(userId: number, type: string, payload: object) {
  return notifyUsers([userId], type, payload);
}