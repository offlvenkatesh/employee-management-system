import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { dashboardStatsController } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);
dashboardRoutes.get("/stats", dashboardStatsController);
