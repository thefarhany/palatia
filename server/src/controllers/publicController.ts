import type { Request, Response, NextFunction } from "express";
import { resolveTableByToken } from "../services/reservationService.js";
import { trackGuestOrder, payGuestOrder, orderView } from "../services/orderService.js";

// No-auth endpoints used by the public web surface:
//  - table QR token → table info
//  - guest order tracking + payment by unguessable trackingToken

export function table(req: Request, res: Response, next: NextFunction) {
  resolveTableByToken(String(req.params.token)).then((table) => res.json({ table })).catch(next);
}

export function trackOrder(req: Request, res: Response, next: NextFunction) {
  trackGuestOrder(String(req.params.token)).then((order) => res.json({ order: orderView(order) })).catch(next);
}

export function payOrder(req: Request, res: Response, next: NextFunction) {
  payGuestOrder(String(req.params.token), req.body.method)
    .then((order) =>
      res.json({
        // Placeholder response shape — mirrors a gateway callback so the frontend
        // contract survives if a real gateway is added later.
        payment: {
          status: "SUCCESS",
          message: "Payment recorded (placeholder gateway)",
          method: req.body.method,
          amount: Number(order.total),
        },
        order: orderView(order),
      })
    )
    .catch(next);
}