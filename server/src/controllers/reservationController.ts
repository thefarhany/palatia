import type { Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import * as svc from "../services/reservationService.js";
import { availabilityQuerySchema } from "../validators/reservations.js";
import { HttpError } from "../lib/httpError.js";

const actor = (req: Request) => ({ userId: req.user!.userId, role: req.user!.role });

export function availability(req: Request, res: Response, next: NextFunction) {
  // parse happens here (HTTP concern); service stays query-free
  const parsed = availabilityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new HttpError(400, "date (YYYY-MM-DD) and slot are required"));
  }
  svc.availability(parsed.data.date, parsed.data.slot)
    .then((tables) => res.json({ date: parsed.data.date, slot: parsed.data.slot, tables }))
    .catch(next);
}

export function create(req: Request, res: Response, next: NextFunction) {
  svc.create(actor(req), req.body).then((reservation) => res.status(201).json({ reservation })).catch(next);
}

// Guest (anonymous web) reservation — identity carried inline (name+phone).
// Optional auth: no JWT = guest (name+phone inline); with JWT = member —
// reservation attaches to their account so it shows in GET /me/reservations.
export function createGuest(req: Request, res: Response, next: NextFunction) {
  svc.create(req.user ?? null, req.body).then((reservation) => res.status(201).json({ reservation })).catch(next);
}

export function list(req: Request, res: Response, next: NextFunction) {
  const date = typeof req.query.date === "string" && req.query.date ? req.query.date : undefined;
  svc.list(actor(req), date).then((reservations) => res.json({ reservations })).catch(next);
}

export function changeStatus(req: Request, res: Response, next: NextFunction) {
  svc.changeStatus(actor(req), Number(req.params.id), req.body.status)
    .then((reservation) => res.json({ reservation }))
    .catch(next);
}

export function listTables(_req: Request, res: Response, next: NextFunction) {
  svc.listTables().then((tables) => res.json({ tables })).catch(next);
}

export function createTable(req: Request, res: Response, next: NextFunction) {
  svc.createTable(req.body).then((table) => res.status(201).json({ table })).catch(next);
}

export function updateTable(req: Request, res: Response, next: NextFunction) {
  svc.updateTable(Number(req.params.id), req.body).then((table) => res.json({ table })).catch(next);
}

// ---- Table QR (UC-06): print & stick on tables ----

// Admin: printable QR image (open in browser → print). PNG of the menu URL.
export function qrPng(req: Request, res: Response, next: NextFunction) {
  const host = (req.headers["x-forwarded-host"] || req.headers.host)?.toString();
  svc.getQr(Number(req.params.id), host)
    .then((qr) => QRCode.toBuffer(qr.url, { width: 512, margin: 2 }))
    .then((png) => res.type("png").send(png))
    .catch(next);
}

export function regenerateQr(req: Request, res: Response, next: NextFunction) {
  const host = (req.headers["x-forwarded-host"] || req.headers.host)?.toString();
  svc.regenerateQr(Number(req.params.id), host).then((qr) => res.json({ qr })).catch(next);
}