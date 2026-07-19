import bcrypt from "bcryptjs";
import { config } from "../config/env";
import type { EmployeeCreateInput, EmployeeQueryInput, EmployeeUpdateInput } from "../employees/employee.schemas";
import { toEmployeeResponse, type EmployeeResponse } from "../employees/employee.serializer";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../shared/errors";
import type { EmployeeStatus, Role } from "../shared/roles";
import type { AuthenticatedUser } from "../types/express";

interface DemoSeedEmployee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: EmployeeStatus;
  role: Role;
  managerEmployeeId?: string;
  password: string;
}

export interface DemoEmployeeRecord {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: EmployeeStatus;
  role: Role;
  reportingManager: string | null;
  profileImage: string;
  passwordHash: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoOrganizationNode extends EmployeeResponse {
  children: DemoOrganizationNode[];
}

const seedEmployees: DemoSeedEmployee[] = [
  {
    employeeId: "EMS-0001",
    name: "Anika Rao",
    email: "admin@ems.test",
    phone: "+1 555 0100",
    department: "Executive",
    designation: "Chief Operating Officer",
    salary: 240000,
    joiningDate: "2020-01-10",
    status: "ACTIVE",
    role: "SUPER_ADMIN",
    password: "Admin@123"
  },
  {
    employeeId: "EMS-0002",
    name: "Marcus Lee",
    email: "hr@ems.test",
    phone: "+1 555 0101",
    department: "People Operations",
    designation: "HR Manager",
    salary: 135000,
    joiningDate: "2021-03-15",
    status: "ACTIVE",
    role: "HR_MANAGER",
    managerEmployeeId: "EMS-0001",
    password: "Hr@12345"
  },
  {
    employeeId: "EMS-0003",
    name: "Priya Menon",
    email: "employee@ems.test",
    phone: "+1 555 0102",
    department: "Engineering",
    designation: "Frontend Engineer",
    salary: 118000,
    joiningDate: "2022-06-20",
    status: "ACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0002",
    password: "Employee@123"
  },
  {
    employeeId: "EMS-0004",
    name: "Noah Patel",
    email: "noah@ems.test",
    phone: "+1 555 0103",
    department: "Engineering",
    designation: "Backend Engineer",
    salary: 124000,
    joiningDate: "2022-09-05",
    status: "ACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0002",
    password: config.defaultEmployeePassword
  },
  {
    employeeId: "EMS-0005",
    name: "Sofia Chen",
    email: "sofia@ems.test",
    phone: "+1 555 0104",
    department: "Finance",
    designation: "Finance Analyst",
    salary: 98000,
    joiningDate: "2023-02-13",
    status: "ACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0001",
    password: config.defaultEmployeePassword
  },
  {
    employeeId: "EMS-0006",
    name: "Ethan Carter",
    email: "ethan@ems.test",
    phone: "+1 555 0105",
    department: "Sales",
    designation: "Account Executive",
    salary: 105000,
    joiningDate: "2023-11-01",
    status: "INACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0002",
    password: config.defaultEmployeePassword
  }
];

const employees = new Map<string, DemoEmployeeRecord>();
let nextEmployeeId = seedEmployees.length + 1;

const demoBcryptRounds = 8;
const elevatedRoles: Role[] = ["SUPER_ADMIN", "HR_MANAGER"];
const employeeEditableFields = new Set(["phone", "profileImage"]);

function objectIdFromNumber(value: number): string {
  return value.toString(16).padStart(24, "0");
}

function isElevated(role: Role): boolean {
  return elevatedRoles.includes(role);
}

function ensureElevated(actor: AuthenticatedUser): void {
  if (!isElevated(actor.role)) throw new ForbiddenError();
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
  const invalidField = Object.keys(input).find((field) => !employeeEditableFields.has(field));
  if (invalidField) throw new ForbiddenError("Employees can only update phone and profile image");
}

function activeEmployees(): DemoEmployeeRecord[] {
  seedDemoEmployees();
  return Array.from(employees.values()).filter((employee) => !employee.isDeleted);
}

function assertUniqueEmployee(input: Partial<EmployeeCreateInput>, existingId?: string): void {
  const email = input.email?.toLowerCase();
  const match = activeEmployees().find(
    (employee) =>
      employee._id !== existingId &&
      ((email && employee.email === email) || (input.employeeId && employee.employeeId === input.employeeId))
  );
  if (match) throw new ConflictError("Employee ID or email already exists");
}

function ensureManagerExists(managerId?: string | null): void {
  if (!managerId) return;
  const manager = employees.get(managerId);
  if (!manager || manager.isDeleted) throw new BadRequestError("Reporting manager does not exist");
}

function wouldCreateCycle(employeeId: string, managerId: string | null | undefined): boolean {
  if (!managerId) return false;
  const visited = new Set<string>();
  let cursor: string | null = managerId;

  while (cursor) {
    if (cursor === employeeId) return true;
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = employees.get(cursor)?.reportingManager ?? null;
  }

  return false;
}

function serializableEmployee(employee: DemoEmployeeRecord): Record<string, unknown> {
  const manager = employee.reportingManager ? employees.get(employee.reportingManager) : undefined;
  return {
    ...employee,
    reportingManager:
      manager && !manager.isDeleted ? { _id: manager._id, name: manager.name, employeeId: manager.employeeId } : null
  };
}

function toDemoEmployeeResponse(employee: DemoEmployeeRecord): EmployeeResponse {
  return toEmployeeResponse(serializableEmployee(employee));
}

function touch(employee: DemoEmployeeRecord): void {
  employee.updatedAt = new Date();
}

function seedDemoEmployees(): void {
  if (employees.size > 0) return;
  const idByEmployeeId = new Map<string, string>();

  for (const [index, seedEmployee] of seedEmployees.entries()) {
    const id = objectIdFromNumber(index + 1);
    idByEmployeeId.set(seedEmployee.employeeId, id);
    const createdAt = new Date(seedEmployee.joiningDate);
    employees.set(id, {
      _id: id,
      employeeId: seedEmployee.employeeId,
      name: seedEmployee.name,
      email: seedEmployee.email.toLowerCase(),
      phone: seedEmployee.phone,
      department: seedEmployee.department,
      designation: seedEmployee.designation,
      salary: seedEmployee.salary,
      joiningDate: new Date(seedEmployee.joiningDate),
      status: seedEmployee.status,
      role: seedEmployee.role,
      reportingManager: null,
      profileImage: "",
      passwordHash: bcrypt.hashSync(seedEmployee.password, demoBcryptRounds),
      isDeleted: false,
      createdAt,
      updatedAt: createdAt
    });
  }

  for (const seedEmployee of seedEmployees) {
    if (!seedEmployee.managerEmployeeId) continue;
    const employeeId = idByEmployeeId.get(seedEmployee.employeeId);
    const managerId = idByEmployeeId.get(seedEmployee.managerEmployeeId);
    if (!employeeId || !managerId) continue;
    const employee = employees.get(employeeId);
    if (employee) employee.reportingManager = managerId;
  }
}

export function getDemoEmployeeById(id: string): DemoEmployeeRecord | null {
  seedDemoEmployees();
  const employee = employees.get(id);
  return employee && !employee.isDeleted ? employee : null;
}

export function getDemoEmployeeByEmail(email: string): DemoEmployeeRecord | null {
  return activeEmployees().find((employee) => employee.email === email.toLowerCase()) ?? null;
}

export function getDemoAuthenticatedUser(id: string): AuthenticatedUser | null {
  const employee = getDemoEmployeeById(id);
  if (!employee || employee.status !== "ACTIVE") return null;
  return {
    id: employee._id,
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    role: employee.role
  };
}

export function serializeDemoEmployeeById(id: string): EmployeeResponse | null {
  const employee = getDemoEmployeeById(id);
  return employee ? toDemoEmployeeResponse(employee) : null;
}

export function serializeDemoEmployee(employee: DemoEmployeeRecord): EmployeeResponse {
  return toDemoEmployeeResponse(employee);
}

export function listDemoEmployees(query: EmployeeQueryInput, actor: AuthenticatedUser) {
  let filtered = activeEmployees();
  if (actor.role === "EMPLOYEE") filtered = filtered.filter((employee) => employee._id === actor.id);

  if (query.search) {
    const search = query.search.toLowerCase();
    filtered = filtered.filter(
      (employee) => employee.name.toLowerCase().includes(search) || employee.email.toLowerCase().includes(search)
    );
  }
  if (query.department) filtered = filtered.filter((employee) => employee.department === query.department);
  if (query.role) filtered = filtered.filter((employee) => employee.role === query.role);
  if (query.status) filtered = filtered.filter((employee) => employee.status === query.status);

  filtered.sort((left, right) => {
    const direction = query.sortOrder === "asc" ? 1 : -1;
    if (query.sortBy === "name") return left.name.localeCompare(right.name) * direction;
    return (left.joiningDate.getTime() - right.joiningDate.getTime()) * direction;
  });

  const total = filtered.length;
  const start = (query.page - 1) * query.limit;
  const page = filtered.slice(start, start + query.limit);

  return {
    data: page.map(toDemoEmployeeResponse),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit))
    }
  };
}

export function getDemoEmployeeResponseById(id: string, actor: AuthenticatedUser): EmployeeResponse {
  ensureEmployeeOwnProfileOnly(actor, id);
  const employee = getDemoEmployeeById(id);
  if (!employee) throw new NotFoundError("Employee");
  return toDemoEmployeeResponse(employee);
}

export function createDemoEmployee(input: EmployeeCreateInput, actor: AuthenticatedUser): EmployeeResponse {
  ensureElevated(actor);
  ensureCanAssignRole(actor, input.role);
  assertUniqueEmployee(input);
  ensureManagerExists(input.reportingManager ?? null);

  const now = new Date();
  const id = objectIdFromNumber(nextEmployeeId++);
  const employee: DemoEmployeeRecord = {
    _id: id,
    employeeId: input.employeeId,
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    department: input.department,
    designation: input.designation,
    salary: input.salary,
    joiningDate: input.joiningDate,
    status: input.status ?? "ACTIVE",
    role: input.role ?? "EMPLOYEE",
    reportingManager: input.reportingManager ?? null,
    profileImage: input.profileImage ?? "",
    passwordHash: bcrypt.hashSync(input.password ?? config.defaultEmployeePassword, demoBcryptRounds),
    isDeleted: false,
    createdAt: now,
    updatedAt: now
  };
  employees.set(id, employee);
  return toDemoEmployeeResponse(employee);
}

export function updateDemoEmployee(
  id: string,
  input: EmployeeUpdateInput,
  actor: AuthenticatedUser
): EmployeeResponse {
  assertEmployeeUpdateScope(actor, id, input);
  if (actor.role !== "EMPLOYEE") ensureElevated(actor);
  ensureCanAssignRole(actor, input.role);

  const employee = getDemoEmployeeById(id);
  if (!employee) throw new NotFoundError("Employee");
  if (actor.role === "HR_MANAGER" && employee.role === "SUPER_ADMIN") {
    throw new ForbiddenError("HR Managers cannot modify Super Admin users");
  }

  assertUniqueEmployee(input, id);
  ensureManagerExists(input.reportingManager ?? undefined);
  if (input.reportingManager && input.reportingManager === id) {
    throw new BadRequestError("Employee cannot report to themselves");
  }
  if (input.reportingManager && wouldCreateCycle(id, input.reportingManager)) {
    throw new BadRequestError("Reporting manager assignment would create a circular hierarchy");
  }

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || key === "password") continue;
    (employee as unknown as Record<string, unknown>)[key] = value;
  }
  if (input.password) employee.passwordHash = bcrypt.hashSync(input.password, demoBcryptRounds);
  touch(employee);
  return toDemoEmployeeResponse(employee);
}

export function softDeleteDemoEmployee(id: string, actor: AuthenticatedUser): void {
  if (actor.role !== "SUPER_ADMIN") throw new ForbiddenError("Only a Super Admin can delete employees");
  if (actor.id === id) throw new BadRequestError("You cannot delete your own account");

  const employee = getDemoEmployeeById(id);
  if (!employee) throw new NotFoundError("Employee");
  employee.isDeleted = true;
  employee.status = "INACTIVE";
  touch(employee);

  for (const reportee of employees.values()) {
    if (reportee.reportingManager === id) {
      reportee.reportingManager = null;
      touch(reportee);
    }
  }
}

export function updateDemoEmployeeManager(
  id: string,
  managerId: string | null,
  actor: AuthenticatedUser
): EmployeeResponse {
  ensureElevated(actor);
  const employee = getDemoEmployeeById(id);
  if (!employee) throw new NotFoundError("Employee");
  if (actor.role === "HR_MANAGER" && employee.role === "SUPER_ADMIN") {
    throw new ForbiddenError("HR Managers cannot modify Super Admin users");
  }
  if (managerId === id) throw new BadRequestError("Employee cannot report to themselves");
  ensureManagerExists(managerId);
  if (managerId && wouldCreateCycle(id, managerId)) {
    throw new BadRequestError("Reporting manager assignment would create a circular hierarchy");
  }

  employee.reportingManager = managerId;
  touch(employee);
  return toDemoEmployeeResponse(employee);
}

export function getDemoDirectReportees(id: string, actor: AuthenticatedUser): EmployeeResponse[] {
  ensureEmployeeOwnProfileOnly(actor, id);
  if (!getDemoEmployeeById(id)) throw new NotFoundError("Employee");
  return activeEmployees()
    .filter((employee) => employee.reportingManager === id)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(toDemoEmployeeResponse);
}

export function getDemoDashboardStats(actor: AuthenticatedUser) {
  const visibleEmployees = actor.role === "EMPLOYEE"
    ? activeEmployees().filter((employee) => employee._id === actor.id)
    : activeEmployees();
  const active = visibleEmployees.filter((employee) => employee.status === "ACTIVE");
  const inactive = visibleEmployees.filter((employee) => employee.status === "INACTIVE");
  const departments = new Set(visibleEmployees.map((employee) => employee.department));
  const roleCounts = new Map<Role, number>();

  for (const employee of visibleEmployees) {
    roleCounts.set(employee.role, (roleCounts.get(employee.role) ?? 0) + 1);
  }

  return {
    totalEmployees: visibleEmployees.length,
    activeEmployees: active.length,
    inactiveEmployees: inactive.length,
    departmentCount: departments.size,
    roleBreakdown: Array.from(roleCounts.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([role, count]) => ({ role, count })),
    recentEmployees: [...visibleEmployees]
      .sort((left, right) => right.joiningDate.getTime() - left.joiningDate.getTime())
      .slice(0, 5)
      .map(toDemoEmployeeResponse)
  };
}

export function getDemoOrganizationTree(actor: AuthenticatedUser): DemoOrganizationNode[] {
  const nodes = new Map<string, DemoOrganizationNode>();
  const sortedEmployees = activeEmployees().sort((left, right) => left.name.localeCompare(right.name));

  for (const employee of sortedEmployees) {
    nodes.set(employee._id, { ...toDemoEmployeeResponse(employee), children: [] });
  }

  const roots: DemoOrganizationNode[] = [];
  for (const node of nodes.values()) {
    if (node.reportingManager && nodes.has(node.reportingManager)) {
      nodes.get(node.reportingManager)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  if (actor.role === "EMPLOYEE") {
    const ownNode = nodes.get(actor.id);
    return ownNode ? [ownNode] : [];
  }

  return roots;
}
