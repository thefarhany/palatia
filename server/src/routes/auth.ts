import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.js";

// Auth entry points — public (profile and staff management live in me/ and bo/).
export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), controller.register);
authRouter.post("/login", validate(loginSchema), controller.login);