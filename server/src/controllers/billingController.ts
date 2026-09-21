import type { Request, Response, NextFunction } from "express";
import * as svc from "../services/billingService.js";

const actor = (req: Request) => ({ userId: req.user!.userId, role: req.user!.role });

export function invoice(req: Request, res: Response, next: NextFunction) {
  svc.invoice(actor(req), Number(req.params.id)).then((invoice) => res.json({ invoice })).catch(next);
}

export function applyDiscount(req: Request, res: Response, next: NextFunction) {
  svc.applyDiscount(req.user!.userId, Number(req.params.id), req.body.discount)
    .then((order) => res.json({ order }))
    .catch(next);
}