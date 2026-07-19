import type { Request, Response } from "express";
import { config } from "../config/env";
import { serializeDemoEmployeeById } from "../demo/demo-store";
import { EmployeeModel } from "../employees/employee.model";
import { toEmployeeResponse } from "../employees/employee.serializer";
import { asyncHandler } from "../shared/async-handler";
import { NotFoundError } from "../shared/errors";
import { requireUser } from "./auth.middleware";
import { loginSchema } from "./auth.schemas";
import { login } from "./auth.service";

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await login(loginSchema.parse(req.body));
  res.json(result);
});

export const logoutController = asyncHandler(async (_req: Request, res: Response) => {
  res.status(204).send();
});

export const meController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  if (config.demoMode) {
    const employee = serializeDemoEmployeeById(actor.id);
    if (!employee) throw new NotFoundError("Employee");
    res.json({ user: employee });
    return;
  }

  const employee = await EmployeeModel.findOne({ _id: actor.id, isDeleted: false }).lean();
  if (!employee) throw new NotFoundError("Employee");
  res.json({ user: toEmployeeResponse(employee) });
});
