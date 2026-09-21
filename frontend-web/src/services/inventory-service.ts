import { apiClient } from "@/lib/api-client";
import type { Ingredient, PurchaseOrder } from "@/lib/types";

export const inventoryService = {
  listIngredients: () =>
    apiClient<{ ingredients: Ingredient[] }>("/bo/inventory/ingredients").then(
      (r) => r.ingredients,
    ),
  listPurchaseOrders: () =>
    apiClient<{ orders: PurchaseOrder[] }>("/bo/inventory/purchase-orders")
      .then((r) => r.orders)
      .catch(() => [] as PurchaseOrder[]),
  createIngredient: (data: Record<string, unknown>) =>
    apiClient("/bo/inventory/ingredients", { method: "POST", body: data }),
  updateIngredient: (id: number, data: Record<string, unknown>) =>
    apiClient(`/bo/inventory/ingredients/${id}`, {
      method: "PATCH",
      body: data,
    }),
  createPO: (data: {
    supplierName: string;
    items: { ingredientId: number; qty: number; unitCost: number }[];
  }) =>
    apiClient("/bo/inventory/purchase-orders", { method: "POST", body: data }),
  receivePO: (id: number) =>
    apiClient(`/bo/inventory/purchase-orders/${id}/receive`, {
      method: "PATCH",
    }),
  cancelPO: (id: number) =>
    apiClient(`/bo/inventory/purchase-orders/${id}/cancel`, {
      method: "PATCH",
    }),
  getRecipe: (menuItemId: number) =>
    apiClient<{
      recipe: {
        id: number;
        menuItemId: number;
        ingredientId: number;
        qty: number;
        ingredient: { name: string; unit: string };
      }[];
    }>(`/bo/inventory/recipes/${menuItemId}`).then((r) => r.recipe),
};
