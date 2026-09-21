import type { Server as SocketServer } from "socket.io";

// Socket.IO lives in server.ts but route modules need to emit. A mutable
// reference avoids a circular import (routes ← app ← server ← socket).
let io: SocketServer | null = null;

export function setIo(instance: SocketServer) {
  io = instance;
}

export function emitEvent(room: string, event: string, payload: unknown) {
  io?.to(room).emit(event, payload);
}

export function emitToRoles(roles: string[], event: string, payload: unknown) {
  for (const role of roles) emitEvent(`role:${role}`, event, payload);
}