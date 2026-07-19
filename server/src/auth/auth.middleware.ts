import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { getDemoAuthenticatedUser } from "../demo/demo-store";
import { EmployeeModel } from "../employees/employee.model";
import { ForbiddenError, UnauthorizedError } from "../shared/errors";
import type { Role } from "../shared/roles";

interface JwtPayload {
  sub?: string;
  role?: Role;
  employeeId?: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedError();

    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (!payload.sub) throw new UnauthorizedError();

    if (config.demoMode) {
      const user = getDemoAuthenticatedUser(payload.sub);
      if (!user) throw new UnauthorizedError();
      req.user = user;
      next();
      return;
    }

    const employee = await EmployeeModel.findOne({ _id: payload.sub, isDeleted: false }).lean();
    if (!employee || employee.status !== "ACTIVE") throw new UnauthorizedError();

    req.user = {
      id: String(employee._id),
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role
    };
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError());
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}

export function requireUser(req: Request): NonNullable<Request["user"]> {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
