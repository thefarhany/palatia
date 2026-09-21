export interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string | null;
  price: string; // Prisma Decimal -> string in JSON
  available: boolean;
  imageUrl: string | null;
  recipeCount?: number;
}

export type MenuItemWithCount = MenuItem & { _count?: { recipeItems: number } };

export interface MenuForm {
  name: string;
  category: string;
  price: number;
  description?: string;
}

export interface RecipeRow {
  key: number;
  ingredientId: number | null;
  qty: string;
  unit: string;
}
