import { create } from "zustand";
import { tablesService } from "@/services/tables-service";
import type { Table } from "@/lib/types";

interface TablesState {
  tables: Table[];
  loaded: boolean;
  fetch: () => Promise<void>;
  save: (id: number | null, data: { number: number; capacity: number }) => Promise<void>;
  rotateQr: (id: number) => Promise<void>;
  setStatus: (id: number, status: string) => Promise<void>;
}

export const useTablesStore = create<TablesState>()((set, get) => ({
  tables: [],
  loaded: false,
  fetch: async () => set({ tables: await tablesService.list(), loaded: true }),
  save: async (id, data) => {
    if (id) await tablesService.update(id, data);
    else await tablesService.create(data);
    await get().fetch();
  },
  rotateQr: async (id) => {
    await tablesService.rotateQr(id);
    await get().fetch();
  },
  setStatus: async (id, status) => {
    await tablesService.update(id, { status });
    await get().fetch();
  },
}));
