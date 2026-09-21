import type { Request, Response, NextFunction } from "express";
import * as svc from "../services/inventoryService.js";

export function listIngredients(_req: Request, res: Response, next: NextFunction) {
  svc.listIngredients().then((ingredients) => res.json({ ingredients })).catch(next);
}

export function createIngredient(req: Request, res: Response, next: NextFunction) {
  svc.createIngredient(req.body).then((ingredient) => res.status(201).json({ ingredient })).catch(next);
}

export function updateIngredient(req: Request, res: Response, next: NextFunction) {
  svc.updateIngredient(Number(req.params.id), req.body).then((ingredient) => res.json({ ingredient })).catch(next);
}

export function getRecipe(req: Request, res: Response, next: NextFunction) {
  svc.getRecipe(Number(req.params.menuItemId))
    .then((recipe) => res.json({ recipe }))
    .catch(next);
}

export function replaceRecipe(req: Request, res: Response, next: NextFunction) {
  svc.replaceRecipe(Number(req.params.menuItemId), req.body.items)
    .then((recipe) => res.json({ recipe }))
    .catch(next);
}

export function listPurchaseOrders(_req: Request, res: Response, next: NextFunction) {
  svc.listPurchaseOrders().then((orders) => res.json({ orders })).catch(next);
}

export function createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  const { supplierName, items } = req.body;
  svc.createPurchaseOrder(supplierName, items).then((order) => res.status(201).json({ order })).catch(next);
}

export function receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
  svc.receivePurchaseOrder(Number(req.params.id)).then((order) => res.json({ order })).catch(next);
}

export function cancelPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  svc.cancelPurchaseOrder(Number(req.params.id)).then((order) => res.json({ order })).catch(next);
}