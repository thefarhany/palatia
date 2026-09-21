import { Router } from "express";
import * as menu from "../controllers/menuController.js";
import * as pub from "../controllers/publicController.js";
import * as orders from "../controllers/orderController.js";
import * as reservations from "../controllers/reservationController.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, paySchema } from "../validators/orders.js";
import { guestReservationSchema } from "../validators/reservations.js";

// PUBLIC surface — no auth. What anyone can reach:
// the guest web menu, scanned-QR resolution, and guest order tracking/payment.
export const publicRoutes = Router();

// Menu browsing (UC-04).
publicRoutes.get("/menu", menu.list);
publicRoutes.get("/menu/categories", menu.categories);

// Order creation from the public menu page — optional auth: no JWT = guest
// (DINE_IN from a table QR only); with JWT = member ordering from the web.
publicRoutes.post("/orders", validate(createOrderSchema), orders.create);

// Guest table reservation (no login — name + phone inline).
publicRoutes.get("/reservations/availability", reservations.availability);
publicRoutes.post("/reservations", validate(guestReservationSchema), reservations.createGuest);

// Scanned table QR → table info.
publicRoutes.get("/table/:token", pub.table);

// Guest order tracking & payment — addressed by unguessable trackingToken,
// never by the sequential ORD-xxxxx code.
publicRoutes.get("/orders/:token", pub.trackOrder);
publicRoutes.post("/orders/:token/pay", validate(paySchema), pub.payOrder);