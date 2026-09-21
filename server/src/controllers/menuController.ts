import type { Request, Response, NextFunction } from "express";
import * as svc from "../services/menuService.js";

export function list(req: Request, res: Response, next: NextFunction) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const onlyAvailable = req.query.available !== "false";
  svc.list(q, category, onlyAvailable)
    .then((items) => res.json({ items }))
    .catch(next);
}

export function listAdmin(_req: Request, res: Response, next: NextFunction) {
  svc.listAdmin().then((items) => res.json({ items })).catch(next);
}

export function categories(_req: Request, res: Response, next: NextFunction) {
  svc.categories().then((categories) => res.json({ categories })).catch(next);
}

export function create(req: Request, res: Response, next: NextFunction) {
  svc.create(req.user!.userId, req.body).then((item) => res.status(201).json({ item })).catch(next);
}

export function update(req: Request, res: Response, next: NextFunction) {
  svc.update(req.user!.userId, Number(req.params.id), req.body).then((item) => res.json({ item })).catch(next);
}

export function remove(req: Request, res: Response, next: NextFunction) {
  svc.remove(req.user!.userId, Number(req.params.id)).then(() => res.status(204).end()).catch(next);
}