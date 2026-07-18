export type Role = "SUPER_ADMIN" | "HR_MANAGER" | "EMPLOYEE";
export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface Employee {
  id: string;
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
  reportingManager: string | null;
  reportingManagerName?: string;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  roleBreakdown: { role: Role; count: number }[];
  recentEmployees: Employee[];
}

export interface OrganizationNode extends Employee {
  children: OrganizationNode[];
}

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_MANAGER: "HR Manager",
  EMPLOYEE: "Employee"
};

export const statusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive"
};
