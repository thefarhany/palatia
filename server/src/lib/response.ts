import type { Response } from "express";

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200,
  meta?: ApiMeta
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  statusCode = 500,
  message = "Internal server error",
  errorCode?: string,
  details?: unknown
) {
  const code =
    errorCode ||
    (statusCode === 400
      ? "BAD_REQUEST"
      : statusCode === 401
      ? "UNAUTHORIZED"
      : statusCode === 403
      ? "FORBIDDEN"
      : statusCode === 404
      ? "NOT_FOUND"
      : statusCode === 409
      ? "CONFLICT"
      : "INTERNAL_SERVER_ERROR");

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode: code,
    data: null,
    ...(details ? { details } : {}),
  });
}
