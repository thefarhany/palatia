import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(150),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  surface: z.enum(["public", "staff"]).optional(),
});

// Edit profil sendiri — email & password immutable (reset password out of scope v1).
export const profileSchema = z.object({
  name: z.string().min(1).max(100),
});

export const staffSchema = registerSchema.extend({
  role: z.enum(["ADMIN", "CHEF", "WAITER"]),
});

export const staffUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "CHEF", "WAITER"]).optional(),
  isActive: z.boolean().optional(),
});