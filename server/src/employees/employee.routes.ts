import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import {
  createEmployeeController,
  csvUpload,
  deleteEmployeeController,
  getEmployeeController,
  importEmployeesController,
  listEmployeesController,
  reporteesController,
  updateEmployeeController,
  updateManagerController
} from "./employee.controller";

export const employeeRoutes = Router();

employeeRoutes.use(authenticate);
employeeRoutes.get("/", listEmployeesController);
employeeRoutes.post("/", createEmployeeController);
employeeRoutes.post("/import", csvUpload.single("file"), importEmployeesController);
employeeRoutes.get("/:id", getEmployeeController);
employeeRoutes.put("/:id", updateEmployeeController);
employeeRoutes.delete("/:id", deleteEmployeeController);
employeeRoutes.get("/:id/reportees", reporteesController);
employeeRoutes.patch("/:id/manager", updateManagerController);
