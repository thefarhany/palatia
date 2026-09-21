import { z } from "zod";

export const discountSchema = z.object({ discount: z.number().min(0) });