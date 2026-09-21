import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { uploadUrl } from "../lib/uploads.js";

// Uploads have no business logic beyond URL construction — controller calls
// prisma directly rather than growing a service for two one-liners.

export function menuImage(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.status(201).json({ url: uploadUrl("menu", req.file.filename) });
}

export function avatar(req: Request, res: Response, next: NextFunction) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = uploadUrl("profile", req.file.filename);
  prisma.user
    .update({ where: { id: req.user!.userId }, data: { avatar: url } })
    .then(() => res.status(201).json({ url }))
    .catch(next);
}