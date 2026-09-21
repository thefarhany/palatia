import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

// Validates req.body against a Zod schema; parsed (typed) result replaces req.body.
export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}