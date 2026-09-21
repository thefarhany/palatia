import express from "express";
import cors from "cors";
import helmet from "helmet";
import { optionalAuth, requireAuth, requireRole } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { publicRoutes } from "./routes/public.js";
import { meRoutes } from "./routes/me.js";
import { boRoutes } from "./routes/bo.js";
import { UPLOAD_ROOT, uploadErrorHandler } from "./lib/uploads.js";
import env from "./lib/env.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  // Populate req.user when a token is present; group gates do the rest.
  app.use(optionalAuth);

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Public: register/login + no-auth surface (menu, QR resolve, guest tracking).
  app.use("/api/auth", authRouter);
  app.use("/api/public", publicRoutes);

  // Me: any authenticated user's own data (mounted once, one gate).
  app.use("/api/me", requireAuth, meRoutes, uploadErrorHandler);

  // Bo: backoffice operations, staff-only by construction (one gate for all).
  app.use(
    "/api/bo",
    requireAuth,
    requireRole("ADMIN", "CHEF", "WAITER"),
    boRoutes,
    uploadErrorHandler
  );

  // Uploaded images (menu/profile) served as static files, path stored in DB as /uploads/...
  app.use("/uploads", express.static(UPLOAD_ROOT));

  app.use(errorHandler);
  return app;
}