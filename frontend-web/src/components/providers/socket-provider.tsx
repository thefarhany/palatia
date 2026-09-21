"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import type { SocketCtx, SocketHandler as Handler } from "@/lib/types";

const Ctx = createContext<SocketCtx>({ on: () => () => {} });

export const useSocket = () => useContext(Ctx);

export function useSocketEvent(event: string, handler: Handler) {
  const { on } = useSocket();
  useEffect(() => on(event, handler), [event, on, handler]);
}

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      // If running on palatia.thefarhany.xyz, backend socket server is on api-palatia.thefarhany.xyz
      if (host.startsWith("palatia.")) {
        return window.location.origin.replace("://palatia.", "://api-palatia.");
      }
      return window.location.origin;
    }
  }
  return "http://localhost:4000";
}

/**
 * Socket connects on mount; events fan out through a local emitter so
 * subscribers never depend on connection timing (and no setState-in-effect).
 */
export function SocketProvider({ token, children }: { token: string; children: ReactNode }) {
  const handlers = useRef(new Map<string, Set<Handler>>());

  const on = useCallback((event: string, handler: Handler) => {
    let set = handlers.current.get(event);
    if (!set) {
      set = new Set();
      handlers.current.set(event, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }, []);

  useEffect(() => {
    const targetUrl = getSocketUrl();
    const socket: Socket = io(targetUrl, {
      auth: { token },
      reconnectionDelay: 2000,
    });
    const forward = (event: string, ...args: unknown[]) => {
      handlers.current.get(event)?.forEach((h) => h(...args));
    };
    socket.onAny(forward);
    return () => {
      socket.offAny(forward);
      socket.disconnect();
    };
  }, [token]);

  return <Ctx.Provider value={{ on }}>{children}</Ctx.Provider>;
}