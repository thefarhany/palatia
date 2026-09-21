import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  available: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  imageUrl: z.string().max(500).optional(),
});