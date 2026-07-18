import type { Request, Response } from "express";
import { requireUser } from "../auth/auth.middleware";
import { asyncHandler } from "../shared/async-handler";
import { getDashboardStats } from "./dashboard.service";

export const dashboardStatsController = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getDashboardStats(requireUser(req)) });
});
