import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/httpError.js";
import { sendError } from "../lib/response.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const firstMessage = Object.values(fieldErrors).flat()[0] || "Validation failed";
    return sendError(res, 400, firstMessage, "VALIDATION_ERROR", fieldErrors);
  }

  if (err instanceof HttpError) {
    return sendError(res, err.status, err.message);
  }

  // Unique constraint violations surface as 409 (e.g. double-booking, duplicate email).
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, 409, "Data sudah terdaftar (duplicate constraint)", "DUPLICATE_ENTRY");
    }
    if (err.code === "P2025") {
      return sendError(res, 404, "Data tidak ditemukan", "NOT_FOUND");
    }
  }

  console.error("[Uncaught Error]", err);
  const errorMessage = err instanceof Error ? err.message : "Internal server error";
  return sendError(res, 500, errorMessage, "INTERNAL_SERVER_ERROR");
}