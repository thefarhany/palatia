import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as orders from "../controllers/orderController.js";
import * as billing from "../controllers/billingController.js";
import * as reservations from "../controllers/reservationController.js";
import * as auth from "../controllers/authController.js";
import * as uploads from "../controllers/uploadController.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, paySchema } from "../validators/orders.js";
import { createReservationSchema, reservationStatusSchema } from "../validators/reservations.js";
import { makeUploader } from "../lib/uploads.js";
import { profileSchema } from "../validators/auth.js";
import { prisma } from "../lib/prisma.js";

// ME surface — anything an authenticated user does on their OWN data
// (orders, reservations, notifications, profile). Mounted with requireAuth.
// Staff can read their personal data here too; operational work lives in bo.
export const meRoutes = Router();

// Industry Standard Guard: Staff work accounts (ADMIN, CHEF, WAITER) cannot place customer orders/reservations.
const requireCustomer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role !== "CUSTOMER") {
    return res.status(403).json({ error: "Staff work accounts cannot place customer orders or reservations. Please use a customer account." });
  }
  next();
};

// Profile.
meRoutes.get("/profile", auth.me);
meRoutes.patch("/profile", validate(profileSchema), auth.updateProfile);

// My orders.
meRoutes.post("/orders", requireCustomer, validate(createOrderSchema), orders.create);
meRoutes.get("/orders", orders.list);
meRoutes.get("/orders/:id", orders.get);
meRoutes.post("/orders/:id/pay", validate(paySchema), orders.pay);
meRoutes.patch("/orders/:id/cancel", orders.cancel);
meRoutes.get("/orders/:id/invoice", billing.invoice);

// My reservations (availability feeds the reservation form).
meRoutes.get("/reservations/availability", reservations.availability);
meRoutes.post("/reservations", requireCustomer, validate(createReservationSchema), reservations.create);
meRoutes.get("/reservations", reservations.list);
meRoutes.patch("/reservations/:id/status", validate(reservationStatusSchema), reservations.changeStatus);

// My notifications — inline: per-user rows, list + read only.
meRoutes.get("/notifications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

meRoutes.patch("/notifications/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

meRoutes.patch("/notifications/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await prisma.notification.findUnique({ where: { id: Number(req.params.id) } });
    if (!row || row.userId !== req.user!.userId) return res.status(404).json({ error: "Not found" });
    const notification = await prisma.notification.update({ where: { id: row.id }, data: { read: true } });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

// My avatar.
meRoutes.post("/uploads/avatar", makeUploader("profile").single("file"), uploads.avatar);