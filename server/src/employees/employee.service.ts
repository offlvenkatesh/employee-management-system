import bcrypt from "bcryptjs";
import { Types, type FilterQuery, type SortOrder } from "mongoose";
import { config } from "../config/env";
import {
  createDemoEmployee,
  getDemoDirectReportees,
  getDemoEmployeeResponseById,
  listDemoEmployees,
  softDeleteDemoEmployee,
  updateDemoEmployee,
  updateDemoEmployeeManager
} from "../demo/demo-store";
import type { AuthenticatedUser } from "../types/express";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../shared/errors";
import type { Role } from "../shared/roles";
import { EmployeeModel, type Employee } from "./employee.model";
import { employeeCreateSchema, type EmployeeCreateInput, type EmployeeQueryInput, type EmployeeUpdateInput } from "./employee.schemas";
import { toEmployeeResponse, type EmployeeResponse } from "./employee.serializer";

interface PaginatedEmployees {
  data: EmployeeResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const elevatedRoles: Role[] = ["SUPER_ADMIN", "HR_MANAGER"];
const employeeEditableFields = new Set(["phone", "profileImage"]);

function isElevated(role: Role): boolean {
  return elevatedRoles.includes(role);
}

function ensureElevated(actor: AuthenticatedUser): void {
  if (!isElevated(actor.role)) {
    throw new ForbiddenError();
  }
}

function ensureCanAssignRole(actor: AuthenticatedUser, role?: Role): void {
  if (role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Only a Super Admin can assign the Super Admin role");
  }
}

function ensureEmployeeOwnProfileOnly(actor: AuthenticatedUser, targetId: string): void {
  if (actor.role === "EMPLOYEE" && actor.id !== targetId) {
    throw new ForbiddenError("Employees can only access their own profile");
  }
}

function assertEmployeeUpdateScope(actor: AuthenticatedUser, targetId: string, input: EmployeeUpdateInput): void {
  if (actor.role !== "EMPLOYEE") return;
  ensureEmployeeOwnProfileOnly(actor, targetId);
  const attemptedFields = Object.keys(input);
  const invalidField = attemptedFields.find((field) => !employeeEditableFields.has(field));
  if (invalidField) {
    throw new ForbiddenError("Employees can only update phone and profile image");
  }
}

async function assertUniqueEmployee(input: Partial<EmployeeCreateInput>, existingId?: string): Promise<void> {
  const or: FilterQuery<Employee>[] = [];
  if (input.email) or.push({ email: input.email });
  if (input.employeeId) or.push({ employeeId: input.employeeId });
  if (!or.length) return;

  const existing = await EmployeeModel.findOne({ $or: or, isDeleted: false }).lean();
  if (existing && String(existing._id) !== existingId) {
    throw new ConflictError("Employee ID or email already exists");
  }
}

async function ensureManagerExists(managerId?: string | null): Promise<void> {
  if (!managerId) return;
  const manager = await EmployeeModel.exists({ _id: managerId, isDeleted: false });
  if (!manager) {
    throw new BadRequestError("Reporting manager does not exist");
  }
}

async function wouldCreateCycleFromDatabase(employeeId: string, managerId: string | null | undefined): Promise<boolean> {
  if (!managerId) return false;
  let nextManagerId: string | null = managerId;
  const visited = new Set<string>();

  while (nextManagerId) {
    if (nextManagerId === employeeId) return true;
    if (visited.has(nextManagerId)) return true;
    visited.add(nextManagerId);

    const manager = (await EmployeeModel.findById(nextManagerId)
      .select("reportingManager")
      .lean()) as { reportingManager?: unknown } | null;
    nextManagerId = manager?.reportingManager ? String(manager.reportingManager) : null;
  }

  return false;
}

export async function listEmployees(query: EmployeeQueryInput, actor: AuthenticatedUser): Promise<PaginatedEmployees> {
  if (config.demoMode) return listDemoEmployees(query, actor);

  const filter: FilterQuery<Employee> = { isDeleted: false };

  if (actor.role === "EMPLOYEE") {
    filter._id = actor.id;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }
  if (query.department) filter.department = query.department;
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  const sort: Record<string, SortOrder> = { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 };
  const skip = (query.page - 1) * query.limit;

  const [employees, total] = await Promise.all([
    EmployeeModel.find(filter)
      .populate("reportingManager", "name employeeId")
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean(),
    EmployeeModel.countDocuments(filter)
  ]);

  return {
    data: employees.map(toEmployeeResponse),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit))
    }
  };
}

export async function getEmployeeById(id: string, actor: AuthenticatedUser): Promise<EmployeeResponse> {
  if (config.demoMode) return getDemoEmployeeResponseById(id, actor);

  ensureEmployeeOwnProfileOnly(actor, id);
  const employee = await EmployeeModel.findOne({ _id: id, isDeleted: false })
    .populate("reportingManager", "name employeeId")
    .lean();
  if (!employee) throw new NotFoundError("Employee");
  return toEmployeeResponse(employee);
}

export async function createEmployee(input: EmployeeCreateInput, actor: AuthenticatedUser): Promise<EmployeeResponse> {
  if (config.demoMode) return createDemoEmployee(input, actor);

  ensureElevated(actor);
  ensureCanAssignRole(actor, input.role);
  await assertUniqueEmployee(input);
  await ensureManagerExists(input.reportingManager ?? null);

  const passwordHash = await bcrypt.hash(input.password ?? config.defaultEmployeePassword, 12);
  const created = await EmployeeModel.create({
    ...input,
    reportingManager: input.reportingManager ?? null,
    passwordHash
  });
  return toEmployeeResponse(created);
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
  actor: AuthenticatedUser
): Promise<EmployeeResponse> {
  if (config.demoMode) return updateDemoEmployee(id, input, actor);

  assertEmployeeUpdateScope(actor, id, input);
  if (actor.role !== "EMPLOYEE") ensureElevated(actor);
  ensureCanAssignRole(actor, input.role);

  const target = await EmployeeModel.findOne({ _id: id, isDeleted: false }).select("+passwordHash");
  if (!target) throw new NotFoundError("Employee");
  if (actor.role === "HR_MANAGER" && target.role === "SUPER_ADMIN") {
    throw new ForbiddenError("HR Managers cannot modify Super Admin users");
  }

  await assertUniqueEmployee(input, id);
  await ensureManagerExists(input.reportingManager ?? undefined);
  if (input.reportingManager && input.reportingManager === id) {
    throw new BadRequestError("Employee cannot report to themselves");
  }
  if (input.reportingManager && (await wouldCreateCycleFromDatabase(id, input.reportingManager))) {
    throw new BadRequestError("Reporting manager assignment would create a circular hierarchy");
  }

  const updates: Record<string, unknown> = { ...input };
  if (input.password) {
    updates.passwordHash = await bcrypt.hash(input.password, 12);
    delete updates.password;
  }

  Object.assign(target, updates);
  await target.save();
  await target.populate("reportingManager", "name employeeId");
  return toEmployeeResponse(target);
}

export async function softDeleteEmployee(id: string, actor: AuthenticatedUser): Promise<void> {
  if (config.demoMode) {
    softDeleteDemoEmployee(id, actor);
    return;
  }

  if (actor.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Only a Super Admin can delete employees");
  }
  if (actor.id === id) {
    throw new BadRequestError("You cannot delete your own account");
  }
  const employee = await EmployeeModel.findOne({ _id: id, isDeleted: false });
  if (!employee) throw new NotFoundError("Employee");
  employee.isDeleted = true;
  employee.status = "INACTIVE";
  await employee.save();
  await EmployeeModel.updateMany({ reportingManager: id }, { $set: { reportingManager: null } });
}

export async function updateEmployeeManager(
  id: string,
  managerId: string | null,
  actor: AuthenticatedUser
): Promise<EmployeeResponse> {
  if (config.demoMode) return updateDemoEmployeeManager(id, managerId, actor);

  ensureElevated(actor);
  const employee = await EmployeeModel.findOne({ _id: id, isDeleted: false });
  if (!employee) throw new NotFoundError("Employee");
  if (actor.role === "HR_MANAGER" && employee.role === "SUPER_ADMIN") {
    throw new ForbiddenError("HR Managers cannot modify Super Admin users");
  }
  if (managerId === id) throw new BadRequestError("Employee cannot report to themselves");
  await ensureManagerExists(managerId);
  if (managerId && (await wouldCreateCycleFromDatabase(id, managerId))) {
    throw new BadRequestError("Reporting manager assignment would create a circular hierarchy");
  }

  employee.reportingManager = managerId ? new Types.ObjectId(managerId) : null;
  await employee.save();
  await employee.populate("reportingManager", "name employeeId");
  return toEmployeeResponse(employee);
}

export async function getDirectReportees(id: string, actor: AuthenticatedUser): Promise<EmployeeResponse[]> {
  if (config.demoMode) return getDemoDirectReportees(id, actor);

  ensureEmployeeOwnProfileOnly(actor, id);
  const employee = await EmployeeModel.exists({ _id: id, isDeleted: false });
  if (!employee) throw new NotFoundError("Employee");
  const reportees = await EmployeeModel.find({ reportingManager: id, isDeleted: false }).sort({ name: 1 }).lean();
  return reportees.map(toEmployeeResponse);
}

export async function importEmployeesFromRows(
  rows: Record<string, string>[],
  actor: AuthenticatedUser
): Promise<{ created: number; failed: { row: number; reason: string }[] }> {
  ensureElevated(actor);
  let created = 0;
  const failed: { row: number; reason: string }[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const createdEmployee = employeeCreateSchema.parse({
        employeeId: row.employeeId ?? row["Employee ID"],
        name: row.name ?? row.Name,
        email: row.email ?? row.Email,
        phone: row.phone ?? row.Phone,
        department: row.department ?? row.Department,
        designation: row.designation ?? row.Designation,
        salary: row.salary ?? row.Salary,
        joiningDate: row.joiningDate ?? row["Joining Date"],
        status: row.status ?? row.Status ?? "ACTIVE",
        role: row.role ?? row.Role ?? "EMPLOYEE",
        profileImage: row.profileImage ?? row["Profile Image"] ?? "",
        password: row.password ?? undefined
      });
      await createEmployee(createdEmployee, actor);
      created += 1;
    } catch (error) {
      failed.push({ row: index + 2, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  return { created, failed };
}
