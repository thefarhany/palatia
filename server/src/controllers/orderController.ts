import type { OrderStatus } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";
import * as svc from "../services/orderService.js";
import { orderView } from "../services/orderService.js";

// requireAuth'd handlers: user is guaranteed present.
const actor = (req: Request) => ({ userId: req.user!.userId, role: req.user!.role });
// create is optional-auth: null → guest order (anonymous QR).
const optionalActor = (req: Request) =>
  req.user ? { userId: req.user.userId, role: req.user.role } : null;

export function create(req: Request, res: Response, next: NextFunction) {
  svc.createOrder(optionalActor(req), req.body)
    .then((order) => res.status(201).json({ order: orderView(order) }))
    .catch(next);
}

export function list(req: Request, res: Response, next: NextFunction) {
  const status = (["PENDING", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"] as OrderStatus[]).includes(
    req.query.status as OrderStatus
  )
    ? (req.query.status as OrderStatus)
    : undefined;
  svc.listOrders(actor(req), status)
    .then((orders) => res.json({ orders: orders.map(orderView) }))
    .catch(next);
}

export function get(req: Request, res: Response, next: NextFunction) {
  svc.getOrder(actor(req), Number(req.params.id))
    .then((order) => res.json({ order: orderView(order!) }))
    .catch(next);
}

export function changeStatus(req: Request, res: Response, next: NextFunction) {
  svc.changeStatus(actor(req), Number(req.params.id), req.body.status)
    .then((order) => res.json({ order: orderView(order) }))
    .catch(next);
}

export function cancel(req: Request, res: Response, next: NextFunction) {
  svc.cancelOrder(actor(req), Number(req.params.id))
    .then((order) => res.json({ order: orderView(order) }))
    .catch(next);
}

export function pay(req: Request, res: Response, next: NextFunction) {
  svc.payOrder(actor(req), Number(req.params.id), req.body.method)
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