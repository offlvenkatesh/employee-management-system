import type { Employee } from "./employee.model";

export interface EmployeeResponse {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: string;
  role: string;
  reportingManager: string | null;
  reportingManagerName?: string;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

function idFrom(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export function toEmployeeResponse(employee: Employee | Record<string, unknown>): EmployeeResponse {
  const raw = typeof (employee as { toObject?: () => unknown }).toObject === "function"
    ? ((employee as { toObject: () => unknown }).toObject() as Record<string, unknown>)
    : (employee as Record<string, unknown>);
  const manager = raw.reportingManager as Record<string, unknown> | string | null | undefined;

  return {
    id: String(raw._id),
    employeeId: String(raw.employeeId),
    name: String(raw.name),
    email: String(raw.email),
    phone: String(raw.phone),
    department: String(raw.department),
    designation: String(raw.designation),
    salary: Number(raw.salary),
    joiningDate: new Date(raw.joiningDate as string | Date).toISOString(),
    status: String(raw.status),
    role: String(raw.role),
    reportingManager: idFrom(manager),
    reportingManagerName:
      typeof manager === "object" && manager !== null && "name" in manager ? String(manager.name) : undefined,
    profileImage: raw.profileImage ? String(raw.profileImage) : "",
    createdAt: new Date(raw.createdAt as string | Date).toISOString(),
    updatedAt: new Date(raw.updatedAt as string | Date).toISOString()
  };
}
