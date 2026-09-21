import { create } from "zustand";
import { menuService } from "@/services/menu-service";
import type { MenuItem } from "@/lib/types";

interface MenuState {
  items: MenuItem[];
  categories: string[];
  loaded: boolean;
  fetch: () => Promise<void>;
  toggleAvailable: (id: number, available: boolean) => Promise<void>;
  save: (id: number | null, data: Record<string, unknown>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useMenuStore = create<MenuState>()((set, get) => ({
  items: [],
  categories: [],
  loaded: false,
  fetch: async () => {
    const [items, categories] = await Promise.all([menuService.list(), menuService.categories()]);
    set({
      items: items.map(({ _count, ...i }) => ({ ...i, recipeCount: _count?.recipeItems ?? 0 })),
      categories,
      loaded: true,
    });
  },
  toggleAvailable: async (id, available) => {
    set({ items: get().items.map((i) => (i.id === id ? { ...i, available } : i)) });
    await menuService.update(id, { available }).catch(() => get().fetch());
  },
  save: async (id, data) => {
    if (id) await menuService.update(id, data);
    else await menuService.create(data);
  },
  remove: async (id) => {
    await menuService.remove(id);
    await get().fetch();
  },
}));
