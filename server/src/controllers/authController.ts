import type { Request, Response, NextFunction } from "express";
import * as svc from "../services/authService.js";

export function register(req: Request, res: Response, next: NextFunction) {
  const { name, email, password } = req.body;
  svc.register(name, email, password).then((r) => res.status(201).json(r)).catch(next);
}

export function login(req: Request, res: Response, next: NextFunction) {
  const { email, password, surface } = req.body;
  const ip = req.ip || req.socket.remoteAddress;
  svc.login(email, password, surface, ip).then((r) => res.json(r)).catch(next);
}

export function me(req: Request, res: Response, next: NextFunction) {
  svc.me(req.user!.userId).then((user) => res.json({ user })).catch(next);
}

export function updateProfile(req: Request, res: Response, next: NextFunction) {
  svc.updateProfile(req.user!.userId, req.body.name)
    .then((user) => res.json({ user }))
    .catch(next);
}

export function createStaff(req: Request, res: Response, next: NextFunction) {
  const { name, email, password, role } = req.body;
  svc.createStaff(name, email, password, role).then((user) => res.status(201).json({ user })).catch(next);
}

export function listStaff(_req: Request, res: Response, next: NextFunction) {
  svc.listStaff().then((users) => res.json({ users })).catch(next);
}

export function updateStaff(req: Request, res: Response, next: NextFunction) {
  svc.updateStaff(Number(req.params.id), req.body).then((user) => res.json({ user })).catch(next);
}