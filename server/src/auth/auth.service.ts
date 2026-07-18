import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config/env";
import { UnauthorizedError } from "../shared/errors";
import { EmployeeModel } from "../employees/employee.model";
import { toEmployeeResponse } from "../employees/employee.serializer";
import type { LoginInput } from "./auth.schemas";

export async function login(input: LoginInput) {
  const employee = await EmployeeModel.findOne({ email: input.email, isDeleted: false }).select("+passwordHash");
  if (!employee) throw new UnauthorizedError("Invalid email or password");
  if (employee.status !== "ACTIVE") throw new UnauthorizedError("Account is inactive");

  const validPassword = await bcrypt.compare(input.password, employee.passwordHash);
  if (!validPassword) throw new UnauthorizedError("Invalid email or password");

  const token = jwt.sign(
    { role: employee.role, employeeId: employee.employeeId },
    config.jwtSecret,
    { subject: String(employee._id), expiresIn: config.jwtExpiresIn } as SignOptions
  );

  return {
    token,
    user: toEmployeeResponse(employee)
  };
}
