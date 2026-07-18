import { Router } from "express";
import { authenticate } from "./auth.middleware";
import { loginController, logoutController, meController } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", loginController);
authRoutes.post("/logout", authenticate, logoutController);
authRoutes.get("/me", authenticate, meController);
