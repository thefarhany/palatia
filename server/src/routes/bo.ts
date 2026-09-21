import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as orders from "../controllers/orderController.js";
import * as billing from "../controllers/billingController.js";
import * as menu from "../controllers/menuController.js";
import * as auth from "../controllers/authController.js";
import * as tables from "../controllers/reservationController.js";
import * as inventory from "../controllers/inventoryController.js";
import * as uploads from "../controllers/uploadController.js";
import { requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, orderStatusSchema, paySchema } from "../validators/orders.js";
import { discountSchema } from "../validators/billing.js";
import { staffSchema, staffUpdateSchema } from "../validators/auth.js";
import { tableSchema, reservationStatusSchema } from "../validators/reservations.js";
import { ingredientSchema, recipeSchema, purchaseOrderSchema } from "../validators/inventory.js";
import { menuItemSchema } from "../validators/menu.js";
import { makeUploader } from "../lib/uploads.js";
import { listAudit } from "../services/auditService.js";
import { dailySales, popularDishes } from "../services/reportService.js";

// BO (backoffice) surface — staff-only operations, mounted with
// requireAuth + requireRole(ADMIN/CHEF/WAITER). Routes still carry finer
// requireRole("ADMIN") gates where the operation is admin-only.
export const boRoutes = Router();

// ---- Orders: kasir input, kitchen queue, floor view ----
boRoutes.post("/orders", validate(createOrderSchema), orders.create);
boRoutes.get("/orders", orders.list);
boRoutes.get("/orders/:id", orders.get);
boRoutes.patch("/orders/:id/status", validate(orderStatusSchema), orders.changeStatus);
boRoutes.patch("/orders/:id/cancel", orders.cancel);
boRoutes.post("/orders/:id/pay", validate(paySchema), orders.pay);
boRoutes.patch("/orders/:id/discount", requireRole("WAITER", "ADMIN"), validate(discountSchema), billing.applyDiscount);

// Reservations management (waiter).
boRoutes.get("/reservations", tables.list);
boRoutes.patch("/reservations/:id/status", validate(reservationStatusSchema), tables.changeStatus);

// Menu management (UC-05, ADMIN, CHEF read).
boRoutes.get("/menu", requireRole("ADMIN", "CHEF"), menu.listAdmin);
boRoutes.post("/menu", requireRole("ADMIN"), validate(menuItemSchema), menu.create);
boRoutes.patch("/menu/:id", requireRole("ADMIN"), validate(menuItemSchema.partial()), menu.update);
boRoutes.delete("/menu/:id", requireRole("ADMIN"), menu.remove);

// Staff management (UC-25, ADMIN).
boRoutes.get("/staff", requireRole("ADMIN"), auth.listStaff);
boRoutes.post("/staff", requireRole("ADMIN"), validate(staffSchema), auth.createStaff);
boRoutes.patch("/staff/:id", requireRole("ADMIN"), validate(staffUpdateSchema), auth.updateStaff);

// Tables + printed QR (UC-10 / UC-06).
boRoutes.get("/tables", tables.listTables);
boRoutes.post("/tables", requireRole("ADMIN"), validate(tableSchema), tables.createTable);
boRoutes.patch("/tables/:id", requireRole("ADMIN"), validate(tableSchema.partial()), tables.updateTable);
boRoutes.get("/tables/:id/qr.png", requireRole("ADMIN"), tables.qrPng);
boRoutes.post("/tables/:id/qr", requireRole("ADMIN"), tables.regenerateQr);

// ---- Inventory (UC-21..24, ADMIN, CHEF read recipe) ----
boRoutes.get("/inventory/ingredients", requireRole("ADMIN"), inventory.listIngredients);
boRoutes.post("/inventory/ingredients", requireRole("ADMIN"), validate(ingredientSchema), inventory.createIngredient);
boRoutes.patch("/inventory/ingredients/:id", requireRole("ADMIN"), validate(ingredientSchema.partial()), inventory.updateIngredient);
boRoutes.get("/inventory/recipes/:menuItemId", requireRole("ADMIN", "CHEF"), inventory.getRecipe);
boRoutes.put("/inventory/recipes/:menuItemId", requireRole("ADMIN"), validate(recipeSchema), inventory.replaceRecipe);
boRoutes.get("/inventory/purchase-orders", requireRole("ADMIN"), inventory.listPurchaseOrders);
boRoutes.post("/inventory/purchase-orders", requireRole("ADMIN"), validate(purchaseOrderSchema), inventory.createPurchaseOrder);
boRoutes.patch("/inventory/purchase-orders/:id/receive", requireRole("ADMIN"), inventory.receivePurchaseOrder);
boRoutes.patch("/inventory/purchase-orders/:id/cancel", requireRole("ADMIN"), inventory.cancelPurchaseOrder);

// Menu image upload (ADMIN).
boRoutes.post("/uploads/menu", requireRole("ADMIN"), makeUploader("menu").single("file"), uploads.menuImage);

// Reports (UC-26, ADMIN).
boRoutes.get("/reports/sales/daily", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ report: await dailySales(typeof req.query.date === "string" ? req.query.date : undefined) });
  } catch (err) {
    next(err);
  }
});

boRoutes.get("/reports/sales/popular", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Number(req.query.days) || 30;
    res.json({ report: await popularDishes(Math.min(days, 365)) });
  } catch (err) {
    next(err);
  }
});

// Audit log (UC-27, ADMIN).
boRoutes.get("/audit", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    res.json({ logs: await listAudit() });
  } catch (err) {
    next(err);
  }
});