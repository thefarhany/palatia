import { create } from "zustand";
import { inventoryService } from "@/services/inventory-service";
import type { Ingredient, PurchaseOrder } from "@/lib/types";

interface InventoryState {
  ingredients: Ingredient[];
  pos: PurchaseOrder[];
  loaded: boolean;
  fetch: () => Promise<void>;
  saveIngredient: (id: number | null, data: Record<string, unknown>) => Promise<void>;
  createPO: (supplierName: string, items: { ingredientId: number; qty: number; unitCost: number }[]) => Promise<void>;
  receivePO: (id: number) => Promise<void>;
  cancelPO: (id: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  ingredients: [],
  pos: [],
  loaded: false,
  fetch: async () => {
    const [ingredients, pos] = await Promise.all([
      inventoryService.listIngredients(),
      inventoryService.listPurchaseOrders(),
    ]);
    set({ ingredients, pos, loaded: true });
  },
  saveIngredient: async (id, data) => {
    if (id) await inventoryService.updateIngredient(id, data);
    else await inventoryService.createIngredient(data);
    await get().fetch();
  },
  createPO: async (supplierName, items) => {
    await inventoryService.createPO({ supplierName, items });
    await get().fetch();
  },
  receivePO: async (id) => {
    await inventoryService.receivePO(id);
    await get().fetch();
  },
  cancelPO: async (id) => {
    await inventoryService.cancelPO(id);
    await get().fetch();
  },
}));
