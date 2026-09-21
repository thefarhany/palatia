import { create } from "zustand";
import { notificationsService } from "@/services/notifications-service";
import type { Notification } from "@/lib/types";

interface NotifsState {
  items: Notification[];
  fetch: () => Promise<void>;
  markAll: () => Promise<void>;
  markOne: (id: number) => Promise<void>;
}

/** Notifikasi user yang sedang login (room socket user:{id}). */
export const useNotifsStore = create<NotifsState>()((set) => ({
  items: [],
  fetch: async () => {
    const items = await notificationsService.list().catch(() => null);
    if (items) set({ items });
  },
  markAll: async () => {
    await notificationsService.markAll();
  },
  markOne: async (id) => {
    await notificationsService.markOne(id);
  },
}));
