import type { EmployeeStatus, Role } from "../types";
import { roleLabels, statusLabels } from "../types";

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        status === "ACTIVE"
          ? "bg-moss/10 text-moss dark:bg-moss/20 dark:text-green-200"
          : "bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-300"
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    SUPER_ADMIN: "bg-clay/10 text-clay dark:bg-clay/20 dark:text-orange-200",
    HR_MANAGER: "bg-ocean/10 text-ocean dark:bg-ocean/20 dark:text-blue-200",
    EMPLOYEE: "bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-300"
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[role]}`}>{roleLabels[role]}</span>;
}
