import type { FilterQuery } from "mongoose";
import { config } from "../config/env";
import { getDemoDashboardStats } from "../demo/demo-store";
import type { AuthenticatedUser } from "../types/express";
import { EmployeeModel, type Employee } from "../employees/employee.model";
import { toEmployeeResponse } from "../employees/employee.serializer";

export async function getDashboardStats(actor: AuthenticatedUser) {
  if (config.demoMode) return getDemoDashboardStats(actor);

  const baseFilter: FilterQuery<Employee> = { isDeleted: false };
  if (actor.role === "EMPLOYEE") baseFilter._id = actor.id;

  const [totalEmployees, activeEmployees, inactiveEmployees, departments, roleBreakdown, recentEmployees] =
    await Promise.all([
      EmployeeModel.countDocuments(baseFilter),
      EmployeeModel.countDocuments({ ...baseFilter, status: "ACTIVE" }),
      EmployeeModel.countDocuments({ ...baseFilter, status: "INACTIVE" }),
      EmployeeModel.distinct("department", baseFilter),
      EmployeeModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      EmployeeModel.find(baseFilter).sort({ joiningDate: -1 }).limit(5).lean()
    ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    departmentCount: departments.length,
    roleBreakdown: roleBreakdown.map((row) => ({ role: row._id, count: row.count })),
    recentEmployees: recentEmployees.map(toEmployeeResponse)
  };
}
