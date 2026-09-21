import { Server as SocketServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "../lib/auth.js";
import type { JwtPayload } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

// Rooms: user:{id} (personal notifications), role:{ROLE} (kitchen/admin/waiter feeds),
// order:{id} (customer tracking — used once order routes exist).
// Auth at handshake: no valid JWT, no socket.
export function setupSocket(httpServer: HttpServer, corsOrigin: string) {
  const io = new SocketServer(httpServer, {
    cors: { origin: corsOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyToken(token) : null;
    if (!payload) return next(new Error("Unauthorized"));
    (socket.data as { user: JwtPayload }).user = payload;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const { userId, role } = (socket.data as { user: JwtPayload }).user;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    // Client asks to follow one order's status events (customer tracking / staff view).
    // Access is verified server-side against the DB.
    socket.on("order:subscribe", async (orderId: number, ack?: (r: { ok: boolean }) => void) => {
      const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
      const allowed =
        role !== "CUSTOMER" || (order?.customerId === userId && role === "CUSTOMER");
      if (order && allowed) {
        socket.join(`order:${order.id}`);
        ack?.({ ok: true });
      } else {
        ack?.({ ok: false });
      }
    });
  });

  return io;
}