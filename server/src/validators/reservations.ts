import { z } from "zod";

export const SLOTS = ["11:00", "13:00", "15:00", "18:00", "19:00", "20:00", "21:00"] as const;

export const createReservationSchema = z.object({
  tableId: z.number().int().positive(),
  date: z.string().date(), // "YYYY-MM-DD"
  slot: z.enum(SLOTS),
  guests: z.number().int().min(1).max(50),
});

// Reservation from the public form. name+phone optional here because a logged-in
// user attaches the reservation to their account — the service still requires
// name+phone when there's no actor (true guest).
export const guestReservationSchema = createReservationSchema.extend({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(8).max(30).optional(),
});

export const reservationStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"]),
});

export const availabilityQuerySchema = z.object({
  date: z.string().date(),
  slot: z.enum(SLOTS),
});

export const tableSchema = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().min(1).max(50),
  status: z.enum(["FREE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"]).optional(),
});