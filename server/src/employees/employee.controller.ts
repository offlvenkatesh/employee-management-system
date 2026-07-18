import { parse } from "csv-parse/sync";
import type { Request, Response } from "express";
import multer from "multer";
import { requireUser } from "../auth/auth.middleware";
import { asyncHandler } from "../shared/async-handler";
import { BadRequestError } from "../shared/errors";
import {
  employeeCreateSchema,
  employeeQuerySchema,
  employeeUpdateSchema,
  idParamSchema,
  updateManagerSchema
} from "./employee.schemas";
import {
  createEmployee,
  getDirectReportees,
  getEmployeeById,
  importEmployeesFromRows,
  listEmployees,
  softDeleteEmployee,
  updateEmployee,
  updateEmployeeManager
} from "./employee.service";

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.includes("csv") || file.originalname.toLowerCase().endsWith(".csv")) {
      callback(null, true);
      return;
    }
    callback(new BadRequestError("Only CSV files are supported"));
  }
});

export const listEmployeesController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const query = employeeQuerySchema.parse(req.query);
  res.json(await listEmployees(query, actor));
});

export const getEmployeeController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const { id } = idParamSchema.parse(req.params);
  res.json({ data: await getEmployeeById(id, actor) });
});

export const createEmployeeController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const input = employeeCreateSchema.parse(req.body);
  res.status(201).json({ data: await createEmployee(input, actor) });
});

export const updateEmployeeController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const { id } = idParamSchema.parse(req.params);
  const input = employeeUpdateSchema.parse(req.body);
  res.json({ data: await updateEmployee(id, input, actor) });
});

export const deleteEmployeeController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const { id } = idParamSchema.parse(req.params);
  await softDeleteEmployee(id, actor);
  res.status(204).send();
});

export const reporteesController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const { id } = idParamSchema.parse(req.params);
  res.json({ data: await getDirectReportees(id, actor) });
});

export const updateManagerController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  const { id } = idParamSchema.parse(req.params);
  const { reportingManager } = updateManagerSchema.parse(req.body);
  res.json({ data: await updateEmployeeManager(id, reportingManager ?? null, actor) });
});

export const importEmployeesController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireUser(req);
  if (!req.file) throw new BadRequestError("CSV file is required");
  const rows = parse(req.file.buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];
  res.status(201).json(await importEmployeesFromRows(rows, actor));
});
