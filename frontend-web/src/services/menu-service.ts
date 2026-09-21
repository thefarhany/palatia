import { apiClient } from "@/lib/api-client";
import type { MenuItem } from "@/lib/types";

export type MenuItemWithCount = MenuItem & { _count?: { recipeItems: number } };

export const menuService = {
  list: () =>
    apiClient<{ items: MenuItemWithCount[] }>("/bo/menu").then((r) => r.items),

  categories: () =>
    apiClient<{ categories: string[] }>("/public/menu/categories")
      .then((r) => r.categories)
      .catch(() => [] as string[]),

  publicList: (available = true) =>
    apiClient<{ items: MenuItem[] }>(
      `/public/menu${available ? "" : "?available=false"}`,
    ).then((r) => r.items),

  create: (data: Record<string, unknown>) =>
    apiClient<{ item: MenuItem }>("/bo/menu", { method: "POST", body: data }),

  update: (id: number, data: Record<string, unknown>) =>
    apiClient<{ item: MenuItem }>(`/bo/menu/${id}`, {
      method: "PATCH",
      body: data,
    }),

  remove: (id: number) => apiClient(`/bo/menu/${id}`, { method: "DELETE" }),

  getRecipe: (menuItemId: number) =>
    apiClient<{
      recipe: {
        ingredientId: number;
        qty: string;
        ingredient: { id: number; name: string; unit: string };
      }[];
    }>(`/bo/inventory/recipes/${menuItemId}`).then((r) => r.recipe),

  saveRecipe: (
    menuItemId: number,
    items: { ingredientId: number; qty: number }[],
  ) =>
    apiClient(`/bo/inventory/recipes/${menuItemId}`, {
      method: "PUT",
      body: { items },
    }),
};
