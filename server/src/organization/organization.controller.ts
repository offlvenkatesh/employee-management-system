import type { Request, Response } from "express";
import { requireUser } from "../auth/auth.middleware";
import { asyncHandler } from "../shared/async-handler";
import { getOrganizationTree } from "./organization.service";

export const organizationTreeController = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getOrganizationTree(requireUser(req)) });
});
