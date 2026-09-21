import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  stock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  supplierName: z.string().max(100).optional(),
  supplierPhone: z.string().max(30).optional(),
});

export const recipeSchema = z.object({
  items: z
    .array(
      z.object({
        ingredientId: z.number().int().positive(),
        qty: z.number().positive(),
      })
    )
    .max(50),
});

export const purchaseOrderSchema = z.object({
  supplierName: z.string().min(1).max(100),
  items: z
    .array(
      z.object({
        ingredientId: z.number().int().positive(),
        qty: z.number().positive(),
        unitCost: z.number().min(0),
      })
    )
    .min(1)
    .max(100),
});