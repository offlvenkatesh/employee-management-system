export const ROLES = ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof STATUSES)[number];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_MANAGER: "HR Manager",
  EMPLOYEE: "Employee"
};
