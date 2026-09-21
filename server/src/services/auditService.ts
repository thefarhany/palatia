import { prisma } from "../lib/prisma.js";

// Sensitive-action trail (UC-27). Never fails the request it accompanies.
export function logAudit(actorId: number, action: string, entity: string, entityId?: number, meta?: object) {
  return prisma.auditLog
    .create({ data: { actorId, action, entity, entityId, meta } })
    .catch(() => {}); // ponytail: swallow — an audit failure shouldn't roll back the action it records
}

export function listAudit() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, role: true } } },
  });
}