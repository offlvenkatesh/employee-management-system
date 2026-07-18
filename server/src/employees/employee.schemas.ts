import { z } from "zod";
import { ROLES, STATUSES } from "../shared/roles";

const objectIdRegex = /^[a-f\d]{24}$/i;
const phoneRegex = /^\+?[0-9][0-9\s().-]{6,20}$/;

const emptyStringToNull = (value: unknown) => (value === "" ? null : value);

export const objectIdSchema = z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId");

export const employeeCreateSchema = z.object({
  employeeId: z.string().trim().min(2, "Employee ID is required").max(30),
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").toLowerCase(),
  phone: z.string().trim().regex(phoneRegex, "Valid phone number is required"),
  department: z.string().trim().min(2, "Department is required").max(80),
  designation: z.string().trim().min(2, "Designation is required").max(100),
  salary: z.coerce.number().positive("Salary must be greater than 0"),
  joiningDate: z.coerce.date(),
  status: z.enum(STATUSES).default("ACTIVE"),
  role: z.enum(ROLES).default("EMPLOYEE"),
  reportingManager: z.preprocess(emptyStringToNull, objectIdSchema.nullable().optional()),
  profileImage: z.string().trim().url("Profile image must be a URL").or(z.literal("")).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional()
});

export const employeeUpdateSchema = employeeCreateSchema.partial().extend({
  password: z.string().min(8, "Password must be at least 8 characters").optional()
});

export const employeeQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(STATUSES).optional(),
  sortBy: z.enum(["joiningDate", "name"]).default("joiningDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export const idParamSchema = z.object({ id: objectIdSchema });

export const updateManagerSchema = z.object({
  reportingManager: z.preprocess(emptyStringToNull, objectIdSchema.nullable())
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
export type UpdateManagerInput = z.infer<typeof updateManagerSchema>;
