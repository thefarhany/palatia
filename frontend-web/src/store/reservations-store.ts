import { create } from "zustand";
import { reservationsService } from "@/services/reservations-service";
import type { Reservation } from "@/lib/types";

interface ReservationsState {
  reservations: Reservation[];
  loaded: boolean;
  fetch: () => Promise<void>;
  changeStatus: (id: number, status: string) => Promise<void>;
}

export const useReservationsStore = create<ReservationsState>()((set, get) => ({
  reservations: [],
  loaded: false,
  fetch: async () => set({ reservations: await reservationsService.list().catch(() => get().reservations), loaded: true }),
  changeStatus: async (id, status) => {
    await reservationsService.changeStatus(id, status);
    await get().fetch();
  },
}));
