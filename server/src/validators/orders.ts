import { z } from "zod";

export const createOrderSchema = z.object({
  type: z.enum(["DINE_IN", "PICKUP", "TAKEAWAY"]),
  tableId: z.number().int().positive().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        qty: z.number().int().min(1).max(99),
        notes: z.string().max(255).optional(),
      })
    )
    .min(1)
    .max(50),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "SERVED", "COMPLETED"]),
});

export const paySchema = z.object({
  method: z.enum(["CASH", "CARD_AT_COUNTER"]).default("CARD_AT_COUNTER"),
});