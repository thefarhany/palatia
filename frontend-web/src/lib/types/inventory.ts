export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock: string;
  reorderLevel: string;
  supplierName: string | null;
  supplierPhone: string | null;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  status: "ORDERED" | "RECEIVED" | "CANCELLED";
  supplierName: string;
  createdAt: string;
  items: { id: number; qty: string; unitCost: string; ingredient: { id: number; name: string; unit: string } }[];
}

export interface IngredientForm {
  name: string;
  unit: string;
  stock: number;
  reorderLevel: number;
  supplierName?: string;
  supplierPhone?: string;
}

export interface PoRow {
  key: number;
  ingredientId: number | null;
  qty: string;
  unitCost: string;
}

export interface RecipeItemDetail {
  id: number;
  menuItemId: number;
  ingredientId: number;
  qty: number | string;
  ingredient: {
    name: string;
    unit: string;
  };
}
